"""
Nirvana TF Bot v2 - Technical Analysis Indicators
RSI, MACD, Bollinger Bands, EMA, SMA, ATR, VWAP, OBV, etc.
"""

import pandas as pd
import numpy as np
from typing import Optional
from ..utils.logging import get_logger

logger = get_logger(__name__)


def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """
    Calculate Relative Strength Index (RSI)

    Args:
        series: Price series
        period: RSI period (default: 14)

    Returns:
        RSI values (0-100)
    """
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))

    return rsi


def calculate_stoch_rsi(series: pd.Series, period: int = 14, smooth_k: int = 3, smooth_d: int = 3) -> tuple:
    """
    Calculate Stochastic RSI

    Args:
        series: Price series
        period: RSI period
        smooth_k: %K smoothing
        smooth_d: %D smoothing

    Returns:
        (stoch_k, stoch_d)
    """
    rsi = calculate_rsi(series, period)

    # Stochastic of RSI
    rsi_low = rsi.rolling(window=period).min()
    rsi_high = rsi.rolling(window=period).max()

    stoch_rsi = (rsi - rsi_low) / (rsi_high - rsi_low) * 100

    stoch_k = stoch_rsi.rolling(window=smooth_k).mean()
    stoch_d = stoch_k.rolling(window=smooth_d).mean()

    return stoch_k, stoch_d


def calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> tuple:
    """
    Calculate MACD (Moving Average Convergence Divergence)

    Args:
        series: Price series
        fast: Fast EMA period
        slow: Slow EMA period
        signal: Signal line period

    Returns:
        (macd, signal_line, histogram)
    """
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()

    macd = ema_fast - ema_slow
    signal_line = macd.ewm(span=signal, adjust=False).mean()
    histogram = macd - signal_line

    return macd, signal_line, histogram


def calculate_bollinger_bands(series: pd.Series, period: int = 20, std_dev: float = 2.0) -> tuple:
    """
    Calculate Bollinger Bands

    Args:
        series: Price series
        period: SMA period
        std_dev: Standard deviation multiplier

    Returns:
        (upper_band, middle_band, lower_band)
    """
    middle = series.rolling(window=period).mean()
    std = series.rolling(window=period).std()

    upper = middle + (std * std_dev)
    lower = middle - (std * std_dev)

    return upper, middle, lower


def calculate_ema(series: pd.Series, period: int) -> pd.Series:
    """Calculate Exponential Moving Average"""
    return series.ewm(span=period, adjust=False).mean()


def calculate_sma(series: pd.Series, period: int) -> pd.Series:
    """Calculate Simple Moving Average"""
    return series.rolling(window=period).mean()


def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    """
    Calculate Average True Range (ATR)

    Args:
        high: High prices
        low: Low prices
        close: Close prices
        period: ATR period

    Returns:
        ATR values
    """
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))

    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = tr.rolling(window=period).mean()

    return atr


def calculate_vwap(high: pd.Series, low: pd.Series, close: pd.Series, volume: pd.Series) -> pd.Series:
    """
    Calculate Volume Weighted Average Price (VWAP)

    Args:
        high: High prices
        low: Low prices
        close: Close prices
        volume: Volume

    Returns:
        VWAP values
    """
    typical_price = (high + low + close) / 3
    vwap = (typical_price * volume).cumsum() / volume.cumsum()

    return vwap


def calculate_obv(close: pd.Series, volume: pd.Series) -> pd.Series:
    """
    Calculate On-Balance Volume (OBV)

    Args:
        close: Close prices
        volume: Volume

    Returns:
        OBV values
    """
    direction = np.sign(close.diff())
    obv = (direction * volume).cumsum()

    return obv


def calculate_historical_volatility(close: pd.Series, period: int = 20) -> pd.Series:
    """
    Calculate Historical Volatility (rolling standard deviation of returns)

    Args:
        close: Close prices
        period: Period for volatility calculation

    Returns:
        Historical volatility
    """
    returns = close.pct_change()
    volatility = returns.rolling(window=period).std() * np.sqrt(252)  # Annualized

    return volatility


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Build complete feature set from OHLCV data

    Args:
        df: DataFrame with columns: timestamp, open, high, low, close, volume

    Returns:
        DataFrame with all technical indicators
    """
    logger.debug(f"Building features for {len(df)} candles")

    df = df.copy()

    # Price features
    df['close'] = df['close'].astype(float)
    df['high'] = df['high'].astype(float)
    df['low'] = df['low'].astype(float)
    df['open'] = df['open'].astype(float)
    df['volume'] = df['volume'].astype(float)

    # RSI
    df['rsi'] = calculate_rsi(df['close'], 14)
    df['rsi_6'] = calculate_rsi(df['close'], 6)  # Fast RSI

    # Stochastic RSI
    stoch_k, stoch_d = calculate_stoch_rsi(df['close'], 14, 3, 3)
    df['stoch_k'] = stoch_k
    df['stoch_d'] = stoch_d

    # MACD
    macd, signal, histogram = calculate_macd(df['close'], 12, 26, 9)
    df['macd'] = macd
    df['macd_signal'] = signal
    df['macd_histogram'] = histogram

    # Bollinger Bands
    bb_upper, bb_middle, bb_lower = calculate_bollinger_bands(df['close'], 20, 2)
    df['bb_upper'] = bb_upper
    df['bb_middle'] = bb_middle
    df['bb_lower'] = bb_lower
    df['bb_width'] = (bb_upper - bb_lower) / bb_middle
    df['bb_position'] = (df['close'] - bb_lower) / (bb_upper - bb_lower)  # 0-1

    # EMAs
    df['ema_9'] = calculate_ema(df['close'], 9)
    df['ema_12'] = calculate_ema(df['close'], 12)
    df['ema_26'] = calculate_ema(df['close'], 26)
    df['ema_50'] = calculate_ema(df['close'], 50)
    df['ema_200'] = calculate_ema(df['close'], 200)

    # SMAs
    df['sma_20'] = calculate_sma(df['close'], 20)
    df['sma_50'] = calculate_sma(df['close'], 50)
    df['sma_200'] = calculate_sma(df['close'], 200)

    # ATR
    df['atr'] = calculate_atr(df['high'], df['low'], df['close'], 14)

    # VWAP
    df['vwap'] = calculate_vwap(df['high'], df['low'], df['close'], df['volume'])

    # OBV
    df['obv'] = calculate_obv(df['close'], df['volume'])

    # Historical Volatility
    df['hv_20'] = calculate_historical_volatility(df['close'], 20)

    # Price changes
    df['price_change_1'] = df['close'].pct_change(1)
    df['price_change_5'] = df['close'].pct_change(5)
    df['price_change_10'] = df['close'].pct_change(10)

    # Volume ratio
    df['volume_ratio'] = df['volume'] / df['volume'].rolling(window=20).mean()

    # Candle patterns (simple)
    df['body_size'] = abs(df['close'] - df['open']) / df['open']
    df['upper_shadow'] = (df['high'] - df[['open', 'close']].max(axis=1)) / df['open']
    df['lower_shadow'] = (df[['open', 'close']].min(axis=1) - df['low']) / df['open']

    # Clean infinities and NaNs
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.fillna(method='ffill').fillna(method='bfill').fillna(0)

    logger.debug(f"Features built: {len(df.columns)} columns")

    return df


def label_long(df: pd.DataFrame, horizon: int = 8, threshold: float = 0.01) -> pd.Series:
    """
    Generate BUY labels based on future price movement

    Args:
        df: DataFrame with 'close' column
        horizon: Number of bars to look ahead
        threshold: Price increase threshold (1% = 0.01)

    Returns:
        Binary labels (1 = BUY, 0 = PASS)
    """
    future_return = df['close'].shift(-horizon) / df['close'] - 1
    labels = (future_return > threshold).astype(int)

    # Don't label the last 'horizon' bars (no future data)
    labels.iloc[-horizon:] = 0

    return labels