#!/usr/bin/env python3
"""Super simple WebSocket server for debugging servo control."""

import asyncio
import json
from aiohttp import web, WSMsgType

# Try to import servo control
try:
    from adafruit_servokit import ServoKit
    kit = ServoKit(channels=16, address=0x40)
    print("ServoKit initialized!")
    HAS_HARDWARE = True
except Exception as e:
    print(f"No hardware: {e}")
    HAS_HARDWARE = False
    kit = None

# Servo channels
CHANNELS = {'base': 0, 'shoulder': 4, 'elbow': 8, 'wrist': 12}

def move_servo(name, angle):
    """Move a servo to angle (0-180)."""
    if not HAS_HARDWARE:
        print(f"[SIM] {name} -> {angle}°")
        return
    ch = CHANNELS.get(name)
    if ch is not None:
        kit.servo[ch].angle = angle
        print(f"[HW] {name} (ch{ch}) -> {angle}°")

def radians_to_degrees(rad):
    """Convert radians (centered at 0) to servo degrees (centered at 90)."""
    import math
    deg = 90 + (rad * 180 / math.pi)
    return max(0, min(180, deg))

async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    print(f"Client connected")

    # Send initial state
    await ws.send_json({
        'type': 'state_update',
        'armState': {'yaw': 0, 'pitch': 0, 'elbow': 0, 'roll': 0, 'biopsyExtension': 0},
        'timestamp': 0
    })

    async for msg in ws:
        if msg.type == WSMsgType.TEXT:
            try:
                data = json.loads(msg.data)
                print(f"Received: {data['type']}")

                if data['type'] == 'set_position':
                    # Convert and move
                    yaw = data.get('yaw', 0)
                    pitch = data.get('pitch', 0)
                    elbow = data.get('elbow', 0)
                    roll = data.get('roll', 0)

                    # Base (channel 0) - controlled by Yaw slider
                    base_deg = radians_to_degrees(yaw)
                    print(f"Base: {base_deg:.1f}° (yaw={yaw:.3f})")
                    move_servo('base', base_deg)

                    # Shoulder (channel 4) - controlled by Pitch slider
                    shoulder_deg = radians_to_degrees(pitch)
                    print(f"Shoulder: {shoulder_deg:.1f}° (pitch={pitch:.3f})")
                    move_servo('shoulder', shoulder_deg)

                    # Elbow (channel 8) - controlled by Elbow slider
                    elbow_deg = radians_to_degrees(elbow)
                    print(f"Elbow: {elbow_deg:.1f}° (elbow={elbow:.3f})")
                    move_servo('elbow', elbow_deg)

                    # Wrist (channel 12) - controlled by Roll slider
                    wrist_deg = radians_to_degrees(roll)
                    print(f"Wrist: {wrist_deg:.1f}° (roll={roll:.3f})")
                    move_servo('wrist', wrist_deg)

                    # Send ack
                    await ws.send_json({'type': 'ack', 'timestamp': data.get('timestamp', 0)})

                elif data['type'] == 'get_state':
                    await ws.send_json({
                        'type': 'state_update',
                        'armState': {'yaw': 0, 'pitch': 0, 'elbow': 0, 'roll': 0, 'biopsyExtension': 0},
                        'timestamp': data.get('timestamp', 0)
                    })

                elif data['type'] == 'heartbeat':
                    await ws.send_json({'type': 'heartbeat', 'timestamp': data.get('timestamp', 0)})

            except Exception as e:
                print(f"Error: {e}")
        elif msg.type == WSMsgType.ERROR:
            print(f"WebSocket error: {ws.exception()}")

    print("Client disconnected")
    return ws

async def health(request):
    return web.json_response({'status': 'ok'})

app = web.Application()
app.router.add_get('/ws', websocket_handler)
app.router.add_get('/health', health)

if __name__ == '__main__':
    print("Starting test WebSocket server on port 8765...")
    print("Connect frontend to ws://raspberrypi.local:8765/ws")
    web.run_app(app, host='0.0.0.0', port=8765)
