/**
 * Skin Lesion Classification Service
 * 
 * This service handles communication with the Raspberry Pi for AI-based
 * skin lesion classification. The model runs on the Raspberry Pi and
 * returns predictions to the app.
 * 
 * Model Configuration:
 * - Update MODEL_PATH to point to your trained model file
 * - Supported formats: .h5, .tflite, .onnx, .pt
 */

import { HARDWARE_CONFIG } from '@/hooks/useHardwareConnection';

// ============================================
// MODEL CONFIGURATION - UPDATE THESE PATHS
// ============================================
export const MODEL_CONFIG = {
  // Path to your trained model
  MODEL_PATH: 'densenet121_skin_lesion.keras',

  // Model metadata
  MODEL_NAME: 'SkinLesionClassifier',
  MODEL_VERSION: '1.0.0',
  MODEL_ARCHITECTURE: 'DenseNet-121',

  // Classification labels
  LABELS: ['Benign', 'Malignant'] as const,

  // Input configuration
  INPUT_SIZE: { width: 224, height: 224 },
  NORMALIZE: true,

  // Inference settings
  CONFIDENCE_THRESHOLD: 0.5,

  // Local API endpoint
  CLASSIFICATION_ENDPOINT: `http://localhost:5000/classify`,
};

export type ClassificationLabel = typeof MODEL_CONFIG.LABELS[number];

export interface ClassificationResult {
  label: ClassificationLabel;
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
  inferenceTime: number;
  modelInfo: {
    name: string;
    version: string;
    architecture: string;
  };
}

export interface ClassificationError {
  error: string;
  code: string;
}

/**
 * Request classification from the Raspberry Pi model server
 * 
 * @param imageData - Base64 encoded image data or image URL
 * @returns Classification result or error
 */
export const classifyImage = async (
  imageData?: string
): Promise<ClassificationResult> => {
  const startTime = Date.now();

  try {
    // Build request to Raspberry Pi classification server
    const response = await fetch(MODEL_CONFIG.CLASSIFICATION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData || 'capture', // 'capture' tells Pi to use live camera
        model_path: MODEL_CONFIG.MODEL_PATH,
        input_size: MODEL_CONFIG.INPUT_SIZE,
        normalize: MODEL_CONFIG.NORMALIZE,
      }),
    });

    if (!response.ok) {
      throw new Error(`Classification failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      label: result.label as ClassificationLabel,
      confidence: result.confidence,
      probabilities: {
        benign: result.probabilities?.benign || (result.label === 'Benign' ? result.confidence : 1 - result.confidence),
        malignant: result.probabilities?.malignant || (result.label === 'Malignant' ? result.confidence : 1 - result.confidence),
      },
      features: result.features || {
        asymmetry: 0,
        border: 0,
        color: 0,
        diameter: 0,
      },
      inferenceTime: result.inference_time || (Date.now() - startTime),
      modelInfo: {
        name: MODEL_CONFIG.MODEL_NAME,
        version: MODEL_CONFIG.MODEL_VERSION,
        architecture: MODEL_CONFIG.MODEL_ARCHITECTURE,
      },
    };
  } catch (error) {
    console.error('[Classification] Error:', error);
    throw error;
  }
};

/**
 * Simulate classification for development/demo purposes
 * Remove this in production and use classifyImage instead
 */
export const simulateClassification = async (): Promise<ClassificationResult> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

  const isMalignant = Math.random() > 0.6;
  const confidence = Math.floor(Math.random() * 25) + 75; // 75-99%

  return {
    label: isMalignant ? 'Malignant' : 'Benign',
    confidence,
    probabilities: {
      benign: isMalignant ? 100 - confidence : confidence,
      malignant: isMalignant ? confidence : 100 - confidence,
    },
    features: {
      asymmetry: Math.floor(Math.random() * 40) + 20,
      border: Math.floor(Math.random() * 35) + 25,
      color: Math.floor(Math.random() * 30) + 30,
      diameter: Math.floor(Math.random() * 25) + 15,
    },
    inferenceTime: Math.floor(Math.random() * 100) + 100, // 100-200ms
    modelInfo: {
      name: MODEL_CONFIG.MODEL_NAME,
      version: MODEL_CONFIG.MODEL_VERSION,
      architecture: MODEL_CONFIG.MODEL_ARCHITECTURE,
    },
  };
};

/**
 * Check if the classification service is available on Raspberry Pi
 */
export const checkClassificationService = async (): Promise<boolean> => {
  try {
    const healthEndpoint = MODEL_CONFIG.CLASSIFICATION_ENDPOINT.replace('/classify', '/health');
    const response = await fetch(healthEndpoint, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Get model information from Raspberry Pi
 */
export const getModelInfo = async () => {
  try {
    const infoEndpoint = MODEL_CONFIG.CLASSIFICATION_ENDPOINT.replace('/classify', '/model-info');
    const response = await fetch(infoEndpoint);
    if (!response.ok) throw new Error('Failed to get model info');
    return await response.json();
  } catch (error) {
    console.error('[Classification] Failed to get model info:', error);
    return {
      name: MODEL_CONFIG.MODEL_NAME,
      version: MODEL_CONFIG.MODEL_VERSION,
      architecture: MODEL_CONFIG.MODEL_ARCHITECTURE,
      path: MODEL_CONFIG.MODEL_PATH,
    };
  }
};
