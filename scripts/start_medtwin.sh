#!/bin/bash
#
# MedTwin Pro - Unified Startup Script
# =====================================
#
# Starts the complete MedTwin Pro system with one command.
#
# Usage:
#   ./scripts/start_medtwin.sh              # Start with TFLite (default)
#   ./scripts/start_medtwin.sh --keras      # Start with Keras model
#   ./scripts/start_medtwin.sh --dev        # Development mode (no hardware)
#   ./scripts/start_medtwin.sh --frontend   # Also start frontend dev server
#

set -e

# Configuration
PROJECT_DIR="/home/pi/Downloads/robotic-arm"
VENV_DIR="${PROJECT_DIR}/venv"
LOG_DIR="${PROJECT_DIR}/logs"
PID_FILE="${PROJECT_DIR}/medtwin.pid"
FRONTEND_PID_FILE="${PROJECT_DIR}/frontend.pid"
FRONTEND_DIR="${PROJECT_DIR}/full-app-code/twin-touch-biopsy-frontend"

# Default options
MODEL_TYPE="tflite"
DEV_MODE=false
START_FRONTEND=false
EXTRA_ARGS=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --keras)
            MODEL_TYPE="keras"
            shift
            ;;
        --dev)
            DEV_MODE=true
            EXTRA_ARGS="--dev"
            shift
            ;;
        --frontend)
            START_FRONTEND=true
            shift
            ;;
        --no-arm)
            EXTRA_ARGS="${EXTRA_ARGS} --no-arm"
            shift
            ;;
        --no-camera)
            EXTRA_ARGS="${EXTRA_ARGS} --no-camera"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--keras] [--dev] [--frontend] [--no-arm] [--no-camera]"
            exit 1
            ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           MedTwin Pro - Unified System Startup           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if backend is already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}MedTwin backend is already running (PID: $OLD_PID)${NC}"
        echo "Stop it first with: ./scripts/stop_medtwin.sh"
        exit 1
    else
        rm "$PID_FILE"
    fi
fi

# Ensure directories exist
mkdir -p "$LOG_DIR"

# Check virtual environment
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${RED}Virtual environment not found!${NC}"
    echo "Run ./scripts/setup_env.sh first"
    exit 1
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source "${VENV_DIR}/bin/activate"

# Start backend server
echo -e "${BLUE}Starting MedTwin backend...${NC}"
echo "  Model: ${MODEL_TYPE}"
echo "  Mode: $([ "$DEV_MODE" = true ] && echo "Development (no hardware)" || echo "Production")"

cd "$PROJECT_DIR"

# Build command
CMD="python src/unified_server.py --model ${MODEL_TYPE} ${EXTRA_ARGS}"

# Start backend in background
nohup $CMD > "${LOG_DIR}/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PID_FILE"

# Wait a moment and check if started
sleep 2

if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ Backend failed to start${NC}"
    echo "Check logs: tail -f ${LOG_DIR}/backend.log"
    rm -f "$PID_FILE"
    exit 1
fi

# Optionally start frontend
if [ "$START_FRONTEND" = true ]; then
    echo -e "${BLUE}Starting frontend dev server...${NC}"

    if [ -d "$FRONTEND_DIR" ]; then
        cd "$FRONTEND_DIR"
        nohup npm run dev -- --host > "${LOG_DIR}/frontend.log" 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > "$FRONTEND_PID_FILE"

        sleep 3

        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
        else
            echo -e "${YELLOW}⚠ Frontend may have failed to start${NC}"
            echo "Check logs: tail -f ${LOG_DIR}/frontend.log"
        fi
        cd "$PROJECT_DIR"
    else
        echo -e "${YELLOW}Frontend directory not found${NC}"
    fi
fi

# Print status
echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              MedTwin Pro Started Successfully!           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "  Services:"
echo "    WebSocket (arm):    ws://raspberrypi.local:8765"
echo "    HTTP API:           http://raspberrypi.local:5000"
echo "    Camera Stream:      http://raspberrypi.local:8080/stream.mjpg"
if [ "$START_FRONTEND" = true ]; then
echo "    Frontend:           http://raspberrypi.local:5173"
fi
echo ""
echo "  Logs:"
echo "    Backend:  tail -f ${LOG_DIR}/backend.log"
if [ "$START_FRONTEND" = true ]; then
echo "    Frontend: tail -f ${LOG_DIR}/frontend.log"
fi
echo ""
echo "  To stop: ./scripts/stop_medtwin.sh"
echo ""
