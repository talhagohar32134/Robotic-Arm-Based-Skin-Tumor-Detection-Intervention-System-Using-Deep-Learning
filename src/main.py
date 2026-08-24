#!/usr/bin/env python3
"""Main entry point for robotic arm tumor detection system."""

import sys
import time
import argparse
import cv2

# Optional: tkinter for GUI popup (may not work over SSH)
try:
    import tkinter as tk
    from tkinter import messagebox
    TKINTER_AVAILABLE = True
except ImportError:
    TKINTER_AVAILABLE = False
    print("Warning: tkinter not available. User consent prompts disabled.")

from detection.tumor_detector import TumorDetector
from detection.camera import Camera
from hardware.arm_controller import ArmController


def get_user_consent():
    """Show GUI prompt for user consent to proceed with sampling.

    Returns:
        bool: True if user approves, False otherwise
    """
    if not TKINTER_AVAILABLE:
        # Fallback to console input
        print("\n" + "=" * 60)
        print("MALIGNANT TUMOR DETECTED!")
        print("=" * 60)
        response = input("Proceed with automated sampling? (yes/no): ").strip().lower()
        return response in ['yes', 'y']

    root = tk.Tk()
    root.withdraw()  # Hide main window
    result = messagebox.askyesno(
        "Malignant Tumor Detected",
        "A malignant tumor has been detected!\n\n"
        "Do you want to proceed with automated sampling?"
    )
    root.destroy()
    return result


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Robotic Arm Tumor Detection System"
    )
    parser.add_argument(
        '--model',
        type=str,
        default='/home/pi/Downloads/robotic-arm/models/tumor_detection_model.tflite',
        help='Path to TFLite model file'
    )
    parser.add_argument(
        '--camera',
        type=int,
        default=0,
        help='Camera device index (default: 0)'
    )
    parser.add_argument(
        '--threshold',
        type=float,
        default=0.1,
        help='Confidence threshold for malignant detection (default: 0.1)'
    )
    parser.add_argument(
        '--no-arm',
        action='store_true',
        help='Run without robotic arm (detection only)'
    )
    parser.add_argument(
        '--auto-sample',
        action='store_true',
        help='Automatically sample without asking for consent (use with caution!)'
    )
    return parser.parse_args()


def main():
    """Main application loop."""
    args = parse_args()

    print("=" * 60)
    print("Robotic Arm Tumor Detection System")
    print("=" * 60)

    # Initialize components
    detector = None
    camera = None
    arm = None

    try:
        # Load tumor detector
        print(f"\nLoading model: {args.model}")
        detector = TumorDetector(args.model, confidence_threshold=args.threshold)

        # Initialize camera
        print(f"\nInitializing camera {args.camera}...")
        camera = Camera(args.camera)

        # Initialize arm controller (if not disabled)
        if not args.no_arm:
            print("\nInitializing robotic arm...")
            try:
                arm = ArmController()
                arm.home()
            except Exception as e:
                print(f"Warning: Could not initialize arm: {e}")
                print("Continuing in detection-only mode...")
                arm = None
        else:
            print("\nRunning in detection-only mode (--no-arm)")

    except Exception as e:
        print(f"\nInitialization failed: {e}")
        return 1

    print("\n" + "=" * 60)
    print("System ready. Press 'q' to quit.")
    print("=" * 60 + "\n")

    # Main detection loop
    frame_count = 0
    last_detection_time = 0
    DETECTION_COOLDOWN = 10.0  # Seconds between detections to avoid spam

    try:
        while True:
            # Capture frame
            frame = camera.read_frame()
            frame_count += 1

            # Run detection every frame
            result = detector.detect(frame)

            # Display result on frame
            label_text = f"{result['label']} ({result['confidence']*100:.1f}%)"
            color = (0, 0, 255) if result['is_malignant'] else (0, 255, 0)  # BGR

            # Add text to frame
            cv2.putText(
                frame, label_text, (10, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3, cv2.LINE_AA
            )

            # Add frame counter
            cv2.putText(
                frame, f"Frame: {frame_count}", (10, frame.shape[0] - 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2
            )

            # Show frame
            cv2.imshow("Tumor Detection System", frame)

            # If malignant, trigger intervention
            current_time = time.time()
            if result['is_malignant'] and (current_time - last_detection_time) > DETECTION_COOLDOWN:
                print(f"\n[ALERT] MALIGNANT TUMOR DETECTED!")
                print(f"  Confidence: {result['confidence']*100:.1f}%")
                print(f"  Frame: {frame_count}")

                # Only proceed if arm is available
                if arm is not None:
                    # Get user consent (unless auto-sample mode)
                    proceed = args.auto_sample or get_user_consent()

                    if proceed:
                        print("\n  User approved sampling. Executing intervention...")
                        try:
                            arm.execute_sampling_sequence()
                            print("  Sampling complete. Returning to home position...")
                            arm.home()
                        except Exception as e:
                            print(f"  Error during sampling: {e}")
                    else:
                        print("  User declined sampling. Continuing monitoring...")
                else:
                    print("  Arm not available. Detection only.")

                # Update last detection time
                last_detection_time = current_time

                # Brief pause after detection
                time.sleep(2)

            # Check for quit (press 'q')
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') or key == 27:  # 'q' or ESC
                print("\nUser requested quit.")
                break

    except KeyboardInterrupt:
        print("\n\nInterrupted by user (Ctrl+C)")

    except Exception as e:
        print(f"\n\nError during operation: {e}")
        import traceback
        traceback.print_exc()
        return 1

    finally:
        # Cleanup
        print("\n" + "=" * 60)
        print("Shutting down...")
        print("=" * 60)

        if arm is not None:
            try:
                print("  Returning arm to home position...")
                arm.shutdown()
            except Exception as e:
                print(f"  Warning: Arm shutdown error: {e}")

        if camera is not None:
            print("  Releasing camera...")
            camera.release()

        print("Shutdown complete.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
