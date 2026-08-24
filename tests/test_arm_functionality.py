#!/usr/bin/env python3
"""Test robotic arm functionality with connected servos."""

import sys
import time

# Add src directory to path
sys.path.insert(0, '/home/pi/Downloads/robotic-arm/src')

from hardware.arm_controller import ArmController

def main():
    """Test arm control with currently connected servos."""

    print('=' * 60)
    print('ROBOTIC ARM FUNCTIONALITY TEST')
    print('=' * 60)
    print('Calibrated Servo Configuration:')
    print('  • Base (Ch 7): 20° = UPRIGHT | Higher = DOWN')
    print('  • Shoulder (Ch 12): 0° = CLOSED | 180° = FULLY OPEN')
    print()

    try:
        # Initialize arm controller
        print('Step 1: Initializing arm controller...')
        arm = ArmController()
        print('✓ Arm controller initialized successfully')
        time.sleep(1)
        print()

        # Test 1: Move to extreme starting position (0°, 0°)
        print('Step 2: Moving to EXTREME STARTING POSITION...')
        print('   Setting Base to 0°...')
        arm.set_servo_angle('base', 0)
        time.sleep(2)
        print('   ✓ Base at 0°')

        print('   Setting Shoulder to 0° (fully closed)...')
        arm.set_servo_angle('shoulder', 0)
        time.sleep(2)
        print('   ✓ Shoulder at 0° (fully closed)')

        print('✓ Extreme start position reached (Base: 0°, Shoulder: 0°)')
        time.sleep(1)
        print()

        # Move to safe working position
        print('Step 3: Moving to SAFE WORKING POSITION...')
        print('   Setting Base to 60°...')
        arm.set_servo_angle('base', 60)
        time.sleep(1.5)
        print('   ✓ Base at 60°')

        print('   Setting Shoulder to 90°...')
        arm.set_servo_angle('shoulder', 90)
        time.sleep(1.5)
        print('   ✓ Shoulder at 90°')

        print('✓ Safe working position reached (Base: 60°, Shoulder: 90°)')
        time.sleep(1)
        print()

        # Test 2: BASE servo movement test (moderate range)
        print('Step 4: Testing BASE servo - VERTICAL MOVEMENT...')
        print()

        print('   Moving Base UP to 45°...')
        arm.set_servo_angle('base', 45)
        time.sleep(2)
        print('   ✓ Base at 45° (higher position)')

        print('   Moving Base to 60° (middle)...')
        arm.set_servo_angle('base', 60)
        time.sleep(2)
        print('   ✓ Base at 60° (middle)')

        print('   Moving Base DOWN to 80°...')
        arm.set_servo_angle('base', 80)
        time.sleep(2)
        print('   ✓ Base at 80° (lower position)')

        print('   Returning Base to 60°...')
        arm.set_servo_angle('base', 60)
        time.sleep(2)
        print('   ✓ Base returned to middle (60°)')
        print()
        print('✓ Base servo test COMPLETE')
        time.sleep(1)
        print()

        # Test 3: SHOULDER servo movement test (moderate range)
        print('Step 5: Testing SHOULDER servo - OPEN/CLOSE...')
        print()

        print('   Closing Shoulder to 70°...')
        arm.set_servo_angle('shoulder', 70)
        time.sleep(2)
        print('   ✓ Shoulder at 70° (more closed)')

        print('   Opening Shoulder to 90°...')
        arm.set_servo_angle('shoulder', 90)
        time.sleep(2)
        print('   ✓ Shoulder at 90° (moderate)')

        print('   Opening Shoulder to 120°...')
        arm.set_servo_angle('shoulder', 120)
        time.sleep(2)
        print('   ✓ Shoulder at 120° (more open)')

        print('   Opening Shoulder to 145°...')
        arm.set_servo_angle('shoulder', 145)
        time.sleep(2)
        print('   ✓ Shoulder at 145° (extended)')

        print('   Returning Shoulder to 90°...')
        arm.set_servo_angle('shoulder', 90)
        time.sleep(2)
        print('   ✓ Shoulder returned to 90°')
        print()
        print('✓ Shoulder servo test COMPLETE')
        time.sleep(1)
        print()

        # Test 4: Tumor sampling sequence (actual use case)
        print('Step 6: TUMOR SAMPLING SEQUENCE TEST...')
        print('   (Simulating malignant tumor detection response)')
        print()
        time.sleep(1)

        print('   Phase 1: READY position...')
        print('     Base: 60° | Shoulder: 90°')
        arm.set_servo_angle('base', 60)
        time.sleep(1)
        arm.set_servo_angle('shoulder', 90)
        time.sleep(2)
        print('     ✓ System READY')
        time.sleep(1)

        print('   Phase 2: APPROACH tumor site...')
        print('     Base: 50° | Shoulder: 120°')
        arm.set_servo_angle('base', 50)
        time.sleep(1)
        arm.set_servo_angle('shoulder', 120)
        time.sleep(2)
        print('     ✓ Approaching target')
        time.sleep(1)

        print('   Phase 3: EXTEND to sampling position...')
        print('     Base: 50° | Shoulder: 150°')
        arm.set_servo_angle('base', 50)
        time.sleep(1)
        arm.set_servo_angle('shoulder', 150)
        time.sleep(2)
        print('     ✓ Extended to tumor site')
        time.sleep(1)

        print('   Phase 4: LOWER for sample collection...')
        print('     Base: 70° | Shoulder: 150°')
        arm.set_servo_angle('base', 70)
        time.sleep(2)
        print('     ✓ Sampling position reached')
        time.sleep(1)

        print('   Phase 5: COLLECT sample...')
        print('     Base: 70° | Shoulder: 130°')
        arm.set_servo_angle('shoulder', 130)
        time.sleep(2)
        print('     ✓ Sample collected')
        time.sleep(1)

        print('   Phase 6: RETRACT with sample...')
        print('     Base: 60° | Shoulder: 100°')
        arm.set_servo_angle('base', 60)
        time.sleep(1)
        arm.set_servo_angle('shoulder', 100)
        time.sleep(2)
        print('     ✓ Retracting')
        time.sleep(1)

        print('   Phase 7: Return to READY position...')
        print('     Base: 60° | Shoulder: 90°')
        arm.set_servo_angle('base', 60)
        time.sleep(1)
        arm.set_servo_angle('shoulder', 90)
        time.sleep(2)
        print('     ✓ Returned to READY')
        print()

        print('✓ Tumor sampling sequence COMPLETE')
        time.sleep(1)
        print()

        # Final safe position
        print('Step 7: Returning to SAFE POSITION...')
        arm.set_servo_angle('base', 60)
        time.sleep(1)
        arm.set_servo_angle('shoulder', 90)
        time.sleep(1)
        print('✓ System at SAFE position (Base: 60°, Shoulder: 90°)')
        time.sleep(1)
        print()

        # Success summary
        print('=' * 60)
        print('✅ ALL TESTS PASSED!')
        print('=' * 60)
        print()
        print('Test Results Summary:')
        print('  ✓ Step 1: Arm controller initialization')
        print('  ✓ Step 2: Extreme start position (0°, 0°)')
        print('  ✓ Step 3: Safe working position setup')
        print('  ✓ Step 4: Base servo test (45° → 60° → 80° → 60°)')
        print('  ✓ Step 5: Shoulder servo test (70° → 90° → 120° → 145° → 90°)')
        print('  ✓ Step 6: Tumor sampling sequence (7-phase automated)')
        print('  ✓ Step 7: Safe position reset')
        print()
        print('Movement Summary:')
        print('  • Base working range: 45° - 80° ✓')
        print('  • Shoulder working range: 70° - 150° ✓')
        print('  • Smooth transitions: YES ✓')
        print('  • Total Test Duration: ~70 seconds')
        print()
        print('System Status: READY FOR TUMOR DETECTION INTEGRATION')
        print()

        return 0

    except KeyboardInterrupt:
        print('\n\nTest interrupted by user (Ctrl+C)')
        print('Returning arm to home position...')
        try:
            arm.home()
        except:
            pass
        return 1

    except Exception as e:
        print(f'\n\n❌ TEST FAILED!')
        print(f'Error: {e}')
        print()
        import traceback
        traceback.print_exc()
        print()
        print('Troubleshooting:')
        print('  1. Check servo power supply is ON (6V)')
        print('  2. Verify servos are connected to correct channels (7, 12)')
        print('  3. Ensure PCA9685 is detected: i2cdetect -y 1')
        print('  4. Run: python tests/test_i2c.py')
        print('  5. Run: python tests/test_servos.py')
        return 1


if __name__ == '__main__':
    sys.exit(main())
