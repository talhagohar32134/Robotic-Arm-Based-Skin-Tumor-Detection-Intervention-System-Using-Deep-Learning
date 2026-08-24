"""Detection components for MedTwin Pro."""

from .camera import Camera
from .model_factory import ModelFactory, SimulationBackend

# TumorDetector requires TFLite - import conditionally
try:
    from .tumor_detector import TumorDetector
except ImportError:
    TumorDetector = None

# Only import ML backends if available
try:
    from .model_factory import TFLiteBackend
except ImportError:
    TFLiteBackend = None

try:
    from .model_factory import KerasBackend
except ImportError:
    KerasBackend = None

__all__ = [
    'TumorDetector',
    'Camera',
    'ModelFactory',
    'SimulationBackend',
    'TFLiteBackend',
    'KerasBackend',
]
