#!/usr/bin/env python3
"""Test WebSocket arm control - bypasses React frontend."""

import asyncio
import json
import sys

import aiohttp


async def test_arm_control():
    """Test arm control via WebSocket."""
    uri = "http://localhost:8765"

    print("=" * 60)
    print("WebSocket Arm Control Test")
    print("=" * 60)
    print(f"Connecting to {uri}...")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.ws_connect(uri) as ws:
                print("✓ Connected!")

            # Get initial state
            await ws.send_json({"type": "get_state", "timestamp": 0})
            response = await ws.receive_json()
            print(f"Initial state: {response}")

            # Test positions (radians) - will convert to servo angles
            # 0 rad = 90°, 0.5 rad ≈ 119°, -0.5 rad ≈ 61°
            test_positions = [
                {"yaw": 0.0, "pitch": 0.0, "roll": 0.0, "desc": "Center (90°, 90°, 90°)"},
                {"yaw": 0.5, "pitch": 0.0, "roll": 0.0, "desc": "Base to ~119°"},
                {"yaw": -0.5, "pitch": 0.0, "roll": 0.0, "desc": "Base to ~61°"},
                {"yaw": 0.0, "pitch": 0.5, "roll": 0.0, "desc": "Shoulder to ~119°"},
                {"yaw": 0.0, "pitch": -0.5, "roll": 0.0, "desc": "Shoulder to ~61°"},
                {"yaw": 0.0, "pitch": 0.0, "roll": 0.0, "desc": "Back to center"},
            ]

            print("\nSending position commands with 2-second delays...")
            print()

            for i, pos in enumerate(test_positions, 1):
                desc = pos.pop("desc")
                print(f"[{i}/{len(test_positions)}] {desc}")

                msg = {
                    "type": "set_position",
                    "yaw": pos["yaw"],
                    "pitch": pos["pitch"],
                    "roll": pos["roll"],
                    "timestamp": i * 1000
                }

                await ws.send_json(msg)

                # Wait for ack
                try:
                    response = await asyncio.wait_for(ws.receive_json(), timeout=1.0)
                    print(f"    Response: {str(response)[:80]}...")
                except asyncio.TimeoutError:
                    print("    No response (timeout)")

                # IMPORTANT: Wait for servo to move
                print("    Waiting 2 seconds for servo...")
                await asyncio.sleep(2.0)
                print()

            print("=" * 60)
            print("Test complete!")
            print("Did the servos move for each command?")
            print("=" * 60)

    except ConnectionRefusedError:
        print("✗ Could not connect to server")
        print("  Make sure backend is running: ./scripts/start_medtwin.sh")
        return 1
    except Exception as e:
        print(f"✗ Error: {e}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(test_arm_control()))
