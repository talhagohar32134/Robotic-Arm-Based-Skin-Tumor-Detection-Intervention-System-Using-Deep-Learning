# MedTwin Pro - Running Guide

## Quick Start

### 1. Start Backend Server
```bash
cd /home/pi/Downloads/robotic-arm
./scripts/start_medtwin.sh
```

### 2. Start Frontend (Development)
```bash
cd /home/pi/Downloads/robotic-arm/full-app-code/twin-touch-biopsy-frontend
npm run dev
```

### 3. Open in Browser
```
http://raspberrypi.local:5173
```
Or from another device on the network:
```
http://<raspberry-pi-ip>:5173
```

---

## Services & Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://raspberrypi.local:5173 |
| WebSocket (Arm) | 8765 | ws://raspberrypi.local:8765/ws |
| HTTP API | 5000 | http://raspberrypi.local:5000 |
| Camera Stream | 8080 | http://raspberrypi.local:8080/stream.mjpg |

---

## UI Controls

| Slider | Servo | Channel | Function |
|--------|-------|---------|----------|
| Yaw | Base | 0 | Rotate arm left/right |
| Pitch | Shoulder | 4 | Tilt arm up/down |
| Elbow | Elbow | 8 | Bend arm |
| Roll | Wrist | 12 | Rotate end effector |

### Buttons
- **EMERGENCY STOP** - Immediately stops all movement
- **Resume System** - Clears emergency stop state
- **Biopsy** - Executes biopsy sequence
- **Reset** - Returns all servos to home position (90°)

---

## Manual Commands

### Start/Stop Scripts
```bash
# Start all services
./scripts/start_medtwin.sh

# Stop all services
./scripts/stop_medtwin.sh
```

### Direct Backend Start
```bash
cd /home/pi/Downloads/robotic-arm
source venv/bin/activate
python src/unified_server.py
```

### View Logs
```bash
# Real-time logs
tail -f /home/pi/Downloads/robotic-arm/logs/backend.log

# Last 50 lines
tail -50 /home/pi/Downloads/robotic-arm/logs/backend.log
```

---

## Test Servo Control via HTTP

```bash
# Move individual servo
curl "http://localhost:5000/servo?name=base&angle=45"
curl "http://localhost:5000/servo?name=shoulder&angle=120"
curl "http://localhost:5000/servo?name=elbow&angle=60"
curl "http://localhost:5000/servo?name=wrist&angle=135"

# Return all servos to home (90°)
curl "http://localhost:5000/servo/home"

# Health check
curl "http://localhost:5000/health"
```

---

## Simple Test Server (Debugging)

If the main server has issues, use the simple test server:

```bash
cd /home/pi/Downloads/robotic-arm
source venv/bin/activate
python test_ws_server.py
```

This runs on port 8765 and only handles servo control (no camera/ML).

---

## Troubleshooting

### Servos Don't Move
1. Check I2C: `sudo i2cdetect -y 1` (should show `40`)
2. Check power: External 5-6V connected to PCA9685 V+
3. Check channels: See WIRING.md for correct connections

### WebSocket Not Connecting
1. Check backend running: `pgrep -f unified_server`
2. Check port available: `sudo lsof -i :8765`
3. Try simple test server (see above)

### Frontend Not Loading
1. Check frontend running: `pgrep -f vite`
2. Check port: `sudo lsof -i :5173`
3. Try: `cd full-app-code/twin-touch-biopsy-frontend && npm run dev`

### Kill Stuck Processes
```bash
sudo pkill -9 -f unified_server
sudo pkill -9 -f vite
```

---

## File Structure

```
/home/pi/Downloads/robotic-arm/
├── scripts/
│   ├── start_medtwin.sh    # Start all services
│   └── stop_medtwin.sh     # Stop all services
├── src/
│   ├── unified_server.py   # Main backend server
│   ├── server/
│   │   └── websocket_handler.py  # WebSocket arm control
│   └── hardware/
│       ├── arm_controller.py     # Servo control
│       └── servo_config.py       # Channel assignments
├── full-app-code/
│   └── twin-touch-biopsy-frontend/  # React frontend
├── logs/
│   └── backend.log         # Server logs
├── test_ws_server.py       # Simple test server
├── WIRING.md               # Hardware wiring guide
└── RUNNING.md              # This file
```
