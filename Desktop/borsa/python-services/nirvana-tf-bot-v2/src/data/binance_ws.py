"""
Nirvana TF Bot v2 - Binance WebSocket Client
Real-time market data streaming with auto-reconnect
"""

import websockets
import orjson
import asyncio
from typing import Callable, List, Optional
from datetime import datetime
from ..utils.logging import get_logger
from ..utils.settings import settings

logger = get_logger(__name__)


class BinanceWebSocketClient:
    """
    Binance WebSocket client with auto-reconnect
    Streams miniTicker, aggTrade, or custom streams
    """

    def __init__(
        self,
        streams: List[str],
        callback: Callable,
        reconnect_interval: int = 3,
    ):
        """
        Args:
            streams: List of stream names (e.g., ['btcusdt@miniTicker', 'ethusdt@aggTrade'])
            callback: Async callback function(data: dict) for incoming messages
            reconnect_interval: Seconds to wait before reconnecting
        """
        self.streams = streams
        self.callback = callback
        self.reconnect_interval = reconnect_interval
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.running = False

    async def connect(self):
        """Establish WebSocket connection"""
        # Build combined stream URL
        streams_param = "/".join(self.streams)
        url = f"{settings.binance_ws_base}/stream?streams={streams_param}"

        logger.info(f"Connecting to Binance WebSocket: {len(self.streams)} streams")

        try:
            self.ws = await websockets.connect(url, ping_interval=20)
            self.running = True
            logger.info("WebSocket connected")
            await self._listen()

        except Exception as e:
            logger.error(f"WebSocket connection failed: {e}")
            await self._reconnect()

    async def _listen(self):
        """Listen for incoming messages"""
        try:
            async for message in self.ws:
                try:
                    data = orjson.loads(message)
                    await self.callback(data)
                except Exception as e:
                    logger.error(f"Error processing message: {e}")

        except websockets.ConnectionClosed:
            logger.warning("WebSocket connection closed")
            await self._reconnect()

        except Exception as e:
            logger.error(f"WebSocket listen error: {e}")
            await self._reconnect()

    async def _reconnect(self):
        """Reconnect with exponential backoff"""
        if not self.running:
            return

        wait_time = self.reconnect_interval
        logger.info(f"Reconnecting in {wait_time}s...")
        await asyncio.sleep(wait_time)

        if self.running:
            await self.connect()

    async def close(self):
        """Close WebSocket connection"""
        self.running = False
        if self.ws:
            await self.ws.close()
            logger.info("WebSocket closed")


class OHLCVAggregator:
    """
    Aggregate trades into OHLCV candles for custom timeframes (e.g., 15s, 1m)
    """

    def __init__(
        self,
        symbol: str,
        interval_seconds: int,
        callback: Callable,
    ):
        """
        Args:
            symbol: Trading pair
            interval_seconds: Candle interval (e.g., 15 for 15s candles)
            callback: Async callback(candle: dict) when candle closes
        """
        self.symbol = symbol
        self.interval_seconds = interval_seconds
        self.callback = callback

        # Current candle
        self.current_candle = {
            "symbol": symbol,
            "timestamp": None,
            "open": None,
            "high": None,
            "low": None,
            "close": None,
            "volume": 0.0,
        }
        self.candle_start_time = None

    async def process_trade(self, trade: dict):
        """
        Process incoming trade

        Args:
            trade: Trade data from aggTrade stream
                {
                    "e": "aggTrade",
                    "s": "BTCUSDT",
                    "p": "66500.00",  # price
                    "q": "0.1",       # quantity
                    "T": 1702395847000, # trade time
                }
        """
        price = float(trade["p"])
        quantity = float(trade["q"])
        trade_time = trade["T"]

        # Determine candle start time
        candle_time = (trade_time // (self.interval_seconds * 1000)) * (
            self.interval_seconds * 1000
        )

        # New candle
        if self.candle_start_time is None or candle_time > self.candle_start_time:
            # Close previous candle
            if self.candle_start_time is not None and self.current_candle["open"] is not None:
                await self.callback(self.current_candle.copy())

            # Start new candle
            self.candle_start_time = candle_time
            self.current_candle = {
                "symbol": self.symbol,
                "timestamp": candle_time,
                "open": price,
                "high": price,
                "low": price,
                "close": price,
                "volume": quantity,
            }

        else:
            # Update current candle
            if self.current_candle["open"] is None:
                self.current_candle["open"] = price

            self.current_candle["high"] = max(self.current_candle["high"], price)
            self.current_candle["low"] = min(self.current_candle["low"], price)
            self.current_candle["close"] = price
            self.current_candle["volume"] += quantity