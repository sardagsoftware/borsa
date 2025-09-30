"""
Advanced TensorFlow Model for Crypto Trading
Integrates with LyDian Trader platform
Uses Bidirectional LSTM + Attention + Conv1D
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
from typing import Dict, List, Tuple

class AttentionLayer(layers.Layer):
    """Custom attention layer for time-series"""

    def __init__(self, units=32, **kwargs):
        super(AttentionLayer, self).__init__(**kwargs)
        self.units = units
        self.W = layers.Dense(units)
        self.V = layers.Dense(1)

    def call(self, values):
        # values shape: (batch_size, seq_len, features)
        score = self.V(tf.nn.tanh(self.W(values)))
        attention_weights = tf.nn.softmax(score, axis=1)
        context_vector = attention_weights * values
        context_vector = tf.reduce_sum(context_vector, axis=1)
        return context_vector, attention_weights

def build_advanced_model(
    seq_len: int = 60,
    n_features: int = 10,
    lstm_units: int = 64,
    dense_units: int = 32,
    dropout_rate: float = 0.2
) -> keras.Model:
    """
    Build advanced model with:
    - Conv1D for local pattern detection
    - Bidirectional LSTM for temporal dependencies
    - Attention mechanism for important timesteps
    - Dense layers for classification

    Args:
        seq_len: Sequence length (default: 60 candles)
        n_features: Number of features (OHLCV + indicators)
        lstm_units: LSTM hidden units
        dense_units: Dense layer units
        dropout_rate: Dropout rate for regularization

    Returns:
        Compiled Keras model
    """

    inputs = keras.Input(shape=(seq_len, n_features), name='market_data')

    # Conv1D for local pattern detection
    x = layers.Conv1D(64, 3, activation='relu', padding='same')(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Conv1D(32, 3, activation='relu', padding='same')(x)
    x = layers.BatchNormalization()(x)

    # Bidirectional LSTM
    x = layers.Bidirectional(layers.LSTM(lstm_units, return_sequences=True))(x)
    x = layers.Dropout(dropout_rate)(x)

    # Attention mechanism
    attention_layer = AttentionLayer(units=32)
    context_vector, attention_weights = attention_layer(x)

    # Dense layers
    x = layers.Dense(dense_units, activation='relu')(context_vector)
    x = layers.Dropout(dropout_rate)(x)
    x = layers.Dense(16, activation='relu')(x)

    # Output: probability of BUY signal
    outputs = layers.Dense(1, activation='sigmoid', name='buy_probability')(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name='nirvana_tf_model')

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy', keras.metrics.AUC(name='auc')]
    )

    return model

def prepare_features(
    candles: List[Dict],
    indicators: Dict
) -> np.ndarray:
    """
    Prepare features from market data

    Args:
        candles: List of OHLCV candles (last 60)
        indicators: Dict with RSI, MACD, etc.

    Returns:
        Feature array (1, seq_len, n_features)
    """

    features = []

    for i, candle in enumerate(candles):
        # Normalize prices (0-1)
        prices = [c['close'] for c in candles]
        min_price = min(prices)
        max_price = max(prices)
        price_range = max_price - min_price + 1e-8

        candle_features = [
            (candle['open'] - min_price) / price_range,
            (candle['high'] - min_price) / price_range,
            (candle['low'] - min_price) / price_range,
            (candle['close'] - min_price) / price_range,
            candle['volume'] / max([c['volume'] for c in candles] + [1]),

            # Price changes
            (candle['close'] - candle['open']) / (candle['open'] + 1e-8),
            (candle['high'] - candle['low']) / (candle['low'] + 1e-8),

            # Indicators (normalized)
            indicators.get('rsi', 50) / 100,
            indicators.get('macd_histogram', 0) / 100,
            indicators.get('volume_ratio', 1),
        ]

        features.append(candle_features)

    # Return as numpy array (1, seq_len, n_features)
    return np.array([features], dtype=np.float32)

def calculate_confidence(
    probability: float,
    indicators: Dict
) -> Tuple[str, float, Dict]:
    """
    Calculate final decision with confidence

    Args:
        probability: Model output (0-1)
        indicators: Technical indicators

    Returns:
        (decision, confidence, reasoning)
    """

    reasoning = []
    confidence_adjustments = []

    # Base confidence from model
    base_confidence = probability

    # Adjust based on indicators
    rsi = indicators.get('rsi', 50)
    if rsi < 30:
        reasoning.append("RSI aşırı satış (<30) - güçlü alım sinyali")
        confidence_adjustments.append(0.1)
    elif rsi > 70:
        reasoning.append("RSI aşırı alım (>70) - dikkatli ol")
        confidence_adjustments.append(-0.15)

    macd_histogram = indicators.get('macd_histogram', 0)
    if macd_histogram > 0:
        reasoning.append("MACD histogram pozitif - yükseliş trendi")
        confidence_adjustments.append(0.05)

    # Volume confirmation
    volume_ratio = indicators.get('volume_ratio', 1)
    if volume_ratio > 1.5:
        reasoning.append("Yüksek işlem hacmi - güçlü sinyal")
        confidence_adjustments.append(0.08)

    # Final confidence
    final_confidence = base_confidence + sum(confidence_adjustments)
    final_confidence = max(0.0, min(1.0, final_confidence))

    # Decision threshold
    if final_confidence > 0.7:
        decision = 'BUY'
        reasoning.append(f"TensorFlow model güven: {base_confidence:.2%}")
    elif final_confidence > 0.5:
        decision = 'HOLD'
        reasoning.append("Orta seviye sinyal - bekle")
    else:
        decision = 'PASS'
        reasoning.append("Zayıf sinyal - işlem yapma")

    return decision, final_confidence, {
        'reasoning': reasoning,
        'base_probability': base_confidence,
        'adjusted_confidence': final_confidence,
        'indicator_adjustments': sum(confidence_adjustments)
    }

class NirvanaModel:
    """Wrapper class for Nirvana TF model"""

    def __init__(self, model_path: str = None):
        self.model = build_advanced_model()
        if model_path:
            try:
                self.model = keras.models.load_model(model_path, custom_objects={'AttentionLayer': AttentionLayer})
                print(f"✅ Model loaded from {model_path}")
            except Exception as e:
                print(f"⚠️ Could not load model: {e}. Using fresh model.")
        else:
            print("✅ Fresh advanced model initialized")

    def predict(
        self,
        candles: List[Dict],
        indicators: Dict
    ) -> Dict:
        """
        Generate trading signal

        Args:
            candles: List of OHLCV candles
            indicators: Technical indicators

        Returns:
            Signal dict with decision, confidence, reasoning
        """

        # Prepare features
        X = prepare_features(candles, indicators)

        # Model prediction
        probability = float(self.model.predict(X, verbose=0)[0][0])

        # Calculate final decision
        decision, confidence, details = calculate_confidence(probability, indicators)

        return {
            'decision': decision,
            'confidence': confidence,
            'probability': probability,
            'model': 'NirvanaTF',
            **details
        }

    def save(self, path: str):
        """Save model to disk"""
        self.model.save(path)
        print(f"✅ Model saved to {path}")

    def summary(self):
        """Print model architecture"""
        return self.model.summary()