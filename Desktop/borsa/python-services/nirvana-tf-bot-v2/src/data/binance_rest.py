"""
Nirvana TF Bot v2 - Binance REST API Client
Rate-limited, exponential backoff, read-only operations
"""

import httpx
import pandas as pd
from typing import Optional, List
import asyncio
from datetime import datetime
from ..utils.logging import get_logger
from ..utils.settings import settings

logger = get_logger(__name__)


class BinanceRESTClient:
    """
    Binance REST API client with rate limiting and retry logic
    """

    def __init__(self):
        self.base_url = settings.binance_rest_base
        self.max_retries = settings.backoff_max_retries
        self.jitter = settings.backoff_jitter
        self.client = httpx.AsyncClient(timeout=30.0)

    async def _request_with_backoff(
        self, url: str, params: Optional[dict] = None
    ) -> dict:
        """
        Make HTTP request with exponential backoff on 429 (rate limit)

        Args:
            url: Full URL
            params: Query parameters

        Returns:
            JSON response

        Raises:
            httpx.HTTPStatusError: On non-retryable errors
        """
        for attempt in range(self.max_retries):
            try:
                response = await self.client.get(url, params=params)

                if response.status_code == 429:
                    # Rate limited - exponential backoff
                    wait_time = (2**attempt) * (1 + self.jitter)
                    logger.warning(
                        f"Rate limited (429). Retrying in {wait_time:.2f}s (attempt {attempt + 1}/{self.max_retries})"
                    )
                    await asyncio.sleep(wait_time)
                    continue

                response.raise_for_status()
                return response.json()

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    continue  # Retry on 429
                else:
                    logger.error(f"HTTP error: {e}")
                    raise

            except Exception as e:
                logger.error(f"Request failed: {e}")
                if attempt == self.max_retries - 1:
                    raise
                await asyncio.sleep(2**attempt)

        raise Exception(f"Max retries ({self.max_retries}) exceeded")

    async def get_klines(
        self,
        symbol: str,
        interval: str = "1h",
        limit: int = 500,
        start_time: Optional[int] = None,
        end_time: Optional[int] = None,
    ) -> pd.DataFrame:
        """
        Get candlestick (kline) data

        Args:
            symbol: Trading pair (e.g., 'BTCUSDT')
            interval: Time interval (1m, 5m, 15m, 1h, 4h, 1d, etc.)
            limit: Number of candles (max 1000)
            start_time: Start timestamp (ms)
            end_time: End timestamp (ms)

        Returns:
            DataFrame with columns: timestamp, open, high, low, close, volume
        """
        url = f"{self.base_url}/api/v3/klines"
        params = {"symbol": symbol, "interval": interval, "limit": min(limit, 1000)}

        if start_time:
            params["startTime"] = start_time
        if end_time:
            params["endTime"] = end_time

        try:
            data = await self._request_with_backoff(url, params)

            # Parse klines
            df = pd.DataFrame(
                data,
                columns=[
                    "timestamp",
                    "open",
                    "high",
                    "low",
                    "close",
                    "volume",
                    "close_time",
                    "quote_volume",
                    "trades",
                    "taker_buy_base",
                    "taker_buy_quote",
                    "ignore",
                ],
            )

            # Select and convert columns
            df = df[["timestamp", "open", "high", "low", "close", "volume"]]
            df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
            df[["open", "high", "low", "close", "volume"]] = df[
                ["open", "high", "low", "close", "volume"]
            ].astype(float)

            logger.debug(
                f"Fetched {len(df)} klines for {symbol} ({interval})",
                extra={"symbol": symbol, "timeframe": interval},
            )

            return df

        except Exception as e:
            logger.error(
                f"Failed to fetch klines for {symbol} ({interval}): {e}",
                extra={"symbol": symbol, "timeframe": interval},
            )
            raise

    async def get_24h_ticker(self, symbol: Optional[str] = None) -> dict | List[dict]:
        """
        Get 24h ticker price change statistics

        Args:
            symbol: Trading pair (optional, returns all if None)

        Returns:
            Ticker data (dict for single symbol, list for all)
        """
        url = f"{self.base_url}/api/v3/ticker/24hr"
        params = {"symbol": symbol} if symbol else {}

        try:
            data = await self._request_with_backoff(url, params)
            return data

        except Exception as e:
            logger.error(f"Failed to fetch 24h ticker: {e}")
            raise

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Global client instance
_client: Optional[BinanceRESTClient] = None


def get_rest_client() -> BinanceRESTClient:
    """Get or create REST client singleton"""
    global _client
    if _client is None:
        _client = BinanceRESTClient()
    return _client