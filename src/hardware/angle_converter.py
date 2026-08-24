"""Angle conversion between frontend (radians) and hardware (servo degrees).

The frontend sends angles in radians centered at 0:
- Yaw (base rotation): -π to +π radians (-180° to +180°)
- Pitch (shoulder): -π/2 to +π/2 radians (-90° to +90°)
- Roll (wrist): -π to +π radians (-180° to +180°)

The hardware servos operate in degrees with 90° as center:
- All servos: 0° to 180° with 90° as neutral/home position

This module handles the conversion between these coordinate systems.
"""

import math
from dataclasses import dataclass
from typing import Dict, Tuple


@dataclass
class AxisConfig:
    """Configuration for a single axis."""
    min_rad: float      # Minimum angle in radians (frontend)
    max_rad: float      # Maximum angle in radians (frontend)
    servo_min: float    # Minimum servo angle in degrees
    servo_max: float    # Maximum servo angle in degrees
    servo_center: float # Center/home servo angle in degrees
    servo_name: str     # Name of servo in hardware config


# Axis configurations matching frontend SliderControlPanel.tsx
# 4-DOF: yaw (base), pitch (shoulder), elbow, roll (wrist)
AXIS_CONFIG: Dict[str, AxisConfig] = {
    'yaw': AxisConfig(
        min_rad=-math.pi,       # -180 degrees
        max_rad=math.pi,        # +180 degrees
        servo_min=0.0,
        servo_max=180.0,
        servo_center=90.0,
        servo_name='base'
    ),
    'pitch': AxisConfig(
        min_rad=-math.pi / 2,   # -90 degrees
        max_rad=math.pi / 2,    # +90 degrees
        servo_min=0.0,
        servo_max=180.0,
        servo_center=90.0,
        servo_name='shoulder'
    ),
    'elbow': AxisConfig(
        min_rad=-math.pi / 2,   # -90 degrees
        max_rad=math.pi / 2,    # +90 degrees
        servo_min=0.0,
        servo_max=180.0,
        servo_center=90.0,
        servo_name='elbow'
    ),
    'roll': AxisConfig(
        min_rad=-math.pi,       # -180 degrees
        max_rad=math.pi,        # +180 degrees
        servo_min=0.0,
        servo_max=180.0,
        servo_center=90.0,
        servo_name='wrist'
    ),
}


def radians_to_degrees(radians: float) -> float:
    """Convert radians to degrees."""
    return radians * (180.0 / math.pi)


def degrees_to_radians(degrees: float) -> float:
    """Convert degrees to radians."""
    return degrees * (math.pi / 180.0)


def clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp a value to a range."""
    return max(min_val, min(max_val, value))


def radians_to_servo(axis: str, radians: float) -> float:
    """Convert frontend radians to servo degrees.

    The conversion maps:
    - 0 radians (frontend center) -> 90 degrees (servo center)
    - Negative radians -> lower servo angles
    - Positive radians -> higher servo angles

    For yaw/roll with -180 to +180 range, values outside -90 to +90
    are clamped to the servo's physical limits (0-180).

    Args:
        axis: 'yaw', 'pitch', or 'roll'
        radians: Angle in radians from frontend

    Returns:
        Servo angle in degrees (0-180)

    Raises:
        ValueError: If axis is unknown
    """
    if axis not in AXIS_CONFIG:
        raise ValueError(f"Unknown axis: {axis}. Must be one of: {list(AXIS_CONFIG.keys())}")

    config = AXIS_CONFIG[axis]

    # Clamp input to valid range
    radians = clamp(radians, config.min_rad, config.max_rad)

    # Convert radians to degrees
    degrees = radians_to_degrees(radians)

    # Map to servo range: 0 degrees -> servo_center
    # degrees + 90 maps: -90° -> 0°, 0° -> 90°, +90° -> 180°
    servo_deg = degrees + config.servo_center

    # Clamp to servo physical limits
    return clamp(servo_deg, config.servo_min, config.servo_max)


def servo_to_radians(axis: str, servo_deg: float) -> float:
    """Convert servo degrees back to frontend radians.

    The inverse of radians_to_servo().

    Args:
        axis: 'yaw', 'pitch', or 'roll'
        servo_deg: Servo angle in degrees (0-180)

    Returns:
        Angle in radians for frontend

    Raises:
        ValueError: If axis is unknown
    """
    if axis not in AXIS_CONFIG:
        raise ValueError(f"Unknown axis: {axis}. Must be one of: {list(AXIS_CONFIG.keys())}")

    config = AXIS_CONFIG[axis]

    # Clamp input to valid range
    servo_deg = clamp(servo_deg, config.servo_min, config.servo_max)

    # Reverse the mapping: servo_center -> 0 degrees
    degrees = servo_deg - config.servo_center

    # Convert to radians
    radians = degrees_to_radians(degrees)

    # Clamp to axis limits
    return clamp(radians, config.min_rad, config.max_rad)


def get_servo_name(axis: str) -> str:
    """Get the servo name for a frontend axis.

    Args:
        axis: 'yaw', 'pitch', or 'roll'

    Returns:
        Servo name ('base', 'shoulder', or 'wrist')
    """
    if axis not in AXIS_CONFIG:
        raise ValueError(f"Unknown axis: {axis}")
    return AXIS_CONFIG[axis].servo_name


def get_home_position_radians() -> Dict[str, float]:
    """Get home position in radians (all zeros = centered).

    Returns:
        Dict with yaw, pitch, elbow, roll all set to 0.0
    """
    return {
        'yaw': 0.0,
        'pitch': 0.0,
        'elbow': 0.0,
        'roll': 0.0,
    }


def get_home_position_servo() -> Dict[str, float]:
    """Get home position in servo degrees.

    Returns:
        Dict with base, shoulder, elbow, wrist all set to 90.0
    """
    return {
        'base': 90.0,
        'shoulder': 90.0,
        'elbow': 90.0,
        'wrist': 90.0,
    }


def convert_frontend_to_hardware(yaw: float, pitch: float, elbow: float, roll: float) -> Dict[str, float]:
    """Convert frontend position (radians) to hardware servo angles.

    Args:
        yaw: Base rotation in radians
        pitch: Shoulder angle in radians
        elbow: Elbow angle in radians
        roll: Wrist rotation in radians

    Returns:
        Dict with servo angles: {'base': deg, 'shoulder': deg, 'elbow': deg, 'wrist': deg}
    """
    return {
        'base': radians_to_servo('yaw', yaw),
        'shoulder': radians_to_servo('pitch', pitch),
        'elbow': radians_to_servo('elbow', elbow),
        'wrist': radians_to_servo('roll', roll),
    }


def convert_hardware_to_frontend(base: float, shoulder: float, elbow: float, wrist: float) -> Dict[str, float]:
    """Convert hardware servo angles to frontend position (radians).

    Args:
        base: Base servo angle in degrees
        shoulder: Shoulder servo angle in degrees
        elbow: Elbow servo angle in degrees
        wrist: Wrist servo angle in degrees

    Returns:
        Dict with radians: {'yaw': rad, 'pitch': rad, 'elbow': rad, 'roll': rad}
    """
    return {
        'yaw': servo_to_radians('yaw', base),
        'pitch': servo_to_radians('pitch', shoulder),
        'elbow': servo_to_radians('elbow', elbow),
        'roll': servo_to_radians('roll', wrist),
    }
