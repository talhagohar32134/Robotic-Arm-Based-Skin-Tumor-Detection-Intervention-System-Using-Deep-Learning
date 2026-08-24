"""Servo configuration and calibration parameters."""

# PCA9685 I2C address (default 0x40)
PCA9685_ADDRESS = 0x40

# PWM frequency for servos (standard is 50Hz)
PWM_FREQUENCY = 50

# Servo channel assignments (channels 0-15 on PCA9685)
# 4-DOF Configuration - channels spaced for physical layout
SERVO_CHANNELS = {
    'base': 0,      # Channel 0: Base rotation (yaw)
    'shoulder': 4,  # Channel 4: Shoulder joint (pitch)
    'elbow': 8,     # Channel 8: Elbow joint
    'wrist': 12,    # Channel 12: Wrist rotation (roll)
}

# Servo angle limits (degrees) for safety
SERVO_LIMITS = {
    'base': {'min': 0, 'max': 180},
    'shoulder': {'min': 0, 'max': 180},
    'elbow': {'min': 0, 'max': 180},
    'wrist': {'min': 0, 'max': 180},
}

# Home position (safe starting position) in degrees
# 4-DOF: base, shoulder, elbow, wrist all at 90°
HOME_POSITION = {
    'base': 90,
    'shoulder': 90,
    'elbow': 90,
    'wrist': 90,
}

# Hardcoded movement sequences
# 4-DOF: base, shoulder, elbow, wrist
TUMOR_SAMPLING_SEQUENCE = [
    # Step 1: Move to approach position
    {'base': 90, 'shoulder': 90, 'elbow': 90, 'wrist': 90, 'duration': 2.0},
    # Step 2: Move to sampling position
    {'base': 90, 'shoulder': 135, 'elbow': 135, 'wrist': 90, 'duration': 2.0},
    # Step 3: Rotate base
    {'base': 120, 'shoulder': 135, 'elbow': 135, 'wrist': 90, 'duration': 2.0},
    # Step 4: Return to home
    {'base': 90, 'shoulder': 90, 'elbow': 90, 'wrist': 90, 'duration': 2.0},
]
