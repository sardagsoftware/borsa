"""
Nirvana TF Bot v2 - TensorFlow Keras Model
TCN (Temporal Convolutional Network) + BiLSTM + Multi-Head Attention
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
from typing import Optional, Tuple
from ..utils.logging import get_logger

logger = get_logger(__name__)


def build_tcn_block(
    inputs: tf.Tensor,
    filters: int,
    kernel_size: int,
    dilation_rate: int,
    dropout_rate: float = 0.2
) -> tf.Tensor:
    """
    Build Temporal Convolutional Network (TCN) block

    Args:
        inputs: Input tensor
        filters: Number of filters
        kernel_size: Kernel size
        dilation_rate: Dilation rate for causal convolution
        dropout_rate: Dropout rate

    Returns:
        Output tensor
    """
    # Causal Conv1D
    conv = layers.Conv1D(
        filters=filters,
        kernel_size=kernel_size,
        dilation_rate=dilation_rate,
        padding='causal',
        activation='relu'
    )(inputs)

    conv = layers.BatchNormalization()(conv)
    conv = layers.Dropout(dropout_rate)(conv)

    # Residual connection
    if inputs.shape[-1] != filters:
        residual = layers.Conv1D(filters=filters, kernel_size=1, padding='same')(inputs)
    else:
        residual = inputs

    return layers.Add()([conv, residual])


def build_model(
    n_features: int,
    seq_len: int = 128,
    lstm_units: int = 64,
    attention_heads: int = 8,
    dropout_rate: float = 0.2
) -> keras.Model:
    """
    Build advanced TensorFlow model:
    TCN → BiLSTM → Multi-Head Attention → Dense → Sigmoid

    Args:
        n_features: Number of input features
        seq_len: Sequence length
        lstm_units: LSTM units
        attention_heads: Number of attention heads
        dropout_rate: Dropout rate

    Returns:
        Compiled Keras model
    """
    logger.info(f"Building model: seq_len={seq_len}, n_features={n_features}")

    # Input
    inputs = keras.Input(shape=(seq_len, n_features), name='input')

    # TCN blocks (Temporal Convolutional Network)
    x = build_tcn_block(inputs, filters=64, kernel_size=3, dilation_rate=1, dropout_rate=dropout_rate)
    x = build_tcn_block(x, filters=64, kernel_size=3, dilation_rate=2, dropout_rate=dropout_rate)
    x = build_tcn_block(x, filters=64, kernel_size=3, dilation_rate=4, dropout_rate=dropout_rate)

    # Bidirectional LSTM
    x = layers.Bidirectional(
        layers.LSTM(lstm_units, return_sequences=True, dropout=dropout_rate)
    )(x)

    # Multi-Head Self-Attention
    attention_output = layers.MultiHeadAttention(
        num_heads=attention_heads,
        key_dim=lstm_units // attention_heads
    )(x, x)

    # Add & Norm
    x = layers.Add()([x, attention_output])
    x = layers.LayerNormalization(epsilon=1e-6)(x)

    # Global pooling
    x = layers.GlobalAveragePooling1D()(x)

    # Dense layers
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(dropout_rate)(x)

    x = layers.Dense(64, activation='relu')(x)
    x = layers.Dropout(dropout_rate)(x)

    # Output (binary classification: BUY or not)
    outputs = layers.Dense(1, activation='sigmoid', name='output')(x)

    # Build model
    model = keras.Model(inputs=inputs, outputs=outputs, name='nirvana_tf_model')

    # Compile
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=[
            'accuracy',
            keras.metrics.AUC(name='auc'),
            keras.metrics.Precision(name='precision'),
            keras.metrics.Recall(name='recall'),
        ]
    )

    logger.info(f"Model built: {model.count_params():,} parameters")

    return model


def prepare_sequences(
    features: np.ndarray,
    labels: Optional[np.ndarray] = None,
    seq_len: int = 128
) -> Tuple[np.ndarray, Optional[np.ndarray]]:
    """
    Prepare sequences for model input

    Args:
        features: Feature array (n_samples, n_features)
        labels: Labels (n_samples,) - optional for inference
        seq_len: Sequence length

    Returns:
        (X, y) where X is (n_sequences, seq_len, n_features)
    """
    if len(features) < seq_len:
        raise ValueError(f"Not enough data: {len(features)} < {seq_len}")

    n_sequences = len(features) - seq_len + 1
    n_features = features.shape[1]

    X = np.zeros((n_sequences, seq_len, n_features), dtype=np.float32)

    for i in range(n_sequences):
        X[i] = features[i:i + seq_len]

    if labels is not None:
        # Label corresponds to the last timestep of each sequence
        y = labels[seq_len - 1:].astype(np.float32)
        return X, y

    return X, None


def predict_with_uncertainty(
    model: keras.Model,
    X: np.ndarray,
    n_iterations: int = 10
) -> Tuple[float, float]:
    """
    Monte Carlo Dropout for uncertainty estimation

    Args:
        model: Keras model
        X: Input array (1, seq_len, n_features)
        n_iterations: Number of MC iterations

    Returns:
        (mean_probability, std_probability)
    """
    predictions = []

    for _ in range(n_iterations):
        pred = model(X, training=True)  # Keep dropout active
        predictions.append(pred.numpy()[0][0])

    mean_prob = float(np.mean(predictions))
    std_prob = float(np.std(predictions))

    return mean_prob, std_prob