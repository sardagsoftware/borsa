"""
AILYDIAN Auto-Trader AI Engine
Advanced AI-powered trading system with ML trend detection and risk management
© 2025 Emrah Şardağ - Ultra Pro Edition
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
import json
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import ta
from contextlib import asynccontextmanager
import yfinance as yf
import aiohttp
import redis.asyncio as redis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data models
class TradingSignal(BaseModel):
    symbol: str
    signal: str = Field(..., pattern="^(BUY|SELL|HOLD)$")
    confidence: float = Field(..., ge=0.0, le=1.0)
    entry_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    risk_score: float = Field(..., ge=0.0, le=1.0)
    timestamp: datetime = Field(default_factory=datetime.now)

class PortfolioPosition(BaseModel):
    symbol: str
    quantity: float
    entry_price: float
    current_price: Optional[float] = None
    unrealized_pnl: Optional[float] = None
    position_type: str = Field(..., pattern="^(LONG|SHORT)$")
    timestamp: datetime = Field(default_factory=datetime.now)

class RiskMetrics(BaseModel):
    var_1d: float
    var_5d: float
    sharpe_ratio: float
    max_drawdown: float
    total_risk_score: float = Field(..., ge=0.0, le=1.0)

class BacktestResult(BaseModel):
    total_return: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    total_trades: int
    profitable_trades: int

# Global variables
redis_client: Optional[redis.Redis] = None
ml_models: Dict[str, object] = {}
scalers: Dict[str, StandardScaler] = {}

# AI Trading Engine
class AITradingEngine:
    def __init__(self):
        self.rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        self.gb_regressor = GradientBoostingRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        
    async def calculate_technical_indicators(self, data: pd.DataFrame) -> pd.DataFrame:
        """Calculate technical indicators for ML features"""
        try:
            # Price indicators
            data['rsi'] = ta.momentum.RSIIndicator(close=data['Close']).rsi()
            data['macd'] = ta.trend.MACD(close=data['Close']).macd()
            data['bb_upper'] = ta.volatility.BollingerBands(close=data['Close']).bollinger_hband()
            data['bb_lower'] = ta.volatility.BollingerBands(close=data['Close']).bollinger_lband()
            
            # Moving averages
            data['sma_20'] = ta.trend.SMAIndicator(close=data['Close'], window=20).sma_indicator()
            data['ema_12'] = ta.trend.EMAIndicator(close=data['Close'], window=12).ema_indicator()
            data['ema_26'] = ta.trend.EMAIndicator(close=data['Close'], window=26).ema_indicator()
            
            # Volume indicators
            data['volume_sma'] = ta.volume.VolumeSMAIndicator(
                close=data['Close'], volume=data['Volume'], window=20
            ).volume_sma()
            
            # Volatility
            data['atr'] = ta.volatility.AverageTrueRange(
                high=data['High'], low=data['Low'], close=data['Close']
            ).average_true_range()
            
            # Price momentum
            data['price_change'] = data['Close'].pct_change()
            data['price_momentum'] = data['Close'].rolling(window=5).mean() / data['Close'].rolling(window=20).mean()
            
            return data.fillna(0)
            
        except Exception as e:
            logger.error(f"Error calculating technical indicators: {e}")
            return data
    
    async def prepare_features(self, data: pd.DataFrame) -> np.ndarray:
        """Prepare feature matrix for ML model"""
        try:
            feature_cols = [
                'rsi', 'macd', 'bb_upper', 'bb_lower', 'sma_20', 'ema_12', 'ema_26',
                'volume_sma', 'atr', 'price_change', 'price_momentum'
            ]
            
            features = data[feature_cols].values
            return self.scaler.fit_transform(features) if not self.is_trained else self.scaler.transform(features)
            
        except Exception as e:
            logger.error(f"Error preparing features: {e}")
            return np.array([])
    
    async def generate_trading_signals(self, symbol: str) -> TradingSignal:
        """Generate AI-powered trading signals"""
        try:
            # Fetch market data
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="1mo")
            
            if hist.empty:
                raise ValueError(f"No data available for {symbol}")
            
            # Calculate technical indicators
            data = await self.calculate_technical_indicators(hist)
            
            # Prepare features for ML model
            features = await self.prepare_features(data)
            
            if features.size == 0:
                raise ValueError("Failed to prepare features")
            
            # Use last row for prediction
            last_features = features[-1:].reshape(1, -1)
            
            # Generate signal (mock prediction for now)
            confidence = np.random.uniform(0.6, 0.95)
            signal_prob = np.random.uniform(0, 1)
            
            if signal_prob > 0.6:
                signal = "BUY"
            elif signal_prob < 0.4:
                signal = "SELL"
            else:
                signal = "HOLD"
            
            # Calculate risk score
            volatility = data['atr'].iloc[-1] / data['Close'].iloc[-1]
            risk_score = min(volatility * 2, 1.0)
            
            # Calculate entry price and levels
            current_price = float(data['Close'].iloc[-1])
            
            if signal == "BUY":
                stop_loss = current_price * 0.95  # 5% stop loss
                take_profit = current_price * 1.10  # 10% take profit
            elif signal == "SELL":
                stop_loss = current_price * 1.05  # 5% stop loss
                take_profit = current_price * 0.90  # 10% take profit
            else:
                stop_loss = None
                take_profit = None
            
            return TradingSignal(
                symbol=symbol,
                signal=signal,
                confidence=confidence,
                entry_price=current_price,
                stop_loss=stop_loss,
                take_profit=take_profit,
                risk_score=risk_score
            )
            
        except Exception as e:
            logger.error(f"Error generating trading signal for {symbol}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to generate signal: {str(e)}")

# Risk Management System
class RiskManager:
    def __init__(self):
        self.max_position_size = 0.05  # Max 5% per position
        self.max_portfolio_risk = 0.20  # Max 20% portfolio risk
        
    async def calculate_position_size(self, portfolio_value: float, risk_per_trade: float, 
                                    entry_price: float, stop_loss: Optional[float] = None) -> float:
        """Calculate optimal position size based on risk management"""
        try:
            if stop_loss is None or entry_price == stop_loss:
                return portfolio_value * self.max_position_size / entry_price
            
            risk_per_share = abs(entry_price - stop_loss)
            risk_amount = portfolio_value * risk_per_trade
            
            position_size = risk_amount / risk_per_share
            max_position_value = portfolio_value * self.max_position_size
            
            # Limit position size
            if position_size * entry_price > max_position_value:
                position_size = max_position_value / entry_price
            
            return round(position_size, 2)
            
        except Exception as e:
            logger.error(f"Error calculating position size: {e}")
            return 0.0
    
    async def calculate_portfolio_risk(self, positions: List[PortfolioPosition]) -> RiskMetrics:
        """Calculate portfolio risk metrics"""
        try:
            if not positions:
                return RiskMetrics(
                    var_1d=0.0, var_5d=0.0, sharpe_ratio=0.0,
                    max_drawdown=0.0, total_risk_score=0.0
                )
            
            # Mock risk calculations
            var_1d = np.random.uniform(0.01, 0.05)
            var_5d = np.random.uniform(0.03, 0.15)
            sharpe_ratio = np.random.uniform(0.5, 2.0)
            max_drawdown = np.random.uniform(0.05, 0.25)
            
            # Calculate total risk score
            risk_factors = [var_1d * 4, var_5d, max_drawdown]
            total_risk_score = min(np.mean(risk_factors), 1.0)
            
            return RiskMetrics(
                var_1d=var_1d,
                var_5d=var_5d,
                sharpe_ratio=sharpe_ratio,
                max_drawdown=max_drawdown,
                total_risk_score=total_risk_score
            )
            
        except Exception as e:
            logger.error(f"Error calculating portfolio risk: {e}")
            return RiskMetrics(
                var_1d=0.0, var_5d=0.0, sharpe_ratio=0.0,
                max_drawdown=0.0, total_risk_score=1.0
            )

# Backtesting Engine
class BacktestingEngine:
    def __init__(self):
        self.trading_engine = AITradingEngine()
        self.risk_manager = RiskManager()
        
    async def run_backtest(self, symbols: List[str], start_date: str, 
                          end_date: str, initial_capital: float = 10000) -> BacktestResult:
        """Run backtesting simulation"""
        try:
            total_trades = 0
            profitable_trades = 0
            portfolio_values = [initial_capital]
            current_capital = initial_capital
            
            # Mock backtesting results
            for symbol in symbols:
                trades = np.random.randint(5, 20)
                total_trades += trades
                
                # Simulate profitable trades
                win_rate = np.random.uniform(0.4, 0.7)
                profitable_trades += int(trades * win_rate)
                
                # Simulate returns
                returns = np.random.normal(0.001, 0.02, trades)  # Daily returns
                for ret in returns:
                    current_capital *= (1 + ret)
                    portfolio_values.append(current_capital)
            
            # Calculate metrics
            total_return = (current_capital - initial_capital) / initial_capital
            portfolio_values = np.array(portfolio_values)
            returns = np.diff(portfolio_values) / portfolio_values[:-1]
            
            sharpe_ratio = np.mean(returns) / np.std(returns) * np.sqrt(252) if np.std(returns) > 0 else 0
            
            # Calculate max drawdown
            cumulative_returns = portfolio_values / initial_capital
            peak = np.maximum.accumulate(cumulative_returns)
            drawdown = (cumulative_returns - peak) / peak
            max_drawdown = abs(np.min(drawdown))
            
            win_rate = profitable_trades / total_trades if total_trades > 0 else 0
            
            return BacktestResult(
                total_return=total_return,
                sharpe_ratio=sharpe_ratio,
                max_drawdown=max_drawdown,
                win_rate=win_rate,
                total_trades=total_trades,
                profitable_trades=profitable_trades
            )
            
        except Exception as e:
            logger.error(f"Error running backtest: {e}")
            return BacktestResult(
                total_return=0.0, sharpe_ratio=0.0, max_drawdown=0.0,
                win_rate=0.0, total_trades=0, profitable_trades=0
            )

# Initialize engines
trading_engine = AITradingEngine()
risk_manager = RiskManager()
backtest_engine = BacktestingEngine()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    global redis_client
    
    try:
        # Initialize Redis connection
        redis_client = redis.from_url("redis://localhost:6379", decode_responses=True)
        await redis_client.ping()
        logger.info("Connected to Redis")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}")
        redis_client = None
    
    logger.info("AILYDIAN Auto-Trader AI service started")
    yield
    
    # Cleanup
    if redis_client:
        await redis_client.close()

# FastAPI app
app = FastAPI(
    title="AILYDIAN Auto-Trader AI",
    description="Advanced AI-powered trading system with ML trend detection",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "auto-trader-ai",
        "version": "1.0.0",
        "redis_available": redis_client is not None,
        "ml_models_loaded": len(ml_models) > 0
    }

@app.post("/generate-signal")
async def generate_signal(request: dict) -> TradingSignal:
    """Generate trading signal for a symbol"""
    try:
        symbol = request.get("symbol")
        if not symbol:
            raise HTTPException(status_code=400, detail="Symbol is required")
            
        signal = await trading_engine.generate_trading_signals(symbol.upper())
        
        # Cache signal if Redis is available
        if redis_client:
            cache_key = f"signal:{symbol}:{datetime.now().strftime('%Y%m%d%H%M')}"
            await redis_client.setex(cache_key, 300, signal.model_dump_json())
        
        return signal
        
    except Exception as e:
        logger.error(f"Error generating signal for {request.get('symbol', 'unknown')}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculate-position-size")
async def calculate_position_size(
    portfolio_value: float,
    entry_price: float,
    risk_per_trade: float = 0.02,
    stop_loss: Optional[float] = None
):
    """Calculate optimal position size"""
    try:
        position_size = await risk_manager.calculate_position_size(
            portfolio_value, risk_per_trade, entry_price, stop_loss
        )
        
        return {
            "position_size": position_size,
            "position_value": position_size * entry_price,
            "risk_amount": portfolio_value * risk_per_trade,
            "risk_per_share": abs(entry_price - (stop_loss or entry_price))
        }
        
    except Exception as e:
        logger.error(f"Error calculating position size: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/portfolio-risk")
async def calculate_portfolio_risk(positions: List[PortfolioPosition]) -> RiskMetrics:
    """Calculate portfolio risk metrics"""
    try:
        risk_metrics = await risk_manager.calculate_portfolio_risk(positions)
        return risk_metrics
        
    except Exception as e:
        logger.error(f"Error calculating portfolio risk: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/backtest")
async def run_backtest(
    symbols: List[str],
    start_date: str,
    end_date: str,
    initial_capital: float = 10000
) -> BacktestResult:
    """Run backtesting simulation"""
    try:
        result = await backtest_engine.run_backtest(
            symbols, start_date, end_date, initial_capital
        )
        return result
        
    except Exception as e:
        logger.error(f"Error running backtest: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trading-performance")
async def get_trading_performance():
    """Get overall trading performance metrics"""
    try:
        # Mock performance data
        return {
            "total_return": np.random.uniform(-0.1, 0.3),
            "daily_return": np.random.uniform(-0.02, 0.02),
            "weekly_return": np.random.uniform(-0.05, 0.05),
            "monthly_return": np.random.uniform(-0.15, 0.15),
            "sharpe_ratio": np.random.uniform(0.5, 2.5),
            "win_rate": np.random.uniform(0.45, 0.75),
            "total_trades": np.random.randint(50, 200),
            "active_positions": np.random.randint(5, 25),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting trading performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
