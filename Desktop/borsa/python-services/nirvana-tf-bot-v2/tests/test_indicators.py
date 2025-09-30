"""
Nirvana TF Bot v2 - Indicator Tests
Test technical analysis indicator calculations
"""

import pytest
import pandas as pd
import numpy as np

from src.features.indicators import (
    calculate_rsi,
    calculate_macd,
    calculate_bollinger_bands,
    calculate_ema,
    calculate_atr,
    build_features,
    label_long,
)


def generate_sample_data(n=100):
    """Generate sample OHLCV data for testing"""
    np.random.seed(42)

    dates = pd.date_range('2024-01-01', periods=n, freq='1H')
    close = 100 + np.cumsum(np.random.randn(n))

    data = {
        'timestamp': dates,
        'open': close + np.random.randn(n) * 0.5,
        'high': close + abs(np.random.randn(n)) * 2,
        'low': close - abs(np.random.randn(n)) * 2,
        'close': close,
        'volume': abs(np.random.randn(n)) * 1000,
    }

    return pd.DataFrame(data)


def test_rsi_calculation():
    """Test RSI calculation"""
    df = generate_sample_data()
    rsi = calculate_rsi(df['close'], period=14)

    # RSI should be between 0 and 100
    assert rsi.dropna().min() >= 0
    assert rsi.dropna().max() <= 100

    # First 14 values should be NaN
    assert rsi.iloc[:13].isna().all()


def test_macd_calculation():
    """Test MACD calculation"""
    df = generate_sample_data()
    macd, signal, histogram = calculate_macd(df['close'], 12, 26, 9)

    # All should be same length
    assert len(macd) == len(signal) == len(histogram) == len(df)

    # Histogram should be macd - signal
    np.testing.assert_allclose(
        histogram.dropna(),
        (macd - signal).dropna(),
        rtol=1e-5
    )


def test_bollinger_bands():
    """Test Bollinger Bands calculation"""
    df = generate_sample_data()
    upper, middle, lower = calculate_bollinger_bands(df['close'], period=20, std_dev=2)

    # Upper > Middle > Lower
    assert (upper.dropna() >= middle.dropna()).all()
    assert (middle.dropna() >= lower.dropna()).all()


def test_ema_calculation():
    """Test EMA calculation"""
    df = generate_sample_data()
    ema = calculate_ema(df['close'], period=20)

    # EMA should be same length as input
    assert len(ema) == len(df)

    # EMA should not have infinities
    assert not np.isinf(ema).any()


def test_atr_calculation():
    """Test ATR calculation"""
    df = generate_sample_data()
    atr = calculate_atr(df['high'], df['low'], df['close'], period=14)

    # ATR should be positive
    assert (atr.dropna() >= 0).all()


def test_build_features():
    """Test full feature engineering pipeline"""
    df = generate_sample_data(n=200)
    df_features = build_features(df)

    # Should have many more columns than input
    assert len(df_features.columns) > len(df.columns)

    # Check specific indicators exist
    expected_cols = ['rsi', 'macd', 'macd_histogram', 'bb_upper', 'ema_9', 'atr']
    for col in expected_cols:
        assert col in df_features.columns

    # No NaN or Inf values (should be filled)
    assert not df_features.isnull().any().any()
    assert not np.isinf(df_features.select_dtypes(include=[np.number])).any().any()


def test_label_long():
    """Test label generation"""
    df = generate_sample_data(n=200)
    df = build_features(df)
    labels = label_long(df, horizon=8, threshold=0.01)

    # Labels should be 0 or 1
    assert set(labels.unique()).issubset({0, 1, np.nan})

    # Last 'horizon' labels should be 0 (no future data)
    assert (labels.tail(8) == 0).all()

    # Should have some positive labels
    assert labels.sum() > 0