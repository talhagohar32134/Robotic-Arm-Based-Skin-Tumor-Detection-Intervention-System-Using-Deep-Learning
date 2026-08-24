#!/usr/bin/env python3
"""Test I2C communication with PCA9685."""

import sys

try:
    import board
    import busio
    from adafruit_pca9685 import PCA9685

    print("Testing PCA9685 connection...")
    print(f"Expected I2C address: 0x40")

    # Initialize I2C
    i2c = busio.I2C(board.SCL, board.SDA)

    # Try to create PCA9685 device
    pca = PCA9685(i2c, address=0x40)
    pca.frequency = 50

    print("SUCCESS: PCA9685 detected and initialized at 0x40")
    print(f"PWM frequency set to: {pca.frequency} Hz")

    # Clean up
    pca.deinit()

    sys.exit(0)

except ImportError as e:
    print(f"FAILED: Missing required library: {e}")
    print("Install with: pip install adafruit-circuitpython-pca9685")
    sys.exit(1)

except ValueError as e:
    print(f"FAILED: PCA9685 not found at address 0x40")
    print(f"Error: {e}")
    print("\nTroubleshooting:")
    print("1. Check PCA9685 is powered")
    print("2. Verify wiring: SDA to Pin 3, SCL to Pin 5, VCC to Pin 1, GND to Pin 6")
    print("3. Run 'i2cdetect -y 1' to see if device appears")
    print("4. Check I2C is enabled: 'sudo raspi-config' -> Interface Options -> I2C")
    sys.exit(1)

except Exception as e:
    print(f"FAILED: Unexpected error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
