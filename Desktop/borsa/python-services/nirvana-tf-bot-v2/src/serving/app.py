"""
Nirvana TF Bot v2 - FastAPI Serving Application
Production-ready REST API for trading signals with real TensorFlow inference
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import time
from datetime import datetime
import asyncio

# Initialize logging
from ..utils.logging import setup_logging, get_logger
from ..utils.settings import settings

# Import inference engine and data fetching
from ..models.inference import get_inference_engine
from ..data.binance_rest import get_rest_client

setup_logging(settings.log_level, settings.log_format)
logger = get_logger(__name__)

# FastAPI app
app = FastAPI(
    title="Nirvana TF Bot v2 API",
    description="Advanced TensorFlow trading signals for crypto",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple metrics
metrics = {
    "requests": 0,
    "cache_hits": 0,
    "last_model_update": datetime.utcnow().isoformat() + "Z",
    "start_time": time.time(),
}


@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("🚀 Nirvana TF Bot v2 API starting...")
    logger.info(f"   Model threshold: {settings.thresh_buy}")
    logger.info(f"   Min indicator confidence: {settings.min_indicator_conf}")
    logger.info(f"   Sequence length: {settings.seq_len}")

    # Initialize inference engine
    engine = get_inference_engine()
    if engine.model is not None:
        logger.info("✅ TensorFlow model loaded and ready")
    else:
        logger.warning("⚠️ TensorFlow model not found - using mock predictions")


@app.get("/healthz")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model": "NirvanaModel",
        "version": "2.0.0",
        "tensorflow_version": "2.15+",
        "uptime_seconds": time.time() - metrics["start_time"],
    }


@app.get("/signal")
async def get_signal(
    symbol: str = Query(..., description="Trading pair (e.g., BTCUSDT)"),
    timeframe: str = Query("1h", description="Timeframe (15m, 1h, 4h, 1d)"),
    uncertainty: bool = Query(False, description="Calculate prediction uncertainty"),
):
    """
    Generate trading signal for a symbol using TensorFlow model

    Args:
        symbol: Trading pair (e.g., BTCUSDT)
        timeframe: Time interval (15m, 1h, 4h, 1d)
        uncertainty: Whether to calculate prediction uncertainty (slower)

    Returns:
        Trading signal with probability and decision
    """
    try:
        metrics["requests"] += 1
        start_time = time.time()

        logger.info(f"Signal request: {symbol} ({timeframe})")

        # Fetch historical candles
        client = get_rest_client()

        # Need at least seq_len candles + some extra for indicators
        limit = settings.seq_len + 100

        try:
            df = await client.get_klines(symbol, timeframe, limit)

            if len(df) < settings.seq_len:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient data: got {len(df)} candles, need {settings.seq_len}"
                )

            # Convert to list of dicts
            candles = df.to_dict('records')

            # Get inference engine
            engine = get_inference_engine()

            # Generate prediction
            prediction = engine.predict(candles, calculate_uncertainty=uncertainty)

            # Calculate latency
            latency_ms = (time.time() - start_time) * 1000

            logger.info(
                f"  {symbol}: {prediction['decision']} "
                f"(prob: {prediction['probability']:.1%}, "
                f"conf: {prediction['confidence']:.1%}, "
                f"latency: {latency_ms:.1f}ms)"
            )

            return {
                "symbol": symbol,
                "timeframe": timeframe,
                "decision": prediction['decision'],
                "prob_buy": prediction['probability'],
                "confidence": prediction['confidence'],
                "uncertainty": prediction.get('uncertainty'),
                "explain": {
                    "reasoning": prediction['reasoning'],
                    "threshold": settings.thresh_buy,
                    "min_indicator_votes": settings.min_indicator_conf,
                    "model": prediction['model'],
                },
                "latency_ms": round(latency_ms, 2),
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to fetch data for {symbol}: {e}")
            raise HTTPException(status_code=500, detail=f"Data fetch error: {str(e)}")

    except Exception as e:
        logger.error(f"Error generating signal: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/metrics")
async def get_metrics():
    """System metrics endpoint"""
    return {
        "requests": metrics["requests"],
        "cache_hits": metrics["cache_hits"],
        "cache_hit_rate": (
            metrics["cache_hits"] / metrics["requests"]
            if metrics["requests"] > 0
            else 0
        ),
        "last_model_update": metrics["last_model_update"],
        "uptime_seconds": time.time() - metrics["start_time"],
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Nirvana TF Bot v2 API",
        "version": "2.0.0",
        "status": "operational",
        "endpoints": {
            "health": "/healthz",
            "signal": "/signal?symbol=BTCUSDT&timeframe=15m",
            "metrics": "/metrics",
            "docs": "/docs",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)