"""HTTP handler for ML classification API.

This module implements the HTTP endpoints for tumor classification,
matching the frontend's classificationService.ts expectations.

Endpoints:
- POST /classify - Run ML inference on image
- GET /health - Service health check
- GET /model-info - Model metadata
"""

import base64
import time
import logging
from io import BytesIO
from typing import Optional, Dict, Any

from aiohttp import web
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


class ClassificationHandler:
    """Handles HTTP requests for tumor classification."""

    def __init__(self, model_factory, camera=None):
        """Initialize classification handler.

        Args:
            model_factory: ModelFactory instance for inference
            camera: Camera instance for live capture (optional)
        """
        self.model_factory = model_factory
        self.camera = camera

    async def classify(self, request: web.Request) -> web.Response:
        """Handle classification request.

        Expects JSON body:
        {
            "image": "base64_encoded_image" or "capture",
            "model_type": "tflite" or "keras" (optional)
        }

        Returns JSON:
        {
            "label": "Benign" or "Malignant",
            "confidence": 0-100,
            "probabilities": {"benign": float, "malignant": float},
            "features": {"asymmetry": int, "border": int, "color": int, "diameter": int},
            "inference_time": milliseconds,
            "modelInfo": {"name": str, "version": str, "architecture": str}
        }
        """
        start_time = time.time()

        try:
            data = await request.json()
            image_data = data.get('image')
            model_type = data.get('model_type')

            # Get model
            model = self.model_factory.get_model(model_type)

            # Get image
            if image_data and image_data != 'capture':
                # Decode base64 image
                if image_data.startswith('data:image'):
                    # Strip data URL prefix
                    image_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(image_data)
                pil_image = Image.open(BytesIO(image_bytes)).convert('RGB')
                image = np.array(pil_image)
            elif self.camera:
                # Capture from camera
                try:
                    frame = self.camera.read_frame()
                    # OpenCV returns BGR, convert to RGB
                    image = frame[:, :, ::-1]
                except Exception as e:
                    logger.error(f"Camera capture error: {e}")
                    return web.json_response({
                        'error': 'Camera capture failed',
                        'details': str(e)
                    }, status=500)
            else:
                # No image and no camera
                return web.json_response({
                    'error': 'No image provided and camera unavailable'
                }, status=400)

            # Run inference
            result = model.predict(image)
            inference_time = int((time.time() - start_time) * 1000)

            # Calculate response
            is_malignant = result['is_malignant']
            confidence = result['confidence']

            # Calculate probabilities
            if is_malignant:
                prob_malignant = confidence * 100
                prob_benign = (1 - confidence) * 100
            else:
                prob_benign = confidence * 100
                prob_malignant = (1 - confidence) * 100

            # Generate ABCD features (simplified - based on classification)
            # In a real system, these would be computed from image analysis
            if is_malignant:
                features = {
                    'asymmetry': min(95, int(60 + confidence * 35)),
                    'border': min(95, int(55 + confidence * 40)),
                    'color': min(95, int(50 + confidence * 45)),
                    'diameter': min(95, int(45 + confidence * 50)),
                }
            else:
                features = {
                    'asymmetry': max(5, int(35 - confidence * 30)),
                    'border': max(5, int(40 - confidence * 35)),
                    'color': max(5, int(45 - confidence * 40)),
                    'diameter': max(5, int(30 - confidence * 25)),
                }

            # Get model info
            model_info = model.get_info()

            return web.json_response({
                'label': result['label'],
                'confidence': round(max(prob_benign, prob_malignant), 1),
                'probabilities': {
                    'benign': round(prob_benign, 1),
                    'malignant': round(prob_malignant, 1)
                },
                'features': features,
                'inference_time': inference_time,
                'modelInfo': model_info
            })

        except Exception as e:
            logger.exception("Classification error")
            return web.json_response({
                'error': 'Classification failed',
                'details': str(e)
            }, status=500)

    async def health(self, request: web.Request) -> web.Response:
        """Health check endpoint.

        Returns JSON: {"status": "ok"}
        """
        return web.json_response({'status': 'ok'})

    async def model_info(self, request: web.Request) -> web.Response:
        """Get information about available models.

        Returns JSON with list of available models and their status.
        """
        try:
            models = self.model_factory.list_models()
            default_model = self.model_factory.get_model()
            default_info = default_model.get_info()

            return web.json_response({
                'available_models': models,
                'default': {
                    'type': self.model_factory.default_type,
                    'info': default_info
                }
            })
        except Exception as e:
            logger.exception("Model info error")
            return web.json_response({
                'error': 'Failed to get model info',
                'details': str(e)
            }, status=500)


class ServoControlHandler:
    """Direct HTTP control of servos - for testing."""

    def __init__(self, arm_controller):
        self.arm = arm_controller

    async def move_servo(self, request: web.Request) -> web.Response:
        """Move a servo directly via HTTP GET.

        Usage: GET /servo?servo=base&angle=90
        """
        try:
            servo = request.query.get('servo', 'base')
            angle = float(request.query.get('angle', 90))

            if not self.arm:
                return web.json_response({'error': 'Arm not initialized'}, status=500)

            if servo not in ['base', 'shoulder', 'wrist']:
                return web.json_response({'error': f'Invalid servo: {servo}'}, status=400)

            if not (0 <= angle <= 180):
                return web.json_response({'error': f'Angle must be 0-180'}, status=400)

            logger.info(f"HTTP servo control: {servo} -> {angle}°")
            self.arm.set_servo_angle(servo, angle)

            return web.json_response({
                'success': True,
                'servo': servo,
                'angle': angle
            })

        except Exception as e:
            logger.exception("Servo control error")
            return web.json_response({'error': str(e)}, status=500)

    async def home_servos(self, request: web.Request) -> web.Response:
        """Return all servos to home position.

        Usage: GET /servo/home
        """
        try:
            if not self.arm:
                return web.json_response({'error': 'Arm not initialized'}, status=500)

            logger.info("HTTP: Returning servos to home")
            self.arm.set_servo_angle('base', 90)
            self.arm.set_servo_angle('shoulder', 90)
            self.arm.set_servo_angle('wrist', 90)

            return web.json_response({'success': True, 'position': 'home'})

        except Exception as e:
            logger.exception("Home servos error")
            return web.json_response({'error': str(e)}, status=500)


def create_cors_middleware():
    """Create CORS middleware for cross-origin requests.

    Returns:
        aiohttp middleware function
    """
    @web.middleware
    async def cors_middleware(request: web.Request, handler):
        # Handle preflight
        if request.method == 'OPTIONS':
            response = web.Response()
        else:
            try:
                response = await handler(request)
            except web.HTTPException as ex:
                response = ex

        # Add CORS headers
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Max-Age'] = '86400'

        return response

    return cors_middleware
