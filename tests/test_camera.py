#!/usr/bin/env python3
"""Test camera capture."""

import cv2
import sys

print("="*60)
print("CAMERA TEST")
print("="*60)

CAMERA_INDEX = 0  # Try 0, 1, 2 if camera not found

print(f"\nAttempting to open camera {CAMERA_INDEX}...")

cap = cv2.VideoCapture(CAMERA_INDEX)

if not cap.isOpened():
    print(f"\nFAILED: Camera {CAMERA_INDEX} not detected")
    print("\nTroubleshooting:")
    print("  1. Check camera ribbon cable connection")
    print("  2. Verify camera is enabled:")
    print("     Run: vcgencmd get_camera")
    print("     Should show: supported=1 detected=1")
    print("  3. Enable camera if needed:")
    print("     sudo raspi-config -> Interface Options -> Camera -> Enable")
    print("  4. Try different camera index (0, 1, or 2)")
    print("  5. For Pi Camera, you may need libcamera:")
    print("     libcamera-hello --list-cameras")
    sys.exit(1)

# Get camera properties
width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
fps = cap.get(cv2.CAP_PROP_FPS)

print(f"\nSUCCESS: Camera opened!")
print(f"  Resolution: {int(width)}x{int(height)}")
print(f"  FPS: {fps}")
print("\nShowing live video feed...")
print("  - Press 'q' to quit")
print("  - Press 's' to save a snapshot\n")

frame_count = 0
snapshot_count = 0

try:
    while True:
        ret, frame = cap.read()

        if not ret:
            print("\nERROR: Failed to read frame")
            break

        frame_count += 1

        # Add frame counter to image
        cv2.putText(
            frame,
            f"Frame: {frame_count}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2
        )

        # Show frame
        cv2.imshow("Camera Test", frame)

        # Handle key presses
        key = cv2.waitKey(1) & 0xFF

        if key == ord('q') or key == 27:  # 'q' or ESC
            print("\nTest completed successfully!")
            break

        elif key == ord('s'):  # Save snapshot
            snapshot_count += 1
            filename = f"snapshot_{snapshot_count}.jpg"
            cv2.imwrite(filename, frame)
            print(f"  Saved: {filename}")

except KeyboardInterrupt:
    print("\n\nTest interrupted by user")

finally:
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    print(f"\nCamera released. Total frames: {frame_count}")

sys.exit(0)
