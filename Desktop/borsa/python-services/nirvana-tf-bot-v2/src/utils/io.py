"""
Nirvana TF Bot v2 - I/O Utilities
Parquet caching, data loading, saving
"""

import pandas as pd
from pathlib import Path
from typing import Optional
from ..utils.logging import get_logger
from ..utils.settings import settings

logger = get_logger(__name__)


def save_to_parquet(df: pd.DataFrame, symbol: str, timeframe: str) -> str:
    """
    Save DataFrame to parquet cache

    Args:
        df: DataFrame to save
        symbol: Trading symbol
        timeframe: Time interval

    Returns:
        Path to saved file
    """
    cache_dir = Path(settings.data_cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{symbol}_{timeframe}.parquet"
    filepath = cache_dir / filename

    df.to_parquet(filepath, compression='snappy', index=False)
    logger.info(f"Saved {len(df)} rows to {filepath}")

    return str(filepath)


def load_from_parquet(symbol: str, timeframe: str) -> Optional[pd.DataFrame]:
    """
    Load DataFrame from parquet cache

    Args:
        symbol: Trading symbol
        timeframe: Time interval

    Returns:
        DataFrame or None if not found
    """
    cache_dir = Path(settings.data_cache_dir)
    filename = f"{symbol}_{timeframe}.parquet"
    filepath = cache_dir / filename

    if not filepath.exists():
        logger.debug(f"Cache miss: {filepath}")
        return None

    try:
        df = pd.read_parquet(filepath)
        logger.debug(f"Loaded {len(df)} rows from {filepath}")
        return df
    except Exception as e:
        logger.error(f"Failed to load {filepath}: {e}")
        return None


def get_cached_or_fetch(symbol: str, timeframe: str, fetch_func) -> pd.DataFrame:
    """
    Get data from cache or fetch if not available

    Args:
        symbol: Trading symbol
        timeframe: Time interval
        fetch_func: Function to fetch data if cache miss

    Returns:
        DataFrame
    """
    # Try cache first
    df = load_from_parquet(symbol, timeframe)

    if df is not None:
        return df

    # Cache miss - fetch
    logger.info(f"Fetching {symbol} ({timeframe}) from source...")
    df = fetch_func(symbol, timeframe)

    # Save to cache
    save_to_parquet(df, symbol, timeframe)

    return df