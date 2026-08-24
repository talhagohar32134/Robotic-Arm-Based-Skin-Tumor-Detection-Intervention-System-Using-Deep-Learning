"""Robotic arm controller using PCA9685 PWM driver."""

import time
import numpy as np

try:
    from adafruit_servokit import ServoKit
except ImportError:
    # Fallback to manual PCA9685 control
    from adafruit_pca9685 import PCA9685
    import board
    import busio

from .servo_config import (
    PCA9685_ADDRESS,
    PWM_FREQUENCY,
    SERVO_CHANNELS,
    SERVO_LIMITS,
    HOME_POSITION,
    TUMOR_SAMPLING_SEQUENCE,
)


class ArmController:
    """Controls 5-DOF robotic arm via PCA9685."""

    def __init__(self, use_servo_kit=True):
        """Initialize PCA9685 device.

        Args:
            use_servo_kit: If True, use Adafruit ServoKit (easier).
                          If False, use manual PCA9685 control.
        """
        self.use_servo_kit = use_servo_kit

        try:
            if use_servo_kit:
                # Use ServoKit for easier servo control
                self.kit = ServoKit(channels=16, address=PCA9685_ADDRESS)
                # Set actuation range for all servos (0-180 degrees)
                for channel in SERVO_CHANNELS.values():
                    if channel < 16:
                        self.kit.servo[channel].actuation_range = 180
                print(f"ServoKit initialized at address 0x{PCA9685_ADDRESS:02X}")
            else:
                # Manual PCA9685 control
                i2c = busio.I2C(board.SCL, board.SDA)
                self.pca = PCA9685(i2c, address=PCA9685_ADDRESS)
                self.pca.frequency = PWM_FREQUENCY
                print(f"PCA9685 initialized at address 0x{PCA9685_ADDRESS:02X}")
        except Exception as e:
            raise RuntimeError(f"Failed to initialize PCA9685: {e}")

    def angle_to_pwm(self, angle):
        """Convert angle (0-180 degrees) to PWM pulse width.

        Standard servo: 0° = ~1ms pulse, 180° = ~2ms pulse
        At 50Hz, period = 20ms, 4096 steps
        1ms = 205 counts, 2ms = 410 counts

        Args:
            angle: Servo angle in degrees (0-180)

        Returns:
            PWM value (205-410)
        """
        # Map 0-180° to 205-410 PWM counts
        pwm_value = int(205 + (angle / 180.0) * 205)
        return max(205, min(410, pwm_value))  # Clamp for safety

    def set_servo_angle(self, servo_name, angle):
        """Set a servo to a specific angle with safety checks.

        Args:
            servo_name: Name of servo ('base', 'shoulder', 'elbow', etc.)
            angle: Desired angle in degrees
        """
        if servo_name not in SERVO_CHANNELS:
            raise ValueError(f"Unknown servo: {servo_name}")

        # Safety: Check angle limits
        limits = SERVO_LIMITS[servo_name]
        if not (limits['min'] <= angle <= limits['max']):
            raise ValueError(
                f"Angle {angle}° out of range for {servo_name} "
                f"({limits['min']}-{limits['max']}°)"
            )

        channel = SERVO_CHANNELS[servo_name]

        if self.use_servo_kit:
            # Use ServoKit (simpler)
            try:
                self.kit.servo[channel].angle = angle
            except Exception as e:
                print(f"ERROR setting servo {servo_name} ch{channel} to {angle}°: {e}")
                raise
        else:
            # Manual PWM control
            pwm_value = self.angle_to_pwm(angle)
            # duty_cycle is 16-bit (0-65535), map from 12-bit (0-4095)
            duty_cycle = int((pwm_value / 4096.0) * 65535)
            self.pca.channels[channel].duty_cycle = duty_cycle

        print(f"Servo {servo_name} (ch{channel}): {angle}°")

    def move_to_position(self, positions, duration=1.0):
        """Move multiple servos to positions (degrees) over duration.

        Args:
            positions: Dict of {servo_name: angle}
            duration: Time to hold position in seconds
        """
        for servo_name, angle in positions.items():
            self.set_servo_angle(servo_name, angle)
        time.sleep(duration)

    def home(self):
        """Move all servos to home position."""
        print("Moving to home position...")
        self.move_to_position(HOME_POSITION, duration=2.0)

    def execute_sampling_sequence(self):
        """Execute hardcoded tumor sampling movement sequence."""
        print("Executing tumor sampling sequence...")
        for i, step in enumerate(TUMOR_SAMPLING_SEQUENCE, 1):
            positions = {k: v for k, v in step.items() if k != 'duration'}
            duration = step.get('duration', 1.0)
            print(f"Step {i}/{len(TUMOR_SAMPLING_SEQUENCE)}: {positions}")
            self.move_to_position(positions, duration)
        print("Sampling sequence complete")

    def shutdown(self):
        """Safely shut down (return to home)."""
        try:
            self.home()
        except Exception as e:
            print(f"Warning: Could not return to home position: {e}")

        if not self.use_servo_kit and hasattr(self, 'pca'):
            # Deinitialize PCA9685
            self.pca.deinit()

        print("Arm controller shutdown")
