"""Camera handling for Raspberry Pi."""

import cv2


class Camera:
    """Camera interface using OpenCV."""

    def __init__(self, camera_index=0, width=640, height=480):
        """Initialize camera.

        Args:
            camera_index: Camera device index (0 for default)
            width: Frame width in pixels
            height: Frame height in pixels
        """
        self.camera_index = camera_index
        self.width = width
        self.height = height

        # Open camera
        self.cap = cv2.VideoCapture(camera_index)

        if not self.cap.isOpened():
            raise RuntimeError(
                f"Failed to open camera {camera_index}. "
                "Check connections and permissions."
            )

        # Set resolution
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)

        # Get actual resolution (may differ from requested)
        actual_width = self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        actual_height = self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)

        print(f"Camera {camera_index} opened successfully")
        print(f"Resolution: {int(actual_width)}x{int(actual_height)}")

    def read_frame(self):
        """Read a single frame from camera.

        Returns:
            frame: BGR image from camera

        Raises:
            RuntimeError: If frame capture fails
        """
        ret, frame = self.cap.read()

        if not ret:
            raise RuntimeError("Failed to read frame from camera")

        return frame

    def is_opened(self):
        """Check if camera is still open.

        Returns:
            bool: True if camera is open
        """
        return self.cap.isOpened()

    def release(self):
        """Release camera resources."""
        if self.cap.isOpened():
            self.cap.release()

        cv2.destroyAllWindows()
        print("Camera released")

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.release()
