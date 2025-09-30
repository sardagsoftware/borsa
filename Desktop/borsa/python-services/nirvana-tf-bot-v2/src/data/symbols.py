"""
Nirvana TF Bot v2 - Symbol Management
Get top 100 USDT crypto pairs from Binance
"""

import httpx
from typing import List, Dict
from ..utils.logging import get_logger
from ..utils.settings import settings

logger = get_logger(__name__)


async def get_symbols_top100() -> List[str]:
    """
    Get top 100 USDT trading pairs by 24h volume

    Returns:
        List of symbols (e.g., ['BTCUSDT', 'ETHUSDT', ...])
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get 24h ticker for all symbols
            response = await client.get(f"{settings.binance_rest_base}/api/v3/ticker/24hr")
            response.raise_for_status()
            tickers = response.json()

        # Filter USDT pairs
        usdt_pairs = [
            ticker
            for ticker in tickers
            if ticker["symbol"].endswith("USDT")
            and not any(
                x in ticker["symbol"]
                for x in ["DOWN", "UP", "BULL", "BEAR"]  # Exclude leveraged tokens
            )
        ]

        # Sort by 24h quote volume (USD volume)
        usdt_pairs.sort(key=lambda x: float(x.get("quoteVolume", 0)), reverse=True)

        # Get top N
        top_symbols = [ticker["symbol"] for ticker in usdt_pairs[: settings.top_n]]

        logger.info(
            f"Fetched top {len(top_symbols)} USDT pairs. Top 5: {top_symbols[:5]}"
        )

        return top_symbols

    except Exception as e:
        logger.error(f"Failed to fetch top symbols: {e}")
        # Return fallback list
        return [
            "BTCUSDT",
            "ETHUSDT",
            "BNBUSDT",
            "SOLUSDT",
            "XRPUSDT",
            "ADAUSDT",
            "AVAXUSDT",
            "DOGEUSDT",
            "DOTUSDT",
            "MATICUSDT",
        ]


def get_fallback_symbols() -> List[str]:
    """Get fallback list of top symbols"""
    return [
        "BTCUSDT",
        "ETHUSDT",
        "BNBUSDT",
        "SOLUSDT",
        "XRPUSDT",
        "ADAUSDT",
        "AVAXUSDT",
        "DOGEUSDT",
        "DOTUSDT",
        "MATICUSDT",
        "LINKUSDT",
        "LTCUSDT",
        "UNIUSDT",
        "ATOMUSDT",
        "ETCUSDT",
        "XLMUSDT",
        "ALGOUSDT",
        "VETUSDT",
        "FILUSDT",
        "TRXUSDT",
    ]