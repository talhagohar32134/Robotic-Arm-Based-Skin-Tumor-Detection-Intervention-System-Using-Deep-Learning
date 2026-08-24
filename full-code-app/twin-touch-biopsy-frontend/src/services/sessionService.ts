/**
 * Session Service
 * 
 * Manages doctor authentication sessions using localStorage.
 * No database - credentials are validated locally.
 * In production with Raspberry Pi, this can be extended to validate
 * against a local user store on the Pi.
 */

export interface DoctorSession {
  username: string;
  displayName: string;
  role: 'doctor' | 'admin' | 'technician';
  loginTime: string;
  lastActivity: string;
}

const SESSION_KEY = 'medtwin_session';
const ACTIVITY_KEY = 'medtwin_last_activity';

// Default credentials (in production, these would be on the Raspberry Pi server)
const VALID_CREDENTIALS = [
  { username: 'doctor', password: 'medtwin2024', displayName: 'Dr. Michael Chen', role: 'doctor' as const },
  { username: 'admin', password: 'admin2024', displayName: 'System Admin', role: 'admin' as const },
  { username: 'tech', password: 'tech2024', displayName: 'Lab Technician', role: 'technician' as const },
];

/** Authenticate doctor credentials */
export const authenticate = (username: string, password: string): DoctorSession | null => {
  const user = VALID_CREDENTIALS.find(
    c => c.username === username && c.password === password
  );

  if (!user) return null;

  const session: DoctorSession = {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
  return session;
};

/** Get current session */
export const getSession = (): DoctorSession | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/** Update last activity timestamp */
export const updateActivity = (): void => {
  localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
  const session = getSession();
  if (session) {
    session.lastActivity = new Date().toISOString();
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
};

/** Check if session has timed out */
export const isSessionExpired = (timeoutMinutes: number = 30): boolean => {
  const lastActivity = localStorage.getItem(ACTIVITY_KEY);
  if (!lastActivity) return true;

  const elapsed = Date.now() - parseInt(lastActivity);
  return elapsed > timeoutMinutes * 60 * 1000;
};

/** Logout - clear session */
export const logout = (): void => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ACTIVITY_KEY);
};

/** Quick login (no credentials check - for development) */
export const quickLogin = (): DoctorSession => {
  const session: DoctorSession = {
    username: 'doctor',
    displayName: 'Dr. Michael Chen',
    role: 'doctor',
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
  return session;
};
