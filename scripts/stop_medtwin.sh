#!/bin/bash
#
# MedTwin Pro - Shutdown Script
# ==============================
#
# Gracefully stops the MedTwin Pro system.
#
# Usage:
#   ./scripts/stop_medtwin.sh
#

# Configuration
PROJECT_DIR="/home/pi/Downloads/robotic-arm"
PID_FILE="${PROJECT_DIR}/medtwin.pid"
FRONTEND_PID_FILE="${PROJECT_DIR}/frontend.pid"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           MedTwin Pro - Shutting Down                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

STOPPED_SOMETHING=false

# Stop backend
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Stopping backend (PID: $PID)..."
        kill -SIGTERM "$PID" 2>/dev/null

        # Wait for graceful shutdown
        for i in {1..10}; do
            if ! ps -p "$PID" > /dev/null 2>&1; then
                break
            fi
            sleep 0.5
        done

        # Force kill if still running
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "  Force stopping..."
            kill -9 "$PID" 2>/dev/null
        fi

        echo -e "${GREEN}✓ Backend stopped${NC}"
        STOPPED_SOMETHING=true
    else
        echo "Backend not running (stale PID file)"
    fi
    rm -f "$PID_FILE"
else
    echo "Backend not running (no PID file)"
fi

# Stop frontend
if [ -f "$FRONTEND_PID_FILE" ]; then
    PID=$(cat "$FRONTEND_PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Stopping frontend (PID: $PID)..."
        kill -SIGTERM "$PID" 2>/dev/null

        # Wait for graceful shutdown
        for i in {1..5}; do
            if ! ps -p "$PID" > /dev/null 2>&1; then
                break
            fi
            sleep 0.5
        done

        # Force kill if still running
        if ps -p "$PID" > /dev/null 2>&1; then
            kill -9 "$PID" 2>/dev/null
        fi

        echo -e "${GREEN}✓ Frontend stopped${NC}"
        STOPPED_SOMETHING=true
    else
        echo "Frontend not running (stale PID file)"
    fi
    rm -f "$FRONTEND_PID_FILE"
fi

# Kill any orphaned processes on our ports
echo "Checking for orphaned processes..."

for PORT in 8765 5000 8080; do
    PID=$(lsof -t -i:$PORT 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "  Killing process on port $PORT (PID: $PID)"
        kill -9 $PID 2>/dev/null
        STOPPED_SOMETHING=true
    fi
done

if [ "$STOPPED_SOMETHING" = true ]; then
    echo ""
    echo -e "${GREEN}MedTwin Pro stopped successfully${NC}"
else
    echo ""
    echo -e "${YELLOW}MedTwin Pro was not running${NC}"
fi
