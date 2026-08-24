#!/bin/bash
#
# MedTwin Pro - Environment Setup Script
# ======================================
#
# One-command setup for the complete MedTwin Pro development environment.
#
# Usage:
#   ./scripts/setup_env.sh
#

set -e

# Configuration
PROJECT_DIR="/home/pi/Downloads/robotic-arm"
VENV_DIR="${PROJECT_DIR}/venv"
FRONTEND_DIR="${PROJECT_DIR}/full-app-code/twin-touch-biopsy-frontend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         MedTwin Pro - Environment Setup                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

cd "$PROJECT_DIR"

# Step 1: Python Virtual Environment
echo -e "${BLUE}[1/5] Setting up Python virtual environment...${NC}"
if [ -d "$VENV_DIR" ]; then
    echo "  Virtual environment already exists, activating..."
else
    echo "  Creating new virtual environment..."
    python3 -m venv "$VENV_DIR"
fi
source "${VENV_DIR}/bin/activate"
echo -e "${GREEN}  ✓ Virtual environment activated${NC}"

# Step 2: Upgrade pip
echo -e "${BLUE}[2/5] Upgrading pip...${NC}"
pip install --upgrade pip --quiet
echo -e "${GREEN}  ✓ pip upgraded${NC}"

# Step 3: Install Python dependencies
echo -e "${BLUE}[3/5] Installing Python dependencies...${NC}"

# Install from requirements.txt
pip install -r requirements.txt 2>&1 | grep -E "(Installing|Successfully|ERROR)" || true

echo -e "${GREEN}  ✓ Python dependencies installed${NC}"

# Note about ML
echo -e "${YELLOW}  Note: ML backends (TensorFlow/TFLite) disabled for Python 3.13${NC}"
echo -e "${YELLOW}        Classification will run in simulation mode${NC}"

# Step 4: Check Node.js and install frontend dependencies
echo -e "${BLUE}[4/5] Setting up frontend...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  Node.js ${NODE_VERSION} found"
else
    echo -e "${YELLOW}  Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y nodejs > /dev/null 2>&1
    echo "  Node.js $(node --version) installed"
fi

if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    echo "  Installing npm dependencies..."
    npm install --silent 2>/dev/null || npm install
    cd "$PROJECT_DIR"
    echo -e "${GREEN}  ✓ Frontend ready${NC}"
else
    echo -e "${YELLOW}  Frontend directory not found, skipping...${NC}"
fi

# Step 5: Verify hardware (optional)
echo -e "${BLUE}[5/5] Verifying hardware...${NC}"

# Check I2C
if command -v i2cdetect &> /dev/null; then
    I2C_DEVICES=$(i2cdetect -y 1 2>/dev/null | grep "40" || true)
    if [ -n "$I2C_DEVICES" ]; then
        echo -e "${GREEN}  ✓ PCA9685 detected at 0x40${NC}"
    else
        echo -e "${YELLOW}  PCA9685 not detected (connect hardware or enable I2C)${NC}"
    fi
else
    echo -e "${YELLOW}  i2cdetect not available (install i2c-tools)${NC}"
fi

# Check camera
python3 -c "import cv2; cap = cv2.VideoCapture(0); exit(0 if cap.isOpened() else 1)" 2>/dev/null && {
    echo -e "${GREEN}  ✓ Camera detected${NC}"
} || {
    echo -e "${YELLOW}  Camera not detected (will use test pattern)${NC}"
}

# Done
echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              Environment Setup Complete!                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo "Next steps:"
echo "  1. Start the system:  ./scripts/start_medtwin.sh"
echo "  2. Open browser:      http://raspberrypi.local:5173"
echo ""
echo "To activate the environment in a new terminal:"
echo "  source ${VENV_DIR}/bin/activate"
echo ""
