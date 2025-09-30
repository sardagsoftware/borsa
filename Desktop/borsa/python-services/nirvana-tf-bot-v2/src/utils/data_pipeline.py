"""
Nirvana TF Bot v2 - TensorFlow Data Pipeline
tf.data windowing, batching, prefetching
"""

import tensorflow as tf
import numpy as np
from typing import Tuple, Optional
from ..utils.logging import get_logger
from ..utils.settings import settings

logger = get_logger(__name__)


def windowed_dataset(
    features: np.ndarray,
    labels: np.ndarray,
    window_size: int = 128,
    stride: int = 8,
    batch_size: int = 64,
    shuffle: bool = True,
    shuffle_buffer: int = 10000
) -> tf.data.Dataset:
    """
    Create windowed tf.data.Dataset

    Args:
        features: Feature array (n_samples, n_features)
        labels: Labels (n_samples,)
        window_size: Sequence length
        stride: Stride between windows
        batch_size: Batch size
        shuffle: Whether to shuffle
        shuffle_buffer: Shuffle buffer size

    Returns:
        tf.data.Dataset
    """
    logger.info(f"Creating windowed dataset: window={window_size}, stride={stride}, batch={batch_size}")

    # Create sequences
    n_samples = len(features)
    n_features = features.shape[1]

    sequences = []
    sequence_labels = []

    for i in range(0, n_samples - window_size + 1, stride):
        sequences.append(features[i:i + window_size])
        sequence_labels.append(labels[i + window_size - 1])  # Label at last timestep

    X = np.array(sequences, dtype=np.float32)
    y = np.array(sequence_labels, dtype=np.float32)

    logger.info(f"Created {len(X)} sequences")

    # Build tf.data.Dataset
    dataset = tf.data.Dataset.from_tensor_slices((X, y))

    if shuffle:
        dataset = dataset.shuffle(buffer_size=shuffle_buffer, reshuffle_each_iteration=True)

    dataset = dataset.batch(batch_size)
    dataset = dataset.prefetch(buffer_size=tf.data.AUTOTUNE)

    return dataset


def split_dataset(
    features: np.ndarray,
    labels: np.ndarray,
    train_split: float = 0.7,
    val_split: float = 0.15,
    test_split: float = 0.15
) -> Tuple[Tuple[np.ndarray, np.ndarray], Tuple[np.ndarray, np.ndarray], Tuple[np.ndarray, np.ndarray]]:
    """
    Split data into train/val/test sets (temporal split, no shuffle)

    Args:
        features: Feature array
        labels: Labels
        train_split: Train split ratio
        val_split: Validation split ratio
        test_split: Test split ratio

    Returns:
        ((X_train, y_train), (X_val, y_val), (X_test, y_test))
    """
    assert abs(train_split + val_split + test_split - 1.0) < 1e-6, "Splits must sum to 1"

    n = len(features)
    train_idx = int(n * train_split)
    val_idx = int(n * (train_split + val_split))

    X_train = features[:train_idx]
    y_train = labels[:train_idx]

    X_val = features[train_idx:val_idx]
    y_val = labels[train_idx:val_idx]

    X_test = features[val_idx:]
    y_test = labels[val_idx:]

    logger.info(f"Split: train={len(X_train)}, val={len(X_val)}, test={len(X_test)}")

    return (X_train, y_train), (X_val, y_val), (X_test, y_test)


def normalize_features(
    X_train: np.ndarray,
    X_val: np.ndarray,
    X_test: np.ndarray
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Normalize features using robust scaling (fit on train, transform all)

    Args:
        X_train: Training features
        X_val: Validation features
        X_test: Test features

    Returns:
        (X_train_scaled, X_val_scaled, X_test_scaled, median, scale)
    """
    # Calculate median and IQR on training data
    median = np.median(X_train, axis=0)
    q75 = np.percentile(X_train, 75, axis=0)
    q25 = np.percentile(X_train, 25, axis=0)
    iqr = q75 - q25

    # Avoid division by zero
    scale = np.where(iqr > 0, iqr, 1.0)

    # Transform all splits
    X_train_scaled = (X_train - median) / scale
    X_val_scaled = (X_val - median) / scale
    X_test_scaled = (X_test - median) / scale

    logger.info("Features normalized using robust scaling")

    return X_train_scaled, X_val_scaled, X_test_scaled, median, scale