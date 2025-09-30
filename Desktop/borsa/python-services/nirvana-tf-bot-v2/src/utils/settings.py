"""
Nirvana TF Bot v2 - Settings Management
Pydantic-based configuration with environment variables
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Binance API
    binance_rest_base: str = "https://api.binance.com"
    binance_futures_base: str = "https://fapi.binance.com"
    binance_ws_base: str = "wss://stream.binance.com:9443"

    # Database
    mongo_url: str = "mongodb://localhost:27017/nirvana"
    redis_url: str = "redis://localhost:6379/0"

    # Model Configuration
    model_dir: str = "artifacts/model"
    seq_len: int = 128
    thresh_buy: float = 0.60
    min_indicator_conf: int = 3

    # Data Configuration
    top_n: int = 100
    timeframes: str = "15m,1h,4h,1d"
    data_cache_dir: str = "data/cache"

    # Training
    epochs: int = 50
    batch_size: int = 64
    learning_rate: float = 0.001
    early_stopping_patience: int = 5

    # Scheduler
    fetch_interval_seconds: int = 60
    enable_scheduler: bool = True

    # Logging
    log_level: str = "INFO"
    log_format: str = "json"

    # Rate Limiting
    max_requests_per_second: int = 10
    backoff_max_retries: int = 5
    backoff_jitter: float = 0.3

    @property
    def timeframes_list(self) -> List[str]:
        """Parse timeframes as list"""
        return [tf.strip() for tf in self.timeframes.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()