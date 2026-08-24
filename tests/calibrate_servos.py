#!/usr/bin/env python3
"""Interactive servo calibration tool - Map code angles to real-life positions."""

import sys
import time

# Add src directory to path
sys.path.insert(0, '/home/pi/Downloads/robotic-arm/src')

from hardware.arm_controller import ArmController


def print_header():
    """Print header information."""
    print()
    print('=' * 70)
    print('SERVO CALIBRATION TOOL')
    print('=' * 70)
    print()
    print('Purpose: Determine how code angles map to real-life servo positions')
    print()
    print('Available Servos:')
    print('  - base      (Channel 7)  - Rotation/Yaw')
    print('  - shoulder  (Channel 12) - Up/Down movement')
    print()
    print('Commands:')
    print('  - Enter servo name: base or shoulder')
    print('  - Enter angle: 0-180 degrees')
    print('  - Type "quit" or "exit" to stop')
    print('  - Type "home" to return both servos to 90°')
    print('  - Type "reset" to reset current servo to 90°')
    print()
    print('=' * 70)
    print()


def print_current_positions(current_base, current_shoulder):
    """Print current servo positions."""
    print()
    print('─' * 70)
    print(f'Current Positions: Base={current_base}°  |  Shoulder={current_shoulder}°')
    print('─' * 70)


def main():
    """Main calibration loop."""

    print_header()

    # Initialize arm
    print('Initializing arm controller...')
    try:
        arm = ArmController()
        print('✓ Arm controller initialized')
        print()
    except Exception as e:
        print(f'✗ Failed to initialize arm: {e}')
        return 1

    # Track current positions
    current_base = 90
    current_shoulder = 90

    # Move to starting position
    print('Moving to starting position (90°, 90°)...')
    arm.set_servo_angle('base', 90)
    time.sleep(1)
    arm.set_servo_angle('shoulder', 90)
    time.sleep(1)
    print('✓ Ready for calibration')
    print()
    print('TIP: Have a protractor or angle measuring tool ready!')
    print('      Take notes on actual physical angles vs code angles.')
    print()

    # Main calibration loop
    try:
        while True:
            print_current_positions(current_base, current_shoulder)
            print()

            # Get servo selection
            servo_input = input('Select servo (base/shoulder/home/quit): ').strip().lower()

            # Handle special commands
            if servo_input in ['quit', 'exit', 'q']:
                print()
                print('Exiting calibration mode...')
                break

            if servo_input == 'home':
                print()
                print('Returning both servos to home position (90°, 90°)...')
                arm.set_servo_angle('base', 90)
                time.sleep(1)
                arm.set_servo_angle('shoulder', 90)
                time.sleep(1)
                current_base = 90
                current_shoulder = 90
                print('✓ Home position reached')
                continue

            if servo_input == 'reset':
                print()
                print('Which servo to reset to 90°?')
                reset_servo = input('  Servo (base/shoulder): ').strip().lower()
                if reset_servo == 'base':
                    arm.set_servo_angle('base', 90)
                    current_base = 90
                    time.sleep(1)
                    print('✓ Base reset to 90°')
                elif reset_servo == 'shoulder':
                    arm.set_servo_angle('shoulder', 90)
                    current_shoulder = 90
                    time.sleep(1)
                    print('✓ Shoulder reset to 90°')
                else:
                    print('✗ Invalid servo name')
                continue

            # Validate servo name
            if servo_input not in ['base', 'shoulder']:
                print('✗ Invalid servo name. Use: base, shoulder, home, or quit')
                continue

            # Get angle
            try:
                angle_input = input(f'Enter angle for {servo_input} (0-180): ').strip()

                # Allow quit at angle prompt too
                if angle_input.lower() in ['quit', 'exit', 'q']:
                    print()
                    print('Exiting calibration mode...')
                    break

                angle = int(angle_input)

                # Validate angle range
                if not (0 <= angle <= 180):
                    print('✗ Angle must be between 0 and 180 degrees')
                    continue

            except ValueError:
                print('✗ Invalid angle. Please enter a number between 0 and 180')
                continue

            # Move servo
            print()
            print(f'Moving {servo_input.upper()} to {angle}°...')

            try:
                arm.set_servo_angle(servo_input, angle)

                # Update tracking
                if servo_input == 'base':
                    current_base = angle
                else:
                    current_shoulder = angle

                time.sleep(0.5)
                print(f'✓ {servo_input.upper()} moved to {angle}°')
                print()
                print('─' * 70)
                print('CALIBRATION NOTE:')
                print(f'  Code Angle: {angle}°')
                print(f'  Servo: {servo_input.upper()}')
                print(f'  Measure the ACTUAL physical angle and record it!')
                print('─' * 70)

            except Exception as e:
                print(f'✗ Error moving servo: {e}')

    except KeyboardInterrupt:
        print()
        print()
        print('Interrupted by user (Ctrl+C)')

    finally:
        # Return to home position on exit
        print()
        print('Returning to home position before exit...')
        try:
            arm.set_servo_angle('base', 90)
            time.sleep(1)
            arm.set_servo_angle('shoulder', 90)
            time.sleep(1)
            print('✓ Home position reached')
        except:
            pass

        print()
        print('=' * 70)
        print('CALIBRATION SESSION ENDED')
        print('=' * 70)
        print()
        print('Next Steps:')
        print('  1. Review your calibration notes')
        print('  2. Identify any offset between code angles and physical angles')
        print('  3. Update servo_config.py if adjustments are needed')
        print()

    return 0


if __name__ == '__main__':
    sys.exit(main())
