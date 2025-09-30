"""
Nirvana TF Bot v2 - Model Inference Engine
Load trained model and generate predictions
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional, Dict, List
import json

from tensorflow import keras

from ..features.indicators import build_features
from ..models.keras_model import predict_with_uncertainty
from ..utils.logging import get_logger
from ..utils.settings import settings

logger = get_logger(__name__)


class NirvanaInferenceEngine:
    """
    Inference engine for trained Nirvana TF model
    """

    def __init__(self, model_dir: Optional[str] = None):
        """
        Initialize inference engine

        Args:
            model_dir: Path to model directory (default: from settings)
        """
        self.model_dir = Path(model_dir or settings.model_dir)
        self.model: Optional[keras.Model] = None
        self.metadata: Optional[Dict] = None
        self.norm_median: Optional[np.ndarray] = None
        self.norm_scale: Optional[np.ndarray] = None

        self._load_model()

    def _load_model(self):
        """Load model and normalization parameters"""
        model_path = self.model_dir / 'saved_model.keras'

        if not model_path.exists():
            logger.warning(f"Model not found at {model_path}. Using mock predictions.")
            return

        try:
            # Load model
            self.model = keras.models.load_model(model_path)
            logger.info(f"Model loaded from {model_path}")

            # Load metadata
            metadata_path = self.model_dir / 'metadata.json'
            if metadata_path.exists():
                with open(metadata_path) as f:
                    self.metadata = json.load(f)
                logger.info(f"Metadata loaded: {self.metadata.get('trained_at', 'unknown')}")

            # Load normalization params
            median_path = self.model_dir / 'norm_median.npy'
            scale_path = self.model_dir / 'norm_scale.npy'

            if median_path.exists() and scale_path.exists():
                self.norm_median = np.load(median_path)
                self.norm_scale = np.load(scale_path)
                logger.info("Normalization parameters loaded")
            else:
                logger.warning("Normalization parameters not found")

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.model = None

    def predict(
        self,
        candles: List[Dict],
        calculate_uncertainty: bool = False
    ) -> Dict:
        """
        Generate trading signal from candle data

        Args:
            candles: List of OHLCV candles (at least seq_len candles)
            calculate_uncertainty: Whether to calculate prediction uncertainty

        Returns:
            Signal dict with decision, confidence, probability, reasoning
        """
        if self.model is None:
            return self._mock_prediction(candles)

        try:
            # Convert to DataFrame
            df = pd.DataFrame(candles)

            # Build features
            df_features = build_features(df)

            # Get last seq_len rows
            if len(df_features) < settings.seq_len:
                raise ValueError(f"Need at least {settings.seq_len} candles, got {len(df_features)}")

            df_seq = df_features.tail(settings.seq_len)

            # Drop non-feature columns
            exclude_cols = ['timestamp', 'symbol', 'label']
            feature_cols = [col for col in df_seq.columns if col not in exclude_cols]
            features = df_seq[feature_cols].values.astype(np.float32)

            # Normalize
            if self.norm_median is not None and self.norm_scale is not None:
                features = (features - self.norm_median) / self.norm_scale

            # Reshape for model input: (1, seq_len, n_features)
            X = features.reshape(1, settings.seq_len, -1)

            # Predict
            if calculate_uncertainty:
                prob, uncertainty = predict_with_uncertainty(self.model, X, n_iterations=10)
            else:
                prob = float(self.model.predict(X, verbose=0)[0][0])
                uncertainty = None

            # Calculate decision
            decision, confidence, reasoning = self._calculate_decision(
                prob, df_seq, uncertainty
            )

            return {
                'decision': decision,
                'confidence': confidence,
                'probability': prob,
                'uncertainty': uncertainty,
                'model': 'NirvanaTF',
                'reasoning': reasoning,
            }

        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return self._mock_prediction(candles)

    def _calculate_decision(
        self,
        prob: float,
        df_seq: pd.DataFrame,
        uncertainty: Optional[float] = None
    ) -> tuple:
        """
        Calculate final decision with indicator confirmation

        Args:
            prob: Model probability
            df_seq: DataFrame with features
            uncertainty: Prediction uncertainty (optional)

        Returns:
            (decision, confidence, reasoning)
        """
        reasoning = []
        indicator_votes = 0

        # Get latest indicators
        latest = df_seq.iloc[-1]

        # RSI confirmation
        rsi = latest.get('rsi', 50)
        if rsi < 30:
            reasoning.append(f"RSI oversold ({rsi:.1f} < 30)")
            indicator_votes += 1
        elif rsi < 40:
            reasoning.append(f"RSI low ({rsi:.1f} < 40)")
            indicator_votes += 0.5

        # MACD histogram confirmation
        macd_hist = latest.get('macd_histogram', 0)
        if macd_hist > 0:
            reasoning.append(f"MACD histogram positive ({macd_hist:.2f})")
            indicator_votes += 1

        # Bollinger Band position
        bb_pos = latest.get('bb_position', 0.5)
        if bb_pos < 0.2:
            reasoning.append(f"Price near lower BB ({bb_pos:.2%})")
            indicator_votes += 1

        # EMA cross
        ema_9 = latest.get('ema_9', 0)
        ema_26 = latest.get('ema_26', 0)
        if ema_9 > ema_26:
            reasoning.append("EMA 9/26 bullish cross")
            indicator_votes += 0.5

        # Adjust confidence based on uncertainty
        confidence = prob
        if uncertainty is not None and uncertainty > 0.15:
            reasoning.append(f"High prediction uncertainty ({uncertainty:.2%})")
            confidence *= 0.85  # Reduce confidence

        # Final decision
        if prob > settings.thresh_buy and indicator_votes >= settings.min_indicator_conf:
            decision = 'BUY'
            reasoning.insert(0, f"Model confidence: {prob:.1%} (threshold: {settings.thresh_buy:.1%})")
            reasoning.insert(1, f"Indicator votes: {indicator_votes}/{settings.min_indicator_conf}")
        elif prob > settings.thresh_buy * 0.8 and indicator_votes >= 2:
            decision = 'HOLD'
            reasoning.insert(0, f"Moderate signal (prob: {prob:.1%}, votes: {indicator_votes})")
        else:
            decision = 'PASS'
            reasoning.insert(0, f"Weak signal (prob: {prob:.1%}, votes: {indicator_votes})")

        return decision, float(confidence), reasoning

    def _mock_prediction(self, candles: List[Dict]) -> Dict:
        """Mock prediction when model not loaded"""
        return {
            'decision': 'PASS',
            'confidence': 0.0,
            'probability': 0.0,
            'uncertainty': None,
            'model': 'Mock',
            'reasoning': ['Model not loaded - using mock prediction'],
        }


# Global inference engine
_engine: Optional[NirvanaInferenceEngine] = None


def get_inference_engine() -> NirvanaInferenceEngine:
    """Get or create inference engine singleton"""
    global _engine
    if _engine is None:
        _engine = NirvanaInferenceEngine()
    return _engine