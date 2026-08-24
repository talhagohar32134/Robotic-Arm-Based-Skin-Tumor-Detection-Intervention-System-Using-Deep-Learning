"""WebSocket handler for real-time robotic arm control.

Simplified and tested working version - April 2026.
"""

import asyncio
import json
import logging
import math
import time
from typing import Dict, Any, Set

from aiohttp import web, WSMsgType

logger = logging.getLogger(__name__)

# Servo channel assignments (CONFIRMED WORKING)
SERVO_CHANNELS = {
    'base': 0,
    'shoulder': 4,
    'elbow': 8,
    'wrist': 12,
}


def radians_to_servo_degrees(rad: float) -> float:
    """Convert radians (centered at 0) to servo degrees (centered at 90)."""
    deg = 90 + (rad * 180 / math.pi)
    return max(0, min(180, deg))


class ArmWebSocketHandler:
    """Handles WebSocket connections for arm control."""

    def __init__(self, arm_controller=None, angle_converter=None):
        """Initialize WebSocket handler.

        Args:
            arm_controller: ArmController instance (None for simulation)
            angle_converter: Module with conversion functions (not used in simplified version)
        """
        self.arm = arm_controller
        self.clients: Set[web.WebSocketResponse] = set()
        self.emergency_stopped = False

        # Current arm state (in radians, matching frontend)
        self.current_state = {
            'yaw': 0.0,
            'pitch': 0.0,
            'elbow': 0.0,
            'roll': 0.0,
            'biopsyExtension': 0.0
        }

    async def handle_connection(self, request: web.Request) -> web.WebSocketResponse:
        """Handle new WebSocket connection."""
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        self.clients.add(ws)
        client_id = id(ws)
        logger.info(f"Client {client_id} connected. Total clients: {len(self.clients)}")

        # Send current state to new client
        try:
            await ws.send_json({
                'type': 'state_update',
                'armState': self.current_state,
                'timestamp': int(time.time() * 1000)
            })
        except Exception as e:
            logger.error(f"Error sending initial state: {e}")

        try:
            async for msg in ws:
                if msg.type == WSMsgType.TEXT:
                    await self._handle_message(ws, msg.data)
                elif msg.type == WSMsgType.ERROR:
                    logger.error(f"WebSocket error: {ws.exception()}")
                elif msg.type == WSMsgType.CLOSE:
                    break
        except Exception as e:
            logger.exception(f"Error in WebSocket handler: {e}")
        finally:
            self.clients.discard(ws)
            logger.info(f"Client {client_id} disconnected. Total clients: {len(self.clients)}")

        return ws

    async def _handle_message(self, ws: web.WebSocketResponse, data: str):
        """Process incoming WebSocket message."""
        try:
            message = json.loads(data)
            msg_type = message.get('type')
            timestamp = message.get('timestamp', int(time.time() * 1000))

            if msg_type == 'set_position':
                await self._handle_set_position(ws, message, timestamp)
            elif msg_type == 'get_state':
                await ws.send_json({
                    'type': 'state_update',
                    'armState': self.current_state,
                    'timestamp': timestamp
                })
            elif msg_type == 'heartbeat':
                await ws.send_json({'type': 'heartbeat', 'timestamp': timestamp})
            elif msg_type == 'command':
                await self._handle_command(ws, message, timestamp)
            else:
                logger.warning(f"Unknown message type: {msg_type}")

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON: {e}")
        except Exception as e:
            logger.exception(f"Error handling message: {e}")

    async def _handle_set_position(self, ws: web.WebSocketResponse, message: Dict[str, Any], timestamp: int):
        """Handle position update from frontend."""
        if self.emergency_stopped:
            await ws.send_json({'type': 'error', 'message': 'System in emergency stop'})
            return

        # Extract position (in radians from frontend)
        yaw = message.get('yaw', self.current_state['yaw'])
        pitch = message.get('pitch', self.current_state['pitch'])
        elbow = message.get('elbow', self.current_state['elbow'])
        roll = message.get('roll', self.current_state['roll'])

        # Convert to servo degrees
        base_deg = radians_to_servo_degrees(yaw)
        shoulder_deg = radians_to_servo_degrees(pitch)
        elbow_deg = radians_to_servo_degrees(elbow)
        wrist_deg = radians_to_servo_degrees(roll)

        # Move servos if hardware available
        if self.arm:
            try:
                self.arm.set_servo_angle('base', base_deg)
                self.arm.set_servo_angle('shoulder', shoulder_deg)
                self.arm.set_servo_angle('elbow', elbow_deg)
                self.arm.set_servo_angle('wrist', wrist_deg)
                logger.info(f"Servos: base={base_deg:.0f}° shoulder={shoulder_deg:.0f}° elbow={elbow_deg:.0f}° wrist={wrist_deg:.0f}°")
            except Exception as e:
                logger.error(f"Servo error: {e}")
        else:
            logger.debug(f"[SIM] base={base_deg:.0f}° shoulder={shoulder_deg:.0f}° elbow={elbow_deg:.0f}° wrist={wrist_deg:.0f}°")

        # Update current state
        self.current_state['yaw'] = yaw
        self.current_state['pitch'] = pitch
        self.current_state['elbow'] = elbow
        self.current_state['roll'] = roll

        # Send acknowledgment
        await ws.send_json({'type': 'ack', 'timestamp': timestamp})

    async def _handle_command(self, ws: web.WebSocketResponse, message: Dict[str, Any], timestamp: int):
        """Handle command messages."""
        action = message.get('action')
        logger.info(f"Command: {action}")

        if action == 'emergency_stop':
            self.emergency_stopped = True
            logger.warning("EMERGENCY STOP ACTIVATED")
            await self._broadcast({'type': 'ack', 'action': 'emergency_stop', 'timestamp': timestamp})

        elif action == 'clear_fault':
            self.emergency_stopped = False
            logger.info("Fault cleared")
            await ws.send_json({'type': 'ack', 'action': 'clear_fault', 'timestamp': timestamp})

        elif action == 'reset_position':
            if not self.emergency_stopped and self.arm:
                try:
                    self.arm.home()
                except Exception as e:
                    logger.error(f"Home error: {e}")

            self.current_state = {
                'yaw': 0.0, 'pitch': 0.0, 'elbow': 0.0, 'roll': 0.0, 'biopsyExtension': 0.0
            }
            await self._broadcast_state()
            await ws.send_json({'type': 'ack', 'action': 'reset_position', 'timestamp': timestamp})

        elif action == 'perform_biopsy':
            if not self.emergency_stopped:
                logger.info("Performing biopsy...")
                self.current_state['biopsyExtension'] = 0.8
                await self._broadcast_state()
                await asyncio.sleep(2.0)
                self.current_state['biopsyExtension'] = 0.0
                await self._broadcast_state()
                logger.info("Biopsy complete")
            await ws.send_json({'type': 'ack', 'action': 'perform_biopsy', 'timestamp': timestamp})

    async def _broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients."""
        disconnected = set()
        for client in self.clients:
            try:
                if not client.closed:
                    await client.send_json(message)
            except Exception:
                disconnected.add(client)
        self.clients -= disconnected

    async def _broadcast_state(self):
        """Broadcast current state to all clients."""
        await self._broadcast({
            'type': 'state_update',
            'armState': self.current_state,
            'timestamp': int(time.time() * 1000)
        })

    def shutdown(self):
        """Cleanup on shutdown."""
        pass
