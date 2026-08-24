# MedTwin Pro - 4-DOF Robotic Arm Wiring Guide

**Tested and Confirmed Working: April 19, 2026**

## Hardware Components
- Raspberry Pi (with I2C enabled)
- PCA9685 16-Channel PWM Driver (I2C address: 0x40)
- 4x Servo Motors
- External 5-6V Power Supply for servos

---

## PCA9685 to Raspberry Pi Connections

| PCA9685 Pin | Raspberry Pi Pin | Description |
|-------------|------------------|-------------|
| VCC         | Pin 1 (3.3V)     | Logic power |
| GND         | Pin 6 (GND)      | Ground      |
| SDA         | Pin 3 (GPIO 2)   | I2C Data    |
| SCL         | Pin 5 (GPIO 3)   | I2C Clock   |
| V+          | External 5-6V    | Servo power |
| GND         | External GND     | Servo ground|

**IMPORTANT:**
- Connect external 5-6V power supply to V+ terminal for servos
- Do NOT power servos from Raspberry Pi - insufficient current

---

## Servo Channel Assignments (CONFIRMED WORKING)

| Servo    | PCA9685 Channel | UI Slider | Function |
|----------|-----------------|-----------|----------|
| Base     | **0**           | Yaw       | Rotates arm left/right |
| Shoulder | **4**           | Pitch     | Tilts arm up/down |
| Elbow    | **8**           | Elbow     | Bends the arm |
| Wrist    | **12**          | Roll      | Rotates end effector |

### Servo Wire Colors (typical)
- **Brown/Black** → GND
- **Red** → V+ (5-6V)
- **Orange/Yellow** → Signal (PWM)

---

## Physical Arm Layout

```
     [Wrist] ─── Channel 12 (Roll slider)
        │
     [Elbow] ─── Channel 8 (Elbow slider)
        │
   [Shoulder] ── Channel 4 (Pitch slider)
        │
     [Base] ──── Channel 0 (Yaw slider)
       ═══
     [Mount]
```

---

## UI to Servo Mapping

| UI Slider | Range (degrees) | Servo Center | Conversion |
|-----------|-----------------|--------------|------------|
| Yaw       | -180° to +180°  | 90°          | servo = 90 + (rad × 180/π) |
| Pitch     | -90° to +90°    | 90°          | servo = 90 + (rad × 180/π) |
| Elbow     | -90° to +90°    | 90°          | servo = 90 + (rad × 180/π) |
| Roll      | -180° to +180°  | 90°          | servo = 90 + (rad × 180/π) |

**Note:** UI sends radians centered at 0. Servos use degrees centered at 90.

---

## I2C Verification

```bash
# Check if PCA9685 is detected
sudo i2cdetect -y 1

# Should show 40 at address 0x40:
#      0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
# 40: 40 -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `i2cdetect` shows nothing | Check SDA/SCL wiring, run `sudo raspi-config` → Interface Options → I2C → Enable |
| Servos don't move | Check external power supply connected to V+ |
| Servos jitter | Power supply insufficient, use 2A+ supply |
| Only some servos work | Check channel connections match table above |
| Shoulder can't lift arm | Normal - servo may lack torque for arm weight |
