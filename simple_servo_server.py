#!/usr/bin/env python3
"""
MedTwin Pro - Simple Servo Control Server
==========================================

4-DOF Robotic Arm Control via HTTP and WebSocket.

Servo Channels (PCA9685):
  - Base:     Channel 0
  - Shoulder: Channel 4
  - Elbow:    Channel 8
  - Wrist:    Channel 12

HTTP Endpoints:
  GET /health              - Health check
  GET /servo?name=X&angle=Y - Move servo to angle
  GET /servo/home          - All servos to 90°
  GET /servo/test          - Test all servos

WebSocket: ws://localhost:8000/ws
  - Receives: {type: "set_position", yaw, pitch, elbow, roll}
  - Sends: {type: "ack"} or {type: "state_update"}

Usage:
  python simple_servo_server.py
"""

import sys
import math
import json
import asyncio
from aiohttp import web

# ============================================================
# SERVO CONFIGURATION - Update channels here if needed
# ============================================================
SERVO_CONFIG = {
    'base':     {'channel': 0,  'home': 90, 'min': 0, 'max': 180},
    'shoulder': {'channel': 4,  'home': 90, 'min': 0, 'max': 180},
    'elbow':    {'channel': 8,  'home': 90, 'min': 0, 'max': 180},
    'wrist':    {'channel': 12, 'home': 90, 'min': 0, 'max': 180},
}

# UI axis mapping to servo names
UI_TO_SERVO = {
    'yaw': 'base',
    'pitch': 'shoulder',
    'elbow': 'elbow',
    'roll': 'wrist',
}
# ============================================================

print("=" * 60)
print("MedTwin Pro - 4-DOF Servo Control Server")
print("=" * 60)

# Initialize ServoKit
print("\nInitializing PCA9685...")
try:
    from adafruit_servokit import ServoKit
    kit = ServoKit(channels=16, address=0x40)
    print("✓ PCA9685 detected at 0x40")
except Exception as e:
    print(f"✗ Failed to initialize PCA9685: {e}")
    print("  Check I2C connection: sudo i2cdetect -y 1")
    sys.exit(1)

# Current positions (in degrees)
current_positions = {}

# Initialize servos to home position
print("\nInitializing servos to home position (90°)...")
for name, config in SERVO_CONFIG.items():
    ch = config['channel']
    home = config['home']
    try:
        kit.servo[ch].angle = home
        current_positions[name] = home
        print(f"  ✓ {name:10} (ch {ch:2}): {home}°")
    except Exception as e:
        print(f"  ✗ {name:10} (ch {ch:2}): ERROR - {e}")

print("\n✓ All servos initialized")


def move_servo(name: str, angle: float) -> bool:
    """Move a servo to specified angle."""
    if name not in SERVO_CONFIG:
        return False

    config = SERVO_CONFIG[name]
    ch = config['channel']

    # Clamp to valid range
    angle = max(config['min'], min(config['max'], angle))

    kit.servo[ch].angle = angle
    current_positions[name] = angle
    return True


def radians_to_degrees(rad: float) -> float:
    """Convert radians (centered at 0) to degrees (centered at 90)."""
    deg = 90 + (rad * 180 / math.pi)
    return max(0, min(180, deg))


# ============================================================
# HTTP Handlers
# ============================================================

async def health(request):
    """Health check endpoint."""
    return web.json_response({'status': 'ok', 'servos': list(SERVO_CONFIG.keys())})


async def move_servo_http(request):
    """Move a servo via HTTP.

    Usage: GET /servo?name=base&angle=90
    """
    name = request.query.get('name', request.query.get('servo', ''))
    angle_str = request.query.get('angle', '90')

    if not name:
        return web.json_response(
            {'error': 'Missing servo name', 'valid': list(SERVO_CONFIG.keys())},
            status=400
        )

    if name not in SERVO_CONFIG:
        return web.json_response(
            {'error': f'Unknown servo: {name}', 'valid': list(SERVO_CONFIG.keys())},
            status=400
        )

    try:
        angle = float(angle_str)
    except ValueError:
        return web.json_response({'error': f'Invalid angle: {angle_str}'}, status=400)

    print(f"HTTP: {name} -> {angle:.1f}°")
    move_servo(name, angle)

    return web.json_response({
        'success': True,
        'servo': name,
        'angle': angle,
        'channel': SERVO_CONFIG[name]['channel']
    })


async def home_servos(request):
    """Return all servos to home position."""
    print("HTTP: Homing all servos")
    for name, config in SERVO_CONFIG.items():
        move_servo(name, config['home'])

    return web.json_response({
        'success': True,
        'positions': {name: config['home'] for name, config in SERVO_CONFIG.items()}
    })


async def test_servos(request):
    """Test all servos with movement."""
    print("HTTP: Testing all servos")
    results = []

    for name, config in SERVO_CONFIG.items():
        print(f"  Testing {name}...")
        try:
            # Move to min, then max, then home
            move_servo(name, config['min'])
            await asyncio.sleep(0.5)
            move_servo(name, config['max'])
            await asyncio.sleep(0.5)
            move_servo(name, config['home'])
            await asyncio.sleep(0.3)
            results.append({'servo': name, 'status': 'ok'})
        except Exception as e:
            results.append({'servo': name, 'status': 'error', 'message': str(e)})

    return web.json_response({'results': results})


async def get_positions(request):
    """Get current servo positions."""
    return web.json_response({
        'positions': current_positions,
        'config': {name: {'channel': c['channel']} for name, c in SERVO_CONFIG.items()}
    })


# ============================================================
# WebSocket Handler
# ============================================================

ws_clients = set()


async def websocket_handler(request):
    """Handle WebSocket connections for real-time control."""
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    ws_clients.add(ws)
    print(f"WS: Client connected (total: {len(ws_clients)})")

    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    await handle_ws_message(ws, data)
                except json.JSONDecodeError:
                    await ws.send_json({'type': 'error', 'message': 'Invalid JSON'})
            elif msg.type == web.WSMsgType.ERROR:
                print(f"WS: Error - {ws.exception()}")
    except Exception as e:
        print(f"WS: Connection error - {e}")
    finally:
        ws_clients.discard(ws)
        print(f"WS: Client disconnected (total: {len(ws_clients)})")

    return ws


async def handle_ws_message(ws, data: dict):
    """Process WebSocket message."""
    msg_type = data.get('type', '')
    timestamp = data.get('timestamp', 0)

    if msg_type == 'set_position':
        # Extract positions (radians from UI)
        yaw = data.get('yaw', 0)
        pitch = data.get('pitch', 0)
        elbow = data.get('elbow', 0)
        roll = data.get('roll', 0)

        # Convert to degrees and move servos
        base_deg = radians_to_degrees(yaw)
        shoulder_deg = radians_to_degrees(pitch)
        elbow_deg = radians_to_degrees(elbow)
        wrist_deg = radians_to_degrees(roll)

        print(f"WS: base={base_deg:.0f}° shoulder={shoulder_deg:.0f}° elbow={elbow_deg:.0f}° wrist={wrist_deg:.0f}°")

        move_servo('base', base_deg)
        move_servo('shoulder', shoulder_deg)
        move_servo('elbow', elbow_deg)
        move_servo('wrist', wrist_deg)

        await ws.send_json({'type': 'ack', 'timestamp': timestamp})

    elif msg_type == 'get_state':
        # Convert current positions back to radians for UI
        await ws.send_json({
            'type': 'state_update',
            'armState': {
                'yaw': (current_positions.get('base', 90) - 90) * math.pi / 180,
                'pitch': (current_positions.get('shoulder', 90) - 90) * math.pi / 180,
                'elbow': (current_positions.get('elbow', 90) - 90) * math.pi / 180,
                'roll': (current_positions.get('wrist', 90) - 90) * math.pi / 180,
                'biopsyExtension': 0
            },
            'timestamp': timestamp
        })

    elif msg_type == 'heartbeat':
        await ws.send_json({'type': 'heartbeat', 'timestamp': timestamp})

    elif msg_type == 'command':
        action = data.get('action', '')
        if action == 'reset_position':
            for name, config in SERVO_CONFIG.items():
                move_servo(name, config['home'])
            await ws.send_json({'type': 'ack', 'action': action, 'timestamp': timestamp})
        elif action == 'emergency_stop':
            print("WS: EMERGENCY STOP")
            await ws.send_json({'type': 'ack', 'action': action, 'timestamp': timestamp})
        else:
            await ws.send_json({'type': 'ack', 'action': action, 'timestamp': timestamp})


# ============================================================
# Main Application
# ============================================================

def create_app():
    """Create and configure the web application."""
    app = web.Application()

    # HTTP routes
    app.router.add_get('/health', health)
    app.router.add_get('/servo', move_servo_http)
    app.router.add_get('/servo/home', home_servos)
    app.router.add_get('/servo/test', test_servos)
    app.router.add_get('/servo/positions', get_positions)

    # WebSocket routes
    app.router.add_get('/ws', websocket_handler)
    app.router.add_get('/', websocket_handler)

    return app


def main():
    """Start the server."""
    print("\n" + "=" * 60)
    print("Server Starting...")
    print("=" * 60)
    print("\nHTTP Endpoints:")
    print("  GET http://localhost:8000/health")
    print("  GET http://localhost:8000/servo?name=base&angle=90")
    print("  GET http://localhost:8000/servo/home")
    print("  GET http://localhost:8000/servo/test")
    print("  GET http://localhost:8000/servo/positions")
    print("\nWebSocket:")
    print("  ws://localhost:8000/ws")
    print("\nServo Channels:")
    for name, config in SERVO_CONFIG.items():
        print(f"  {name:10}: Channel {config['channel']}")
    print("=" * 60)
    print("\nPress Ctrl+C to stop\n")

    app = create_app()
    web.run_app(app, host='0.0.0.0', port=8000, print=None)


if __name__ == '__main__':
    main()
