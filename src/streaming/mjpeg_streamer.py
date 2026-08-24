"""MJPEG streaming server for live camera feed.

This module provides Motion JPEG streaming for the frontend's
CompactVideoFeed component. It captures frames from the camera,
encodes them as JPEG, and streams them as a multipart response.

The stream URL is: http://raspberrypi.local:8080/stream.mjpg
"""

import asyncio
import logging
import time
from typing import Optional

from aiohttp import web
import cv2

logger = logging.getLogger(__name__)


class MJPEGStreamer:
    """MJPEG streaming handler for camera feed."""

    def __init__(
        self,
        camera,
        fps: int = 30,
        quality: int = 80,
        width: Optional[int] = None,
        height: Optional[int] = None
    ):
        """Initialize MJPEG streamer.

        Args:
            camera: Camera instance with read_frame() method
            fps: Target frames per second (default 30)
            quality: JPEG quality 0-100 (default 80)
            width: Optional resize width
            height: Optional resize height
        """
        self.camera = camera
        self.fps = fps
        self.quality = quality
        self.resize = (width, height) if width and height else None
        self.frame_delay = 1.0 / fps

        # Stats
        self.active_streams = 0
        self.total_frames = 0
        self.last_fps = 0.0

    async def stream(self, request: web.Request) -> web.StreamResponse:
        """Handle MJPEG stream request.

        Returns a multipart response with continuous JPEG frames.

        Args:
            request: aiohttp request

        Returns:
            Streaming response
        """
        self.active_streams += 1
        client_id = id(request)
        logger.info(f"Stream client {client_id} connected. Active: {self.active_streams}")

        response = web.StreamResponse(
            status=200,
            headers={
                'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Connection': 'keep-alive',
            }
        )
        await response.prepare(request)

        frame_count = 0
        start_time = time.time()

        try:
            while True:
                loop_start = time.time()

                # Capture frame
                try:
                    frame = self.camera.read_frame()
                except Exception as e:
                    logger.error(f"Camera read error: {e}")
                    await asyncio.sleep(0.1)
                    continue

                # Resize if configured
                if self.resize:
                    frame = cv2.resize(frame, self.resize)

                # Encode as JPEG
                encode_params = [cv2.IMWRITE_JPEG_QUALITY, self.quality]
                success, jpeg = cv2.imencode('.jpg', frame, encode_params)

                if not success:
                    logger.warning("JPEG encode failed")
                    continue

                # Send frame as multipart chunk
                try:
                    await response.write(
                        b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n'
                        b'Content-Length: ' + str(len(jpeg)).encode() + b'\r\n'
                        b'\r\n' +
                        jpeg.tobytes() +
                        b'\r\n'
                    )
                except (ConnectionResetError, ConnectionError):
                    logger.info(f"Stream client {client_id} disconnected")
                    break

                frame_count += 1
                self.total_frames += 1

                # Calculate FPS every second
                elapsed = time.time() - start_time
                if elapsed >= 1.0:
                    self.last_fps = frame_count / elapsed
                    frame_count = 0
                    start_time = time.time()

                # Rate limiting
                frame_time = time.time() - loop_start
                sleep_time = self.frame_delay - frame_time
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)

        except asyncio.CancelledError:
            logger.info(f"Stream client {client_id} cancelled")
        except Exception as e:
            logger.exception(f"Stream error: {e}")
        finally:
            self.active_streams -= 1
            logger.info(f"Stream client {client_id} ended. Active: {self.active_streams}")

        return response

    async def snapshot(self, request: web.Request) -> web.Response:
        """Handle single snapshot request.

        Returns a single JPEG image.

        Args:
            request: aiohttp request

        Returns:
            JPEG image response
        """
        try:
            frame = self.camera.read_frame()

            if self.resize:
                frame = cv2.resize(frame, self.resize)

            encode_params = [cv2.IMWRITE_JPEG_QUALITY, self.quality]
            success, jpeg = cv2.imencode('.jpg', frame, encode_params)

            if not success:
                return web.Response(status=500, text="Failed to encode image")

            return web.Response(
                body=jpeg.tobytes(),
                content_type='image/jpeg',
                headers={
                    'Cache-Control': 'no-cache',
                }
            )

        except Exception as e:
            logger.exception(f"Snapshot error: {e}")
            return web.Response(status=500, text=str(e))

    async def status(self, request: web.Request) -> web.Response:
        """Get streaming status.

        Returns JSON with stream statistics.

        Args:
            request: aiohttp request

        Returns:
            JSON response
        """
        return web.json_response({
            'active_streams': self.active_streams,
            'total_frames': self.total_frames,
            'fps': round(self.last_fps, 1),
            'target_fps': self.fps,
            'quality': self.quality,
        })


class DummyCamera:
    """Dummy camera for testing without hardware."""

    def __init__(self, width: int = 640, height: int = 480):
        """Initialize dummy camera.

        Args:
            width: Frame width
            height: Frame height
        """
        self.width = width
        self.height = height
        self.frame_count = 0
        import numpy as np
        self.np = np

    def read_frame(self):
        """Generate a test pattern frame.

        Returns:
            BGR image with test pattern
        """
        self.frame_count += 1

        # Create gradient test pattern
        frame = self.np.zeros((self.height, self.width, 3), dtype=self.np.uint8)

        # Horizontal gradient
        for x in range(self.width):
            frame[:, x, 0] = int(x / self.width * 255)  # Blue
            frame[:, x, 1] = int((self.width - x) / self.width * 255)  # Green

        # Moving bar to show it's live
        bar_x = (self.frame_count * 5) % self.width
        frame[:, max(0, bar_x-5):min(self.width, bar_x+5), 2] = 255  # Red

        # Add frame counter text
        cv2.putText(
            frame,
            f"Frame: {self.frame_count}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (255, 255, 255),
            2
        )
        cv2.putText(
            frame,
            "No Camera - Test Pattern",
            (10, self.height - 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            1
        )

        return frame

    def is_opened(self):
        return True

    def release(self):
        pass
