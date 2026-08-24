"""Model abstraction for TFLite, Keras, and Simulation backends.

This module provides a unified interface for ML model inference,
supporting TFLite, Keras models, or a simulation mode when ML
backends are unavailable (e.g., Python 3.13 compatibility issues).
"""

import os
import random
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

import numpy as np
import cv2

logger = logging.getLogger(__name__)

# Check which ML backends are available
_TFLITE_AVAILABLE = False
_KERAS_AVAILABLE = False

try:
    import tflite_runtime.interpreter as _tflite
    _TFLITE_AVAILABLE = True
    logger.info("TFLite Runtime: available")
except ImportError:
    try:
        import tensorflow as _tf
        _tf.lite.Interpreter  # Test if it works
        _TFLITE_AVAILABLE = True
        logger.info("TensorFlow Lite: available")
    except Exception:
        logger.warning("TFLite: not available")

try:
    from tensorflow.keras.models import load_model as _test_import
    _KERAS_AVAILABLE = True
    logger.info("Keras: available")
except Exception:
    logger.warning("Keras: not available")


class ModelBackend(ABC):
    """Abstract base class for ML model backends."""

    @abstractmethod
    def predict(self, image: np.ndarray) -> Dict[str, Any]:
        """Run inference on image."""
        pass

    @abstractmethod
    def get_info(self) -> Dict[str, str]:
        """Get model metadata."""
        pass


class SimulationBackend(ModelBackend):
    """Simulation backend for testing without ML libraries.

    Returns randomized but realistic-looking classification results.
    """

    def __init__(self, threshold: float = 0.5):
        self.threshold = threshold
        self._call_count = 0
        logger.info("SimulationBackend initialized (ML disabled)")

    def predict(self, image: np.ndarray) -> Dict[str, Any]:
        """Return simulated classification result."""
        self._call_count += 1

        # Generate semi-random result (alternate for demo purposes)
        # Use image brightness as a factor for more realistic simulation
        if image is not None and len(image.shape) >= 2:
            brightness = np.mean(image) / 255.0
            # Darker images more likely to be "malignant" (just for demo)
            is_malignant = brightness < 0.4 or (self._call_count % 5 == 0)
        else:
            is_malignant = self._call_count % 3 == 0

        # Generate confidence
        if is_malignant:
            confidence = 0.65 + random.random() * 0.30  # 0.65-0.95
        else:
            confidence = 0.70 + random.random() * 0.25  # 0.70-0.95

        return {
            'is_malignant': is_malignant,
            'confidence': confidence,
            'label': 'Malignant' if is_malignant else 'Benign',
            'raw_output': [[1 - confidence, confidence] if is_malignant else [confidence, 1 - confidence]],
            'simulated': True
        }

    def get_info(self) -> Dict[str, str]:
        return {
            'name': 'SimulationBackend',
            'version': '1.0',
            'architecture': 'Simulation (ML disabled)',
            'backend': 'simulation'
        }


class TFLiteBackend(ModelBackend):
    """TFLite model backend - optimized for fast inference (~100ms on RPi)."""

    def __init__(self, model_path: str, threshold: float = 0.5):
        if not _TFLITE_AVAILABLE:
            raise ImportError("TFLite is not available")

        self.model_path = model_path
        self.threshold = threshold

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}")

        # Try tflite_runtime first, fall back to tensorflow
        try:
            import tflite_runtime.interpreter as tflite
            self.interpreter = tflite.Interpreter(model_path=model_path)
            self._backend_name = "tflite_runtime"
        except ImportError:
            import tensorflow as tf
            self.interpreter = tf.lite.Interpreter(model_path=model_path)
            self._backend_name = "tensorflow.lite"

        self.interpreter.allocate_tensors()
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()

        input_shape = self.input_details[0]['shape']
        self.input_height = input_shape[1]
        self.input_width = input_shape[2]
        self.input_size = (self.input_width, self.input_height)

        logger.info(f"TFLite model loaded: {model_path}")

    def predict(self, image: np.ndarray) -> Dict[str, Any]:
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)

        resized = cv2.resize(image, self.input_size)
        normalized = resized.astype(np.float32) / 255.0
        batched = np.expand_dims(normalized, axis=0)

        self.interpreter.set_tensor(self.input_details[0]['index'], batched)
        self.interpreter.invoke()
        output = self.interpreter.get_tensor(self.output_details[0]['index'])

        if output.shape[-1] == 1:
            confidence = float(output[0][0])
            is_malignant = confidence > self.threshold
        else:
            is_malignant = np.argmax(output[0]) == 1
            confidence = float(output[0][1]) if is_malignant else float(output[0][0])

        return {
            'is_malignant': is_malignant,
            'confidence': confidence,
            'label': 'Malignant' if is_malignant else 'Benign',
            'raw_output': output.tolist()
        }

    def get_info(self) -> Dict[str, str]:
        return {
            'name': 'TumorDetector-TFLite',
            'version': '1.0',
            'architecture': 'CNN',
            'backend': 'tflite'
        }


class KerasBackend(ModelBackend):
    """Keras model backend - higher accuracy but slower."""

    def __init__(self, model_path: str, threshold: float = 0.5):
        if not _KERAS_AVAILABLE:
            raise ImportError("Keras is not available")

        self.model_path = model_path
        self.threshold = threshold

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}")

        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
        from tensorflow.keras.models import load_model
        self.model = load_model(model_path)

        input_shape = self.model.input_shape
        self.input_height = input_shape[1]
        self.input_width = input_shape[2]
        self.input_size = (self.input_width, self.input_height)

        model_name = os.path.basename(model_path)
        if 'densenet' in model_name.lower():
            self._architecture = 'DenseNet-121'
        elif 'resnet' in model_name.lower():
            self._architecture = 'ResNet-50'
        else:
            self._architecture = 'CNN'

        logger.info(f"Keras model loaded: {model_path}")

    def predict(self, image: np.ndarray) -> Dict[str, Any]:
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)

        resized = cv2.resize(image, self.input_size)
        normalized = resized.astype(np.float32) / 255.0
        batched = np.expand_dims(normalized, axis=0)

        output = self.model.predict(batched, verbose=0)

        if output.shape[-1] == 1:
            confidence = float(output[0][0])
            is_malignant = confidence > self.threshold
        else:
            is_malignant = np.argmax(output[0]) == 1
            confidence = float(output[0][1]) if is_malignant else float(output[0][0])

        return {
            'is_malignant': is_malignant,
            'confidence': confidence,
            'label': 'Malignant' if is_malignant else 'Benign',
            'raw_output': output.tolist()
        }

    def get_info(self) -> Dict[str, str]:
        return {
            'name': f'SkinLesionClassifier-{self._architecture}',
            'version': '1.0',
            'architecture': self._architecture,
            'backend': 'keras'
        }


class ModelFactory:
    """Factory for managing and creating model backends."""

    DEFAULT_TFLITE_PATH = '/home/pi/Downloads/robotic-arm/models/tumor_detection_model.tflite'
    DEFAULT_KERAS_PATH = '/home/pi/Downloads/robotic-arm/full-app-code/densenet121_skin_lesion.keras'

    def __init__(
        self,
        tflite_path: Optional[str] = None,
        keras_path: Optional[str] = None,
        default_type: str = 'tflite',
        threshold: float = 0.5
    ):
        self.tflite_path = tflite_path or self.DEFAULT_TFLITE_PATH
        self.keras_path = keras_path or self.DEFAULT_KERAS_PATH
        self.default_type = default_type
        self.threshold = threshold
        self._models: Dict[str, ModelBackend] = {}

        # Check what's available and adjust default
        if not _TFLITE_AVAILABLE and not _KERAS_AVAILABLE:
            logger.warning("No ML backend available - using simulation mode")
            self.default_type = 'simulation'
        elif default_type == 'tflite' and not _TFLITE_AVAILABLE:
            logger.warning("TFLite not available, falling back to simulation")
            self.default_type = 'simulation'
        elif default_type == 'keras' and not _KERAS_AVAILABLE:
            logger.warning("Keras not available, falling back to simulation")
            self.default_type = 'simulation'

        logger.info(f"ModelFactory initialized (default: {self.default_type})")

    def get_model(self, model_type: Optional[str] = None) -> ModelBackend:
        model_type = model_type or self.default_type

        if model_type not in self._models:
            self._load_model(model_type)

        return self._models[model_type]

    def _load_model(self, model_type: str) -> None:
        if model_type == 'simulation':
            self._models['simulation'] = SimulationBackend(threshold=self.threshold)
        elif model_type == 'tflite':
            if not _TFLITE_AVAILABLE:
                logger.warning("TFLite unavailable, using simulation")
                self._models['tflite'] = SimulationBackend(threshold=self.threshold)
            else:
                self._models['tflite'] = TFLiteBackend(self.tflite_path, threshold=self.threshold)
        elif model_type == 'keras':
            if not _KERAS_AVAILABLE:
                logger.warning("Keras unavailable, using simulation")
                self._models['keras'] = SimulationBackend(threshold=self.threshold)
            else:
                self._models['keras'] = KerasBackend(self.keras_path, threshold=self.threshold)
        else:
            raise ValueError(f"Unknown model type: {model_type}")

    def list_models(self) -> List[Dict[str, Any]]:
        return [
            {
                'type': 'tflite',
                'path': self.tflite_path,
                'available': _TFLITE_AVAILABLE,
                'loaded': 'tflite' in self._models,
            },
            {
                'type': 'keras',
                'path': self.keras_path,
                'available': _KERAS_AVAILABLE,
                'loaded': 'keras' in self._models,
            },
            {
                'type': 'simulation',
                'path': None,
                'available': True,
                'loaded': 'simulation' in self._models,
            },
        ]

    def preload(self, model_type: Optional[str] = None) -> None:
        self.get_model(model_type)
        logger.info(f"Model preloaded: {model_type or self.default_type}")
