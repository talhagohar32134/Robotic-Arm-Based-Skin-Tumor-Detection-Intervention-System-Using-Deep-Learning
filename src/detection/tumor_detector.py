"""TFLite tumor detection module.

This module provides TumorDetector class for direct TFLite inference.
For a more flexible approach with simulation fallback, use ModelFactory instead.
"""

import numpy as np

# Check if ML backends are available (don't raise error at import)
_TFLITE_AVAILABLE = False
_tflite = None
_tf = None

try:
    import tflite_runtime.interpreter as _tflite
    _TFLITE_AVAILABLE = True
except ImportError:
    try:
        import tensorflow as _tf
        _tflite = _tf.lite
        _TFLITE_AVAILABLE = True
    except ImportError:
        pass  # ML not available, will use simulation via ModelFactory


class TumorDetector:
    """Tumor detection using TFLite model.

    Note: For systems without TensorFlow/TFLite, use ModelFactory with
    SimulationBackend instead.
    """

    def __init__(self, model_path, confidence_threshold=0.1):
        """Initialize TFLite interpreter.

        Args:
            model_path: Path to .tflite model file
            confidence_threshold: Minimum confidence for malignant classification

        Raises:
            ImportError: If TFLite/TensorFlow is not available
        """
        if not _TFLITE_AVAILABLE:
            raise ImportError(
                "TFLite is not available. Use ModelFactory with SimulationBackend instead."
            )

        self.model_path = model_path
        self.threshold = confidence_threshold

        # Load model
        if _tflite is not None:
            self.interpreter = _tflite.Interpreter(model_path=model_path)
        else:
            self.interpreter = _tf.lite.Interpreter(model_path=model_path)

        self.interpreter.allocate_tensors()

        # Get input/output details
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()

        # Get expected input shape
        input_shape = self.input_details[0]['shape']
        self.input_height = input_shape[1]
        self.input_width = input_shape[2]

        print(f"Model loaded: {model_path}")
        print(f"Input shape: {input_shape}")
        print(f"Expected size: {self.input_width}x{self.input_height}")
        print(f"Confidence threshold: {self.threshold}")

    def preprocess_image(self, image):
        """Preprocess image for model input.

        Args:
            image: Input image (BGR from OpenCV)

        Returns:
            Preprocessed image ready for inference
        """
        import cv2

        # Resize to model input size (typically 224x224)
        resized = cv2.resize(image, (self.input_width, self.input_height))

        # Normalize to [0, 1]
        normalized = resized.astype(np.float32) / 255.0

        # Add batch dimension
        batched = np.expand_dims(normalized, axis=0)

        return batched

    def detect(self, image):
        """Run inference on image.

        Args:
            image: Input image (BGR format from OpenCV)

        Returns:
            dict with keys:
                - 'is_malignant': bool
                - 'confidence': float (0.0 to 1.0)
                - 'label': str ('Malignant' or 'Benign')
                - 'raw_output': numpy array of model output
        """
        # Preprocess
        input_data = self.preprocess_image(image)

        # Run inference
        self.interpreter.set_tensor(self.input_details[0]['index'], input_data)
        self.interpreter.invoke()
        output = self.interpreter.get_tensor(self.output_details[0]['index'])

        # Post-process (binary classification)
        # Output is typically [batch, 1] for sigmoid or [batch, 2] for softmax
        if output.shape[-1] == 1:
            # Sigmoid output (0-1, directly interpretable)
            confidence = float(output[0][0])
            is_malignant = confidence > self.threshold
        else:
            # Softmax output ([benign_prob, malignant_prob])
            prediction = np.argmax(output)
            confidence = float(output[0][prediction])
            is_malignant = prediction == 1  # Assume class 1 is malignant

        label = "Malignant" if is_malignant else "Benign"

        return {
            'is_malignant': is_malignant,
            'confidence': confidence,
            'label': label,
            'raw_output': output,
        }
