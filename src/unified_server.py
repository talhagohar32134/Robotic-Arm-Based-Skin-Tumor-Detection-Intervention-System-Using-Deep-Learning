#!/usr/bin/env python3
"""
MedTwin Pro - Unified Server
============================

Single-command startup for the complete MedTwin Pro system:
- WebSocket server (port 8765) for arm control
- HTTP API (port 5000) for ML classification
- MJPEG stream (port 8080) for camera feed

Usage:
    python src/unified_server.py                    # TFLite model (default)
    python src/unified_server.py --model keras      # Keras model
    python src/unified_server.py --no-arm           # Without arm hardware
    python src/unified_server.py --no-camera        # Without camera
    python src/unified_server.py --dev              # Development mode (no hardware)

All services run in a single async process for efficiency on Raspberry Pi.
"""

import argparse
import asyncio
import logging
import signal
import sys
import os
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from aiohttp import web

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('medtwin')


class UnifiedServer:
    """Main server combining WebSocket, HTTP, and MJPEG streaming."""

    def __init__(self, config: dict):
        """Initialize unified server.

        Args:
            config: Configuration dictionary
        """
        self.config = config
        self.arm = None
        self.camera = None
        self.model_factory = None
        self.ws_handler = None
        self.http_handler = None
        self.streamer = None

    async def setup(self):
        """Initialize all components."""
        logger.info("Initializing MedTwin Pro components...")

        # Initialize hardware (arm controller)
        if not self.config.get('no_arm'):
            try:
                from src.hardware.arm_controller import ArmController
                self.arm = ArmController()
                self.arm.home()
                logger.info("Arm controller initialized")
            except Exception as e:
                logger.warning(f"Arm init failed: {e}")
                logger.warning("Running without arm hardware (simulation mode)")
                self.arm = None
        else:
            logger.info("Arm disabled (--no-arm)")

        # Initialize camera
        if not self.config.get('no_camera'):
            try:
                from src.detection.camera import Camera
                self.camera = Camera(
                    camera_index=self.config.get('camera_index', 0),
                    width=self.config.get('camera_width', 640),
                    height=self.config.get('camera_height', 480)
                )
                logger.info("Camera initialized")
            except Exception as e:
                logger.warning(f"Camera init failed: {e}")
                logger.warning("Using dummy camera for testing")
                from src.streaming.mjpeg_streamer import DummyCamera
                self.camera = DummyCamera()
        else:
            logger.info("Camera disabled (--no-camera)")
            from src.streaming.mjpeg_streamer import DummyCamera
            self.camera = DummyCamera()

        # Initialize model factory
        from src.detection.model_factory import ModelFactory
        self.model_factory = ModelFactory(
            tflite_path=self.config.get('tflite_model'),
            keras_path=self.config.get('keras_model'),
            default_type=self.config.get('model_type', 'tflite'),
            threshold=self.config.get('threshold', 0.5)
        )

        # Preload default model
        try:
            self.model_factory.preload()
        except Exception as e:
            logger.error(f"Model preload failed: {e}")

        # Initialize handlers
        from src.hardware import angle_converter
        from src.server.websocket_handler import ArmWebSocketHandler
        from src.server.http_handler import ClassificationHandler, ServoControlHandler, create_cors_middleware
        from src.streaming.mjpeg_streamer import MJPEGStreamer

        self.ws_handler = ArmWebSocketHandler(
            arm_controller=self.arm,
            angle_converter=angle_converter
        )

        self.http_handler = ClassificationHandler(
            model_factory=self.model_factory,
            camera=self.camera
        )

        self.servo_handler = ServoControlHandler(
            arm_controller=self.arm
        )

        if self.camera:
            self.streamer = MJPEGStreamer(
                camera=self.camera,
                fps=self.config.get('camera_fps', 30),
                quality=self.config.get('jpeg_quality', 80)
            )

        logger.info("All components initialized")

    def create_apps(self) -> dict:
        """Create aiohttp applications for each port.

        Returns:
            Dict mapping port numbers to applications
        """
        from src.server.http_handler import create_cors_middleware

        apps = {}

        # WebSocket app (port 8765)
        ws_app = web.Application()
        ws_app.router.add_get('/', self.ws_handler.handle_connection)
        ws_app.router.add_get('/ws', self.ws_handler.handle_connection)
        apps[8765] = ws_app

        # HTTP API app (port 5000)
        http_app = web.Application(middlewares=[create_cors_middleware()])
        http_app.router.add_post('/classify', self.http_handler.classify)
        http_app.router.add_get('/health', self.http_handler.health)
        http_app.router.add_get('/model-info', self.http_handler.model_info)
        # Direct servo control (for testing)
        http_app.router.add_get('/servo', self.servo_handler.move_servo)
        http_app.router.add_get('/servo/home', self.servo_handler.home_servos)
        # Handle OPTIONS for CORS preflight
        http_app.router.add_route('OPTIONS', '/classify', self._options_handler)
        apps[5000] = http_app

        # MJPEG stream app (port 8080)
        if self.streamer:
            stream_app = web.Application()
            stream_app.router.add_get('/stream.mjpg', self.streamer.stream)
            stream_app.router.add_get('/snapshot.jpg', self.streamer.snapshot)
            stream_app.router.add_get('/status', self.streamer.status)
            apps[8080] = stream_app

        return apps

    async def _options_handler(self, request: web.Request) -> web.Response:
        """Handle CORS preflight requests."""
        return web.Response(
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            }
        )

    async def cleanup(self):
        """Cleanup resources on shutdown."""
        logger.info("Cleaning up...")

        if self.ws_handler:
            self.ws_handler.shutdown()

        if self.arm:
            try:
                self.arm.shutdown()
                logger.info("Arm controller shut down")
            except Exception as e:
                logger.error(f"Arm shutdown error: {e}")

        if self.camera and hasattr(self.camera, 'release'):
            try:
                self.camera.release()
                logger.info("Camera released")
            except Exception as e:
                logger.error(f"Camera release error: {e}")

        logger.info("Cleanup complete")


async def run_server(config: dict):
    """Run the unified server.

    Args:
        config: Configuration dictionary
    """
    server = UnifiedServer(config)
    await server.setup()

    apps = server.create_apps()
    runners = []
    sites = []

    # Start each app on its port
    for port, app in apps.items():
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', port)
        await site.start()
        runners.append(runner)
        sites.append(site)
        logger.info(f"Server started on port {port}")

    # Print startup banner
    print()
    print("=" * 60)
    print("  MedTwin Pro - Unified Server Running")
    print("=" * 60)
    print()
    print(f"  Model:           {config.get('model_type', 'tflite').upper()}")
    print(f"  Arm Hardware:    {'Enabled' if server.arm else 'Simulation'}")
    print(f"  Camera:          {'Enabled' if server.camera else 'Disabled'}")
    print()
    print("  Services:")
    print(f"    WebSocket:     ws://raspberrypi.local:8765")
    print(f"    HTTP API:      http://raspberrypi.local:5000")
    if server.streamer:
        print(f"    Camera Stream: http://raspberrypi.local:8080/stream.mjpg")
    print()
    print("  Frontend: Open http://raspberrypi.local:5173 in browser")
    print()
    print("  Press Ctrl+C to stop")
    print("=" * 60)
    print()

    # Handle shutdown signals
    stop_event = asyncio.Event()

    def signal_handler():
        logger.info("Shutdown signal received")
        stop_event.set()

    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, signal_handler)
        except NotImplementedError:
            # Windows doesn't support add_signal_handler
            pass

    # Wait for shutdown
    try:
        await stop_event.wait()
    except KeyboardInterrupt:
        pass

    # Cleanup
    print("\nShutting down...")
    for runner in runners:
        await runner.cleanup()
    await server.cleanup()
    print("Goodbye!")


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description='MedTwin Pro Unified Server',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python src/unified_server.py                  # Start with TFLite (default)
  python src/unified_server.py --model keras    # Use Keras model
  python src/unified_server.py --dev            # Development mode (no hardware)
  python src/unified_server.py --no-arm         # Without arm hardware
        """
    )
    parser.add_argument(
        '--model', '-m',
        choices=['tflite', 'keras'],
        default='tflite',
        help='ML model backend: tflite (fast, default) or keras (accurate)'
    )
    parser.add_argument(
        '--no-camera',
        action='store_true',
        help='Run without camera (uses test pattern)'
    )
    parser.add_argument(
        '--no-arm',
        action='store_true',
        help='Run without robotic arm hardware (simulation mode)'
    )
    parser.add_argument(
        '--dev',
        action='store_true',
        help='Development mode (equivalent to --no-arm --no-camera)'
    )
    parser.add_argument(
        '--threshold', '-t',
        type=float,
        default=0.5,
        help='Classification confidence threshold (default: 0.5)'
    )
    parser.add_argument(
        '--camera-index',
        type=int,
        default=0,
        help='Camera device index (default: 0)'
    )

    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_args()

    # Handle dev mode
    if args.dev:
        args.no_arm = True
        args.no_camera = True

    # Build config
    config = {
        'model_type': args.model,
        'no_camera': args.no_camera,
        'no_arm': args.no_arm,
        'threshold': args.threshold,
        'camera_index': args.camera_index,
        'camera_width': 640,
        'camera_height': 480,
        'camera_fps': 30,
        'jpeg_quality': 80,
        'tflite_model': str(PROJECT_ROOT / 'models' / 'tumor_detection_model.tflite'),
        'keras_model': str(PROJECT_ROOT / 'full-app-code' / 'densenet121_skin_lesion.keras'),
    }

    # Run server
    try:
        asyncio.run(run_server(config))
    except KeyboardInterrupt:
        print("\nInterrupted")
        sys.exit(0)


if __name__ == '__main__':
    main()
