/**
 * Results Service
 * 
 * Manages biopsy results using localStorage for persistence.
 * Stores classification results, patient info, and session data.
 * No database required - all data stored client-side.
 * 
 * When Raspberry Pi is integrated, results come from real AI classification.
 * Results can be exported as CSV/JSON for medical records.
 */

import { ClassificationResult } from './classificationService';

export interface BiopsyResult {
  id: string;
  patientName: string;
  patientId?: string;
  date: string;
  time: string;
  classification: 'Benign' | 'Malignant';
  confidence: number;
  probabilities: {
    benign: number;
    malignant: number;
  };
  features: {
    asymmetry: number;
    border: number;
    color: number;
    diameter: number;
  };
  tumorLocation: string;
  doctorName: string;
  notes: string;
  status: 'Completed' | 'Pending Review' | 'Reviewed';
  armPosition?: {
    yaw: number;
    pitch: number;
    roll: number;
  };
  inferenceTime?: number;
  modelInfo?: {
    name: string;
    version: string;
    architecture: string;
  };
  imageData?: string; // Base64 encoded capture from camera
  createdAt: string;
  updatedAt: string;
}

export interface SessionLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  level: 'info' | 'warning' | 'error' | 'success';
}

const RESULTS_KEY = 'medtwin_results';
const SESSION_LOG_KEY = 'medtwin_session_log';

// ============================================
// RESULTS MANAGEMENT
// ============================================

/** Generate unique ID */
const generateId = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `BX-${year}-${num}`;
};

/** Get all stored results */
export const getAllResults = (): BiopsyResult[] => {
  try {
    const stored = localStorage.getItem(RESULTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Results] Failed to load:', error);
    return [];
  }
};

/** Save a new biopsy result from AI classification */
export const saveResult = (
  classificationResult: ClassificationResult,
  patientInfo: {
    patientName: string;
    patientId?: string;
    tumorLocation: string;
    doctorName: string;
    notes: string;
  },
  armPosition?: { yaw: number; pitch: number; roll: number },
  imageData?: string
): BiopsyResult => {
  const now = new Date();
  const result: BiopsyResult = {
    id: generateId(),
    patientName: patientInfo.patientName,
    patientId: patientInfo.patientId,
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().slice(0, 5),
    classification: classificationResult.label,
    confidence: classificationResult.confidence,
    probabilities: classificationResult.probabilities,
    features: classificationResult.features,
    tumorLocation: patientInfo.tumorLocation,
    doctorName: patientInfo.doctorName,
    notes: patientInfo.notes,
    status: 'Completed',
    armPosition,
    inferenceTime: classificationResult.inferenceTime,
    modelInfo: classificationResult.modelInfo,
    imageData,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const results = getAllResults();
  results.unshift(result); // newest first
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));

  logSession('success', 'Biopsy Result Saved', `Case ${result.id}: ${result.classification} (${result.confidence}%)`);
  return result;
};

/** Update result status */
export const updateResultStatus = (id: string, status: BiopsyResult['status']): boolean => {
  const results = getAllResults();
  const index = results.findIndex(r => r.id === id);
  if (index === -1) return false;

  results[index].status = status;
  results[index].updatedAt = new Date().toISOString();
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  return true;
};

/** Update result notes */
export const updateResultNotes = (id: string, notes: string): boolean => {
  const results = getAllResults();
  const index = results.findIndex(r => r.id === id);
  if (index === -1) return false;

  results[index].notes = notes;
  results[index].updatedAt = new Date().toISOString();
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  return true;
};

/** Delete a result */
export const deleteResult = (id: string): boolean => {
  const results = getAllResults();
  const filtered = results.filter(r => r.id !== id);
  if (filtered.length === results.length) return false;

  localStorage.setItem(RESULTS_KEY, JSON.stringify(filtered));
  logSession('warning', 'Result Deleted', `Case ${id} removed`);
  return true;
};

/** Get results statistics */
export const getResultsStats = () => {
  const results = getAllResults();
  const total = results.length;
  const benign = results.filter(r => r.classification === 'Benign').length;
  const malignant = results.filter(r => r.classification === 'Malignant').length;
  const avgConfidence = total > 0
    ? Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / total)
    : 0;
  const avgInferenceTime = total > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.inferenceTime || 0), 0) / total)
    : 0;

  return { total, benign, malignant, avgConfidence, avgInferenceTime };
};

// ============================================
// SESSION LOGGING
// ============================================

export const logSession = (
  level: SessionLog['level'],
  action: string,
  details: string
): void => {
  try {
    const logs = getSessionLogs();
    logs.unshift({
      id: crypto.randomUUID?.() || Date.now().toString(),
      timestamp: new Date().toISOString(),
      action,
      details,
      level,
    });
    // Keep last 500 logs
    localStorage.setItem(SESSION_LOG_KEY, JSON.stringify(logs.slice(0, 500)));
  } catch (error) {
    console.error('[SessionLog] Failed to write:', error);
  }
};

export const getSessionLogs = (): SessionLog[] => {
  try {
    const stored = localStorage.getItem(SESSION_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const clearSessionLogs = (): void => {
  localStorage.removeItem(SESSION_LOG_KEY);
};

// ============================================
// EXPORT FUNCTIONALITY
// ============================================

/** Export results as JSON */
export const exportResultsJSON = () => {
  const results = getAllResults();
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `medtwin_results_${new Date().toISOString().split('T')[0]}.json`);
};

/** Export results as CSV */
export const exportResultsCSV = () => {
  const results = getAllResults();
  if (results.length === 0) return;

  const headers = [
    'Case ID', 'Patient Name', 'Date', 'Time', 'Classification',
    'Confidence (%)', 'Benign Prob (%)', 'Malignant Prob (%)',
    'Asymmetry', 'Border', 'Color', 'Diameter',
    'Tumor Location', 'Doctor', 'Status', 'Notes',
    'Inference Time (ms)', 'Model', 'Architecture'
  ];

  const rows = results.map(r => [
    r.id, r.patientName, r.date, r.time, r.classification,
    r.confidence, r.probabilities.benign, r.probabilities.malignant,
    r.features.asymmetry, r.features.border, r.features.color, r.features.diameter,
    r.tumorLocation, r.doctorName, r.status, `"${r.notes.replace(/"/g, '""')}"`,
    r.inferenceTime || '', r.modelInfo?.name || '', r.modelInfo?.architecture || ''
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `medtwin_results_${new Date().toISOString().split('T')[0]}.csv`);
};

/** Export single result as PDF-ready HTML */
export const exportResultReport = (result: BiopsyResult) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Biopsy Report - ${result.id}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
    h1 { color: #1a365d; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .badge { padding: 4px 12px; border-radius: 4px; font-weight: bold; color: white; }
    .benign { background: #10b981; }
    .malignant { background: #ef4444; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: 600; }
    .features { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .feature-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
    .feature-fill { height: 100%; background: #3b82f6; border-radius: 4px; }
    .notes { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
    .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏥 MedTwin Pro - Biopsy Report</h1>
    <span class="badge ${result.classification.toLowerCase()}">${result.classification}</span>
  </div>
  
  <table>
    <tr><th>Case ID</th><td>${result.id}</td></tr>
    <tr><th>Patient</th><td>${result.patientName}</td></tr>
    <tr><th>Date</th><td>${result.date} at ${result.time}</td></tr>
    <tr><th>Location</th><td>${result.tumorLocation}</td></tr>
    <tr><th>Doctor</th><td>${result.doctorName}</td></tr>
    <tr><th>Confidence</th><td>${result.confidence}%</td></tr>
    <tr><th>Status</th><td>${result.status}</td></tr>
  </table>

  <h2>ABCD Feature Analysis</h2>
  <table>
    <tr><th>Feature</th><th>Score</th></tr>
    <tr><td>Asymmetry</td><td>${result.features.asymmetry}%</td></tr>
    <tr><td>Border Irregularity</td><td>${result.features.border}%</td></tr>
    <tr><td>Color Variation</td><td>${result.features.color}%</td></tr>
    <tr><td>Diameter</td><td>${result.features.diameter}%</td></tr>
  </table>

  <h2>Clinical Notes</h2>
  <div class="notes">${result.notes || 'No notes provided.'}</div>

  <div class="footer">
    <p>Generated by MedTwin Pro | ${new Date().toISOString()}</p>
    <p>Model: ${result.modelInfo?.name || 'N/A'} v${result.modelInfo?.version || 'N/A'} (${result.modelInfo?.architecture || 'N/A'})</p>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  downloadBlob(blob, `biopsy_report_${result.id}.html`);
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
