"""
Nirvana TF Bot v2 - 24/7 Scheduler Loop
Fetch → Feature → Inference → Persist → Publish
"""

import asyncio
from datetime import datetime
from typing import List

from ..data.binance_rest import get_rest_client
from ..data.symbols import get_symbols_top100
from ..models.inference import get_inference_engine
from ..utils.logging import setup_logging, get_logger
from ..utils.settings import settings

setup_logging(settings.log_level, settings.log_format)
logger = get_logger(__name__)


async def process_symbol(symbol: str, timeframe: str, engine):
    """
    Process single symbol: fetch → inference → log

    Args:
        symbol: Trading symbol
        timeframe: Timeframe
        engine: Inference engine
    """
    try:
        logger.debug(f"Processing {symbol} ({timeframe})...")

        # Fetch candles
        client = get_rest_client()
        df = await client.get_klines(symbol, timeframe, limit=settings.seq_len + 100)

        if len(df) < settings.seq_len:
            logger.warning(f"  {symbol}: Insufficient data ({len(df)} candles)")
            return

        # Generate prediction
        candles = df.to_dict('records')
        prediction = engine.predict(candles)

        # Log result
        logger.info(
            f"  {symbol}: {prediction['decision']} "
            f"(prob: {prediction['probability']:.1%}, "
            f"conf: {prediction['confidence']:.1%})"
        )

        # TODO: Persist to MongoDB
        # TODO: Publish to Redis

    except Exception as e:
        logger.error(f"  {symbol}: Error - {e}")


async def run_cycle(symbols: List[str], timeframe: str):
    """
    Run one complete cycle for all symbols

    Args:
        symbols: List of trading symbols
        timeframe: Timeframe
    """
    logger.info(f"\n🔄 Starting cycle: {len(symbols)} symbols ({timeframe})")
    start_time = asyncio.get_event_loop().time()

    # Get inference engine
    engine = get_inference_engine()

    # Process all symbols concurrently (with limit)
    semaphore = asyncio.Semaphore(10)  # Max 10 concurrent

    async def process_with_limit(symbol):
        async with semaphore:
            await process_symbol(symbol, timeframe, engine)

    tasks = [process_with_limit(symbol) for symbol in symbols]
    await asyncio.gather(*tasks, return_exceptions=True)

    elapsed = asyncio.get_event_loop().time() - start_time
    logger.info(f"✅ Cycle completed in {elapsed:.2f}s\n")


async def scheduler_loop():
    """Main scheduler loop"""
    logger.info("=" * 60)
    logger.info("Nirvana TF Bot v2 - 24/7 Scheduler")
    logger.info("=" * 60)
    logger.info(f"Interval: {settings.fetch_interval_seconds}s")
    logger.info(f"Timeframes: {settings.timeframes_list}")
    logger.info(f"Top symbols: {settings.top_n}")
    logger.info("=" * 60 + "\n")

    # Fetch symbols once
    symbols = await get_symbols_top100()
    logger.info(f"Tracking {len(symbols)} symbols")

    # Main loop
    cycle_count = 0

    while settings.enable_scheduler:
        cycle_count += 1
        logger.info(f"\n{'='*60}")
        logger.info(f"Cycle #{cycle_count} - {datetime.utcnow().isoformat()}Z")
        logger.info(f"{'='*60}")

        # Run for each timeframe
        for timeframe in settings.timeframes_list:
            await run_cycle(symbols, timeframe)

        # Wait before next cycle
        logger.info(f"⏳ Waiting {settings.fetch_interval_seconds}s until next cycle...")
        await asyncio.sleep(settings.fetch_interval_seconds)


if __name__ == '__main__':
    try:
        asyncio.run(scheduler_loop())
    except KeyboardInterrupt:
        logger.info("\n⛔ Scheduler stopped by user")
    except Exception as e:
        logger.error(f"❌ Scheduler error: {e}")
        raise