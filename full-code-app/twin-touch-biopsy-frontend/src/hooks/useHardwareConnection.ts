import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// Configuration - Update these values to match your Raspberry Pi
export const HARDWARE_CONFIG = {
  // WebSocket URL for Raspberry Pi control server (main unified server)
  WS_URL: 'ws://raspberrypi.local:8765/ws',
  // Camera stream URL (MJPEG)
  CAMERA_URL: 'http://raspberrypi.local:8080/stream.mjpg',
  // Reconnection settings
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  // Fault detection timeout (ms)
  COMMAND_TIMEOUT: 2000,
  // Heartbeat interval (ms)
  HEARTBEAT_INTERVAL: 5000,
};

export interface ArmState {
  yaw: number;    // Base rotation (radians)
  pitch: number;  // Shoulder angle (radians)
  elbow: number;  // Elbow angle (radians)
  roll: number;   // Wrist rotation (radians)
  biopsyExtension: number; // 0-1 normalized
}

export interface HardwareStatus {
  isConnected: boolean;
  lastHeartbeat: number | null;
  faultDetected: boolean;
  faultMessage: string | null;
  latency: number;
}

interface CommandMessage {
  type: 'command';
  action: string;
  value?: number;
  timestamp: number;
}

interface PositionMessage {
  type: 'set_position';
  yaw: number;
  pitch: number;
  elbow: number;
  roll: number;
  timestamp: number;
}

interface StateMessage {
  type: 'state_update';
  armState: ArmState;
  timestamp: number;
}

interface HeartbeatMessage {
  type: 'heartbeat';
  timestamp: number;
}

type WebSocketMessage = StateMessage | HeartbeatMessage | { type: string; [key: string]: any };

export const useHardwareConnection = () => {
  const [armState, setArmState] = useState<ArmState>({
    yaw: 0,
    pitch: 0,
    elbow: 0,
    roll: 0,
    biopsyExtension: 0,
  });

  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus>({
    isConnected: false,
    lastHeartbeat: null,
    faultDetected: false,
    faultMessage: null,
    latency: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCommandsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      console.log(`[Hardware] Connecting to ${HARDWARE_CONFIG.WS_URL}...`);
      const ws = new WebSocket(HARDWARE_CONFIG.WS_URL);

      ws.onopen = () => {
        console.log('[Hardware] WebSocket connected');
        reconnectAttemptsRef.current = 0;
        setHardwareStatus(prev => ({
          ...prev,
          isConnected: true,
          faultDetected: false,
          faultMessage: null,
        }));
        toast.success('Hardware connected');

        // Request initial state
        ws.send(JSON.stringify({ type: 'get_state', timestamp: Date.now() }));

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
          }
        }, HARDWARE_CONFIG.HEARTBEAT_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('[Hardware] Failed to parse message:', error);
        }
      };

      ws.onclose = () => {
        console.log('[Hardware] WebSocket disconnected');
        setHardwareStatus(prev => ({
          ...prev,
          isConnected: false,
        }));

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Attempt reconnection
        if (reconnectAttemptsRef.current < HARDWARE_CONFIG.MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`[Hardware] Reconnecting (${reconnectAttemptsRef.current}/${HARDWARE_CONFIG.MAX_RECONNECT_ATTEMPTS})...`);
          reconnectTimeoutRef.current = setTimeout(connect, HARDWARE_CONFIG.RECONNECT_INTERVAL);
        } else {
          setHardwareStatus(prev => ({
            ...prev,
            faultDetected: true,
            faultMessage: 'Failed to connect after multiple attempts',
          }));
          toast.error('Hardware connection failed');
        }
      };

      ws.onerror = (error) => {
        console.error('[Hardware] WebSocket error:', error);
        setHardwareStatus(prev => ({
          ...prev,
          faultDetected: true,
          faultMessage: 'WebSocket connection error',
        }));
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[Hardware] Connection error:', error);
      setHardwareStatus(prev => ({
        ...prev,
        faultDetected: true,
        faultMessage: 'Failed to establish connection',
      }));
    }
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    const now = Date.now();

    switch (message.type) {
      case 'state_update':
        const stateMsg = message as StateMessage;
        setArmState(stateMsg.armState);
        // Clear pending command if this is a response
        pendingCommandsRef.current.forEach((timeout, timestamp) => {
          if (stateMsg.timestamp >= timestamp) {
            clearTimeout(timeout);
            pendingCommandsRef.current.delete(timestamp);
          }
        });
        break;

      case 'heartbeat':
        const heartbeatMsg = message as HeartbeatMessage;
        const latency = now - heartbeatMsg.timestamp;
        setHardwareStatus(prev => ({
          ...prev,
          lastHeartbeat: now,
          latency,
          faultDetected: false,
          faultMessage: null,
        }));
        break;

      case 'error':
        console.error('[Hardware] Error from server:', message);
        setHardwareStatus(prev => ({
          ...prev,
          faultDetected: true,
          faultMessage: message.message || 'Hardware error',
        }));
        toast.error(message.message || 'Hardware error');
        break;

      case 'ack':
        // Command acknowledged - clear timeout
        if (message.timestamp) {
          const timeout = pendingCommandsRef.current.get(message.timestamp);
          if (timeout) {
            clearTimeout(timeout);
            pendingCommandsRef.current.delete(message.timestamp);
          }
        }
        break;

      default:
        console.log('[Hardware] Unknown message type:', message.type);
    }
  }, []);

  // Send command to hardware
  const sendCommand = useCallback((action: string, value?: number): boolean => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[Hardware] Not connected, cannot send command');
      return false;
    }

    const timestamp = Date.now();
    const command: CommandMessage = {
      type: 'command',
      action,
      value,
      timestamp,
    };

    try {
      wsRef.current.send(JSON.stringify(command));
      console.log('[Hardware] Command sent:', action, value);

      // Set up fault detection timeout
      const timeout = setTimeout(() => {
        console.warn(`[Hardware] Command timeout: ${action}`);
        setHardwareStatus(prev => ({
          ...prev,
          faultDetected: true,
          faultMessage: `Command "${action}" timed out`,
        }));
        pendingCommandsRef.current.delete(timestamp);
      }, HARDWARE_CONFIG.COMMAND_TIMEOUT);

      pendingCommandsRef.current.set(timestamp, timeout);
      return true;
    } catch (error) {
      console.error('[Hardware] Failed to send command:', error);
      return false;
    }
  }, []);

  // Send position update (for slider control)
  const sendPosition = useCallback((newState: Partial<ArmState>): boolean => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    const timestamp = Date.now();
    const positionMsg: PositionMessage = {
      type: 'set_position',
      yaw: newState.yaw ?? armState.yaw,
      pitch: newState.pitch ?? armState.pitch,
      elbow: newState.elbow ?? armState.elbow,
      roll: newState.roll ?? armState.roll,
      timestamp,
    };

    try {
      wsRef.current.send(JSON.stringify(positionMsg));
      return true;
    } catch (error) {
      console.error('[Hardware] Failed to send position:', error);
      return false;
    }
  }, [armState]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    pendingCommandsRef.current.forEach((timeout) => clearTimeout(timeout));
    pendingCommandsRef.current.clear();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setHardwareStatus({
      isConnected: false,
      lastHeartbeat: null,
      faultDetected: false,
      faultMessage: null,
      latency: 0,
    });
  }, []);

  // Emergency stop
  const emergencyStop = useCallback(() => {
    sendCommand('emergency_stop');
  }, [sendCommand]);

  // Reset fault state
  const clearFault = useCallback(() => {
    sendCommand('clear_fault');
    setHardwareStatus(prev => ({
      ...prev,
      faultDetected: false,
      faultMessage: null,
    }));
  }, [sendCommand]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    armState,
    hardwareStatus,
    connect,
    disconnect,
    sendCommand,
    sendPosition,
    emergencyStop,
    clearFault,
    setArmState,
  };
};