#!/usr/bin/env python3
"""Test servo movement (SINGLE SERVO ONLY initially)."""

import time
import sys

try:
    from adafruit_servokit import ServoKit

    # SAFETY: Only test ONE servo first!
    TEST_CHANNEL = 12  # Base servo (change to test different servos: 4,5,6,7,8)
    TEST_ANGLES = [90, 120, 90, 60, 90]  # Small movements around center

    print("="*60)
    print("SERVO TEST - SAFETY CHECKS")
    print("="*60)
    print("\nBefore proceeding, ensure:")
    print("  1. Servo power supply is connected (6V)")
    print("  2. ONLY ONE servo is connected to channel", TEST_CHANNEL)
    print("  3. Servo can move freely (no mechanical binding)")
    print("  4. You have an emergency stop (power switch) ready")
    print("\nThis test will move the servo to: ", TEST_ANGLES)
    print("\nPress ENTER to continue, or Ctrl+C to abort...")
    input()

    print("\nInitializing ServoKit...")
    kit = ServoKit(channels=16, address=0x40)

    # Set actuation range
    kit.servo[TEST_CHANNEL].actuation_range = 180

    print(f"\nTesting servo on channel {TEST_CHANNEL}")
    print("WATCH THE SERVO! Ensure it moves smoothly without binding.\n")

    for i, angle in enumerate(TEST_ANGLES, 1):
        print(f"  Step {i}/{len(TEST_ANGLES)}: Moving to {angle}°")
        kit.servo[TEST_CHANNEL].angle = angle
        time.sleep(1.5)

    print("\nTest complete!")
    print("\nDid the servo move smoothly without jerking or buzzing? (yes/no)")
    response = input().strip().lower()

    if response in ['yes', 'y']:
        print("\nSUCCESS: Servo working correctly!")
        print("\nNext steps:")
        print("  1. Power off")
        print("  2. Connect next servo to channel", TEST_CHANNEL + 1)
        print("  3. Update TEST_CHANNEL in this script")
        print("  4. Run test again")
        print("  5. Repeat for all 5 servos (channels 4, 5, 6, 7, 8)")
        sys.exit(0)
    else:
        print("\nPlease check:")
        print("  - Servo power supply voltage (should be 5-6V)")
        print("  - Servo connections (Brown=GND, Red=V+, Orange=Signal)")
        print("  - Mechanical freedom (servo arm can move without obstruction)")
        print("  - Servo is not damaged")
        sys.exit(1)

except KeyboardInterrupt:
    print("\n\nTest aborted by user")
    sys.exit(1)

except ImportError as e:
    print(f"FAILED: Missing library: {e}")
    print("Install with: pip install adafruit-circuitpython-servokit")
    sys.exit(1)

except Exception as e:
    print(f"\nFAILED: Error during test: {e}")
    import traceback
    traceback.print_exc()
    print("\nCheck:")
    print("  - I2C connection (run tests/test_i2c.py first)")
    print("  - Servo power supply is ON")
    print("  - Servo is properly connected")
    sys.exit(1)
