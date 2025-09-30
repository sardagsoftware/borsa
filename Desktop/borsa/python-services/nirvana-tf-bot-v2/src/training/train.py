"""
Nirvana TF Bot v2 - Training Pipeline
CLI for model training with data fetching, preprocessing, training, and checkpointing
"""

import argparse
import asyncio
from pathlib import Path
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

from tensorflow import keras

from ..data.binance_rest import get_rest_client
from ..data.symbols import get_symbols_top100
from ..features.indicators import build_features, label_long
from ..models.keras_model import build_model
from ..utils.data_pipeline import split_dataset, windowed_dataset, normalize_features
from ..utils.io import save_to_parquet, load_from_parquet
from ..utils.logging import setup_logging, get_logger
from ..utils.settings import settings

setup_logging(settings.log_level, settings.log_format)
logger = get_logger(__name__)


async def fetch_and_prepare_data(symbols: list, timeframe: str = '1h', limit: int = 1000) -> pd.DataFrame:
    """
    Fetch historical data for multiple symbols and combine

    Args:
        symbols: List of trading symbols
        timeframe: Timeframe (1h, 4h, 1d, etc.)
        limit: Number of candles per symbol

    Returns:
        Combined DataFrame with features and labels
    """
    client = get_rest_client()
    all_data = []

    for symbol in symbols:
        try:
            logger.info(f"Fetching {symbol} ({timeframe})...")

            # Try loading from cache first
            cached = load_from_parquet(symbol, timeframe)

            if cached is not None and len(cached) >= limit:
                df = cached.tail(limit)
                logger.info(f"  Loaded {len(df)} candles from cache")
            else:
                # Fetch from Binance
                df = await client.get_klines(symbol, timeframe, limit)
                save_to_parquet(df, symbol, timeframe)
                logger.info(f"  Fetched {len(df)} candles from Binance")

            # Build features
            df_features = build_features(df)

            # Generate labels (look ahead 8 bars, 1% threshold)
            df_features['label'] = label_long(df_features, horizon=8, threshold=0.01)

            # Add symbol column
            df_features['symbol'] = symbol

            all_data.append(df_features)

        except Exception as e:
            logger.error(f"Failed to fetch {symbol}: {e}")
            continue

    if not all_data:
        raise ValueError("No data fetched")

    # Combine all symbols
    combined = pd.concat(all_data, ignore_index=True)
    logger.info(f"Combined data: {len(combined)} samples from {len(all_data)} symbols")

    return combined


def prepare_training_data(df: pd.DataFrame):
    """
    Prepare features and labels for training

    Args:
        df: DataFrame with features and 'label' column

    Returns:
        (features, labels) as numpy arrays
    """
    # Drop non-feature columns
    exclude_cols = ['timestamp', 'symbol', 'label']
    feature_cols = [col for col in df.columns if col not in exclude_cols]

    features = df[feature_cols].values.astype(np.float32)
    labels = df['label'].values.astype(np.float32)

    logger.info(f"Features: {features.shape}, Labels: {labels.shape}")
    logger.info(f"Label distribution: {np.bincount(labels.astype(int))}")

    return features, labels


async def main():
    """Main training pipeline"""
    parser = argparse.ArgumentParser(description='Nirvana TF Bot v2 - Model Training')
    parser.add_argument('--data', type=str, default='data/cache', help='Data cache directory')
    parser.add_argument('--epochs', type=int, default=50, help='Number of epochs')
    parser.add_argument('--batch-size', type=int, default=64, help='Batch size')
    parser.add_argument('--model-out', type=str, default='artifacts/model', help='Model output directory')
    parser.add_argument('--n-symbols', type=int, default=20, help='Number of symbols to train on')
    parser.add_argument('--timeframe', type=str, default='1h', help='Timeframe (1h, 4h, 1d)')

    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("Nirvana TF Bot v2 - Training Pipeline")
    logger.info("=" * 60)

    # 1. Fetch symbols
    logger.info("Step 1: Fetching top symbols...")
    symbols = await get_symbols_top100()
    symbols = symbols[:args.n_symbols]
    logger.info(f"Training on {len(symbols)} symbols: {symbols[:5]}...")

    # 2. Fetch and prepare data
    logger.info("\nStep 2: Fetching historical data...")
    df = await fetch_and_prepare_data(symbols, args.timeframe, limit=1000)

    # 3. Prepare features and labels
    logger.info("\nStep 3: Preparing training data...")
    features, labels = prepare_training_data(df)

    # 4. Split data (temporal split)
    logger.info("\nStep 4: Splitting data...")
    (X_train, y_train), (X_val, y_val), (X_test, y_test) = split_dataset(
        features, labels, train_split=0.7, val_split=0.15, test_split=0.15
    )

    # 5. Normalize features
    logger.info("\nStep 5: Normalizing features...")
    X_train, X_val, X_test, median, scale = normalize_features(X_train, X_val, X_test)

    # Save normalization params
    np.save(Path(args.model_out) / 'norm_median.npy', median)
    np.save(Path(args.model_out) / 'norm_scale.npy', scale)

    # 6. Create windowed datasets
    logger.info("\nStep 6: Creating windowed datasets...")
    train_ds = windowed_dataset(X_train, y_train, window_size=settings.seq_len, stride=8, batch_size=args.batch_size, shuffle=True)
    val_ds = windowed_dataset(X_val, y_val, window_size=settings.seq_len, stride=8, batch_size=args.batch_size, shuffle=False)

    # 7. Build model
    logger.info("\nStep 7: Building model...")
    n_features = X_train.shape[1]
    model = build_model(n_features=n_features, seq_len=settings.seq_len)
    model.summary()

    # 8. Setup callbacks
    logger.info("\nStep 8: Setting up callbacks...")
    checkpoint_dir = Path(args.model_out).parent / 'checkpoints'
    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    callbacks = [
        keras.callbacks.ModelCheckpoint(
            filepath=str(checkpoint_dir / 'best_model.keras'),
            monitor='val_auc',
            mode='max',
            save_best_only=True,
            verbose=1
        ),
        keras.callbacks.EarlyStopping(
            monitor='val_auc',
            mode='max',
            patience=settings.early_stopping_patience,
            restore_best_weights=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-6,
            verbose=1
        ),
        keras.callbacks.CSVLogger(
            str(checkpoint_dir / 'training_history.csv')
        )
    ]

    # 9. Train model
    logger.info("\nStep 9: Training model...")
    logger.info(f"Epochs: {args.epochs}, Batch size: {args.batch_size}")

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        callbacks=callbacks,
        verbose=1
    )

    # 10. Evaluate on test set
    logger.info("\nStep 10: Evaluating on test set...")
    test_ds = windowed_dataset(X_test, y_test, window_size=settings.seq_len, stride=8, batch_size=args.batch_size, shuffle=False)
    test_results = model.evaluate(test_ds, verbose=1)

    logger.info("\nTest Results:")
    for metric, value in zip(model.metrics_names, test_results):
        logger.info(f"  {metric}: {value:.4f}")

    # 11. Save final model
    logger.info("\nStep 11: Saving final model...")
    model_dir = Path(args.model_out)
    model_dir.mkdir(parents=True, exist_ok=True)

    model.save(model_dir / 'saved_model.keras')
    logger.info(f"Model saved to {model_dir / 'saved_model.keras'}")

    # Save metadata
    metadata = {
        'n_features': int(n_features),
        'seq_len': int(settings.seq_len),
        'symbols': symbols,
        'timeframe': args.timeframe,
        'trained_at': datetime.utcnow().isoformat() + 'Z',
        'test_metrics': {name: float(val) for name, val in zip(model.metrics_names, test_results)}
    }

    import json
    with open(model_dir / 'metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)

    logger.info("\n" + "=" * 60)
    logger.info("Training completed successfully!")
    logger.info("=" * 60)

    await get_rest_client().close()


if __name__ == '__main__':
    asyncio.run(main())