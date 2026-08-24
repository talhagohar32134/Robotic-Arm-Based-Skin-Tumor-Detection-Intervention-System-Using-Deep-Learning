/**
 * Settings Service
 * 
 * Manages all system settings using localStorage for persistence.
 * When Raspberry Pi is connected, settings are applied to hardware config.
 * No database required.
 */

export interface ConnectionSettings {
  hardwareIP: string;
  connectionPort: string;
  wsPort: string;
  cameraPort: string;
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  heartbeatInterval: number;
  commandTimeout: number;
}

export interface ControlSettings {
  movementSpeed: 'slow' | 'medium' | 'fast';
  controlSensitivity: 'low' | 'normal' | 'high';
  hardwareSyncConfirmation: boolean;
  yawRange: { min: number; max: number };
  pitchRange: { min: number; max: number };
  rollRange: { min: number; max: number };
}

export interface AIModelSettings {
  modelPath: string;
  modelName: string;
  modelVersion: string;
  modelArchitecture: string;
  confidenceThreshold: number;
  inputWidth: number;
  inputHeight: number;
  normalize: boolean;
  classificationEndpoint: string;
}

export interface NotificationSettings {
  tumorDetectionAlerts: boolean;
  emergencyStopAlerts: boolean;
  connectionStatusAlerts: boolean;
  soundEnabled: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: boolean;
  timeoutDuration: number; // in minutes
  autoLock: boolean;
}

export interface SystemSettings {
  connection: ConnectionSettings;
  control: ControlSettings;
  aiModel: AIModelSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

const SETTINGS_KEY = 'medtwin_settings';

const DEFAULT_SETTINGS: SystemSettings = {
  connection: {
    hardwareIP: 'raspberrypi.local',
    connectionPort: '8765',
    wsPort: '8765',
    cameraPort: '8080',
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectInterval: 3000,
    heartbeatInterval: 5000,
    commandTimeout: 2000,
  },
  control: {
    movementSpeed: 'medium',
    controlSensitivity: 'normal',
    hardwareSyncConfirmation: true,
    yawRange: { min: -180, max: 180 },
    pitchRange: { min: -90, max: 90 },
    rollRange: { min: -180, max: 180 },
  },
  aiModel: {
    modelPath: '/home/pi/models/skin_lesion_classifier.h5',
    modelName: 'SkinLesionClassifier',
    modelVersion: '1.0.0',
    modelArchitecture: 'ResNet-50',
    confidenceThreshold: 0.5,
    inputWidth: 224,
    inputHeight: 224,
    normalize: true,
    classificationEndpoint: '/classify',
  },
  notifications: {
    tumorDetectionAlerts: true,
    emergencyStopAlerts: true,
    connectionStatusAlerts: true,
    soundEnabled: true,
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: true,
    timeoutDuration: 30,
    autoLock: false,
  },
};

/** Load settings from localStorage, merge with defaults */
export const loadSettings = (): SystemSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('[Settings] Failed to load:', error);
  }
  return { ...DEFAULT_SETTINGS };
};

/** Save settings to localStorage */
export const saveSettings = (settings: SystemSettings): boolean => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('[Settings] Failed to save:', error);
    return false;
  }
};

/** Update a section of settings */
export const updateSettings = <K extends keyof SystemSettings>(
  section: K,
  values: Partial<SystemSettings[K]>
): SystemSettings => {
  const current = loadSettings();
  const updated = {
    ...current,
    [section]: { ...current[section], ...values },
  };
  saveSettings(updated);
  return updated;
};

/** Reset settings to defaults */
export const resetSettings = (): SystemSettings => {
  saveSettings(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS };
};

/** Get derived hardware URLs from settings */
export const getHardwareURLs = (settings?: SystemSettings) => {
  const s = settings || loadSettings();
  const ip = s.connection.hardwareIP;
  return {
    wsURL: `ws://${ip}:${s.connection.wsPort}`,
    cameraURL: `http://${ip}:${s.connection.cameraPort}/stream.mjpg`,
    classifyURL: `http://${ip}:5000${s.aiModel.classificationEndpoint}`,
    healthURL: `http://${ip}:5000/health`,
    modelInfoURL: `http://${ip}:5000/model-info`,
  };
};

/** Export settings as JSON file */
export const exportSettings = () => {
  const settings = loadSettings();
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `medtwin_settings_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

/** Import settings from JSON file */
export const importSettings = (file: File): Promise<SystemSettings> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        saveSettings(merged);
        resolve(merged);
      } catch (error) {
        reject(new Error('Invalid settings file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
