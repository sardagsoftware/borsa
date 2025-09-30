"""
Nirvana TF Bot - FastAPI Serving Layer
Integrates with LyDian Trader platform
Provides advanced TensorFlow predictions via REST API
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
from ..models.advanced_model import NirvanaModel, prepare_features, calculate_confidence

app = FastAPI(
    title="Nirvana TF Bot API",
    description="Advanced TensorFlow trading signals for LyDian Trader",
    version="1.0.0"
)

# CORS for Next.js integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app", "https://borsa.ailydian.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model
_model = NirvanaModel(model_path=None)  # Fresh model, will load trained model later

# Request models
class Candle(BaseModel):
    timestamp: int
    open: float
    high: float
    low: float
    close: float
    volume: float

class SignalRequest(BaseModel):
    symbol: str
    candles: List[Candle]
    indicators: Dict[str, float]
    timeframe: Optional[str] = '1h'

class BatchSignalRequest(BaseModel):
    requests: List[SignalRequest]

# Health check
@app.get('/health')
def health():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'model': 'NirvanaModel',
        'version': '1.0.0',
        'tensorflow_version': '2.15+'
    }

# Single signal generation
@app.post('/signal')
def generate_signal(request: SignalRequest):
    """
    Generate trading signal for a single symbol

    Args:
        request: SignalRequest with candles, indicators

    Returns:
        Signal with decision, confidence, reasoning
    """
    try:
        # Validate input
        if len(request.candles) < 60:
            raise HTTPException(
                status_code=400,
                detail=f"Need at least 60 candles, got {len(request.candles)}"
            )

        # Convert Pydantic models to dicts
        candles = [candle.dict() for candle in request.candles[-60:]]  # Last 60
        indicators = request.indicators

        # Generate prediction
        signal = _model.predict(candles, indicators)

        # Add metadata
        signal['symbol'] = request.symbol
        signal['timeframe'] = request.timeframe
        signal['timestamp'] = candles[-1]['timestamp']
        signal['currentPrice'] = candles[-1]['close']

        return {
            'success': True,
            'signal': signal
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Batch signal generation
@app.post('/signals/batch')
def generate_batch_signals(request: BatchSignalRequest):
    """
    Generate trading signals for multiple symbols

    Args:
        request: BatchSignalRequest with multiple SignalRequests

    Returns:
        List of signals
    """
    try:
        signals = []
        errors = []

        for req in request.requests:
            try:
                if len(req.candles) < 60:
                    errors.append({
                        'symbol': req.symbol,
                        'error': f"Need at least 60 candles, got {len(req.candles)}"
                    })
                    continue

                candles = [candle.dict() for candle in req.candles[-60:]]
                signal = _model.predict(candles, req.indicators)

                signal['symbol'] = req.symbol
                signal['timeframe'] = req.timeframe
                signal['timestamp'] = candles[-1]['timestamp']
                signal['currentPrice'] = candles[-1]['close']

                signals.append(signal)

            except Exception as e:
                errors.append({
                    'symbol': req.symbol,
                    'error': str(e)
                })

        return {
            'success': True,
            'signals': signals,
            'errors': errors if errors else None,
            'totalProcessed': len(request.requests),
            'successCount': len(signals),
            'errorCount': len(errors)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Model info
@app.get('/model/info')
def model_info():
    """Get model architecture information"""
    try:
        summary_lines = []
        _model.model.summary(print_fn=lambda x: summary_lines.append(x))

        return {
            'architecture': 'Conv1D + BiLSTM + Attention + Dense',
            'inputShape': [60, 10],
            'outputShape': [1],
            'activation': 'sigmoid',
            'optimizer': 'adam',
            'loss': 'binary_crossentropy',
            'summary': '\n'.join(summary_lines)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Model training endpoint (future enhancement)
@app.post('/model/train')
def train_model():
    """Train model with new data (placeholder)"""
    return {
        'status': 'not_implemented',
        'message': 'Training endpoint will be implemented in future releases'
    }
