#!/usr/bin/env python3
"""
🐍 AiLydian Financial AI Trader - Python Implementation
Advanced financial trading AI with machine learning capabilities
Global market analysis, risk management, and algorithmic trading
"""

import asyncio
import json
import logging
import numpy as np
import pandas as pd
import yfinance as yf
import requests
import websockets
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import ta
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('financial_ai_trader.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class TradingSignal:
    """Trading signal data structure"""
    symbol: str
    action: str  # BUY, SELL, HOLD
    confidence: float
    price: float
    timestamp: datetime
    reason: str
    risk_level: str
    profit_target: float
    stop_loss: float

@dataclass
class MarketData:
    """Market data structure"""
    symbol: str
    price: float
    volume: int
    change: float
    change_percent: float
    timestamp: datetime
    indicators: Dict

class FinancialAITrader:
    """Advanced Financial AI Trading System"""

    def __init__(self):
        self.name = "AiLydian Financial AI Trader"
        self.version = "2.0.0"
        self.models = {}
        self.scalers = {}
        self.portfolio = {}
        self.risk_limit = 0.02  # 2% risk per trade
        self.max_drawdown = 0.10  # 10% maximum drawdown
        self.websocket_uri = "ws://localhost:3100/ws"

        # Global market symbols
        self.symbols = [
            # US Markets
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK-B',
            # Indices
            '^GSPC', '^DJI', '^IXIC', '^RUT',
            # Forex
            'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X',
            # Crypto
            'BTC-USD', 'ETH-USD', 'ADA-USD', 'BNB-USD',
            # Commodities
            'GC=F', 'SI=F', 'CL=F', 'NG=F'
        ]

        logger.info(f"🐍 {self.name} v{self.version} initialized")

    async def initialize(self):
        """Initialize the trading system"""
        try:
            logger.info("🚀 Initializing Financial AI Trader...")

            # Train models for each symbol
            for symbol in self.symbols[:5]:  # Start with top 5 for demo
                await self.train_model(symbol)

            # Start real-time data collection
            await self.start_real_time_monitoring()

            logger.info("✅ Financial AI Trader initialized successfully")

        except Exception as e:
            logger.error(f"❌ Initialization failed: {e}")
            raise

    async def train_model(self, symbol: str, period: str = "2y"):
        """Train AI model for a specific symbol"""
        try:
            logger.info(f"🤖 Training model for {symbol}...")

            # Fetch historical data
            ticker = yf.Ticker(symbol)
            data = ticker.history(period=period)

            if data.empty:
                logger.warning(f"⚠️ No data available for {symbol}")
                return

            # Calculate technical indicators
            data = self.calculate_technical_indicators(data)

            # Prepare features and targets
            features, targets = self.prepare_ml_features(data)

            if len(features) < 100:  # Need minimum data for training
                logger.warning(f"⚠️ Insufficient data for {symbol}")
                return

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                features, targets, test_size=0.2, shuffle=False
            )

            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)

            # Train ensemble model
            model = GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )

            model.fit(X_train_scaled, y_train)

            # Evaluate model
            y_pred = model.predict(X_test_scaled)
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)

            # Store model and scaler
            self.models[symbol] = model
            self.scalers[symbol] = scaler

            logger.info(f"✅ Model trained for {symbol} - R²: {r2:.4f}, MSE: {mse:.6f}")

        except Exception as e:
            logger.error(f"❌ Model training failed for {symbol}: {e}")

    def calculate_technical_indicators(self, data: pd.DataFrame) -> pd.DataFrame:
        """Calculate comprehensive technical indicators"""
        try:
            # Moving Averages
            data['SMA_20'] = ta.trend.sma_indicator(data['Close'], window=20)
            data['SMA_50'] = ta.trend.sma_indicator(data['Close'], window=50)
            data['EMA_12'] = ta.trend.ema_indicator(data['Close'], window=12)
            data['EMA_26'] = ta.trend.ema_indicator(data['Close'], window=26)

            # MACD
            data['MACD'] = ta.trend.macd(data['Close'])
            data['MACD_signal'] = ta.trend.macd_signal(data['Close'])
            data['MACD_histogram'] = ta.trend.macd_diff(data['Close'])

            # RSI
            data['RSI'] = ta.momentum.rsi(data['Close'], window=14)

            # Bollinger Bands
            data['BB_upper'] = ta.volatility.bollinger_hband(data['Close'])
            data['BB_middle'] = ta.volatility.bollinger_mavg(data['Close'])
            data['BB_lower'] = ta.volatility.bollinger_lband(data['Close'])
            data['BB_width'] = data['BB_upper'] - data['BB_lower']

            # Stochastic
            data['Stoch_K'] = ta.momentum.stoch(data['High'], data['Low'], data['Close'])
            data['Stoch_D'] = ta.momentum.stoch_signal(data['High'], data['Low'], data['Close'])

            # Volume indicators
            data['Volume_SMA'] = ta.volume.volume_sma(data['Close'], data['Volume'])
            data['OBV'] = ta.volume.on_balance_volume(data['Close'], data['Volume'])

            # Volatility indicators
            data['ATR'] = ta.volatility.average_true_range(data['High'], data['Low'], data['Close'])

            # Price action features
            data['Price_Change'] = data['Close'].pct_change()
            data['High_Low_Ratio'] = data['High'] / data['Low']
            data['Volume_Change'] = data['Volume'].pct_change()

            # Market sentiment features
            data['Upper_Shadow'] = data['High'] - np.maximum(data['Open'], data['Close'])
            data['Lower_Shadow'] = np.minimum(data['Open'], data['Close']) - data['Low']
            data['Body_Size'] = np.abs(data['Close'] - data['Open'])

            return data

        except Exception as e:
            logger.error(f"❌ Technical indicator calculation failed: {e}")
            return data

    def prepare_ml_features(self, data: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features and targets for machine learning"""
        try:
            # Feature columns
            feature_columns = [
                'SMA_20', 'SMA_50', 'EMA_12', 'EMA_26',
                'MACD', 'MACD_signal', 'MACD_histogram',
                'RSI', 'BB_width', 'Stoch_K', 'Stoch_D',
                'Volume_SMA', 'ATR', 'Price_Change',
                'High_Low_Ratio', 'Volume_Change',
                'Upper_Shadow', 'Lower_Shadow', 'Body_Size'
            ]

            # Create target (next day's price change)
            data['Target'] = data['Close'].shift(-1) - data['Close']

            # Drop NaN values
            data_clean = data.dropna()

            # Extract features and targets
            features = data_clean[feature_columns].values
            targets = data_clean['Target'].values

            return features, targets

        except Exception as e:
            logger.error(f"❌ Feature preparation failed: {e}")
            return np.array([]), np.array([])

    async def analyze_symbol(self, symbol: str) -> Optional[TradingSignal]:
        """Analyze a symbol and generate trading signal"""
        try:
            # Get current market data
            ticker = yf.Ticker(symbol)
            data = ticker.history(period="60d")

            if data.empty:
                return None

            # Calculate technical indicators
            data = self.calculate_technical_indicators(data)

            # Get latest data point
            latest = data.iloc[-1]
            current_price = latest['Close']

            # Check if model exists
            if symbol not in self.models:
                await self.train_model(symbol)
                if symbol not in self.models:
                    return None

            # Prepare features for prediction
            feature_columns = [
                'SMA_20', 'SMA_50', 'EMA_12', 'EMA_26',
                'MACD', 'MACD_signal', 'MACD_histogram',
                'RSI', 'BB_width', 'Stoch_K', 'Stoch_D',
                'Volume_SMA', 'ATR', 'Price_Change',
                'High_Low_Ratio', 'Volume_Change',
                'Upper_Shadow', 'Lower_Shadow', 'Body_Size'
            ]

            features = latest[feature_columns].values.reshape(1, -1)
            features_scaled = self.scalers[symbol].transform(features)

            # Make prediction
            predicted_change = self.models[symbol].predict(features_scaled)[0]

            # Generate trading signal
            signal = self.generate_trading_signal(
                symbol, current_price, predicted_change, latest
            )

            return signal

        except Exception as e:
            logger.error(f"❌ Analysis failed for {symbol}: {e}")
            return None

    def generate_trading_signal(
        self,
        symbol: str,
        current_price: float,
        predicted_change: float,
        indicators: pd.Series
    ) -> TradingSignal:
        """Generate trading signal based on prediction and indicators"""
        try:
            # Calculate confidence based on multiple factors
            rsi = indicators.get('RSI', 50)
            macd = indicators.get('MACD', 0)
            macd_signal = indicators.get('MACD_signal', 0)
            bb_position = (current_price - indicators.get('BB_lower', current_price)) / \
                         (indicators.get('BB_upper', current_price) - indicators.get('BB_lower', current_price))

            # Determine action
            if predicted_change > current_price * 0.01:  # 1% threshold
                if rsi < 70 and macd > macd_signal:  # Additional confirmation
                    action = "BUY"
                    confidence = min(0.95, abs(predicted_change) / current_price * 100)
                    reason = f"AI predicts +{predicted_change:.4f} price increase with technical confirmation"
                else:
                    action = "HOLD"
                    confidence = 0.5
                    reason = "AI predicts increase but technical indicators show caution"
            elif predicted_change < -current_price * 0.01:  # -1% threshold
                if rsi > 30 and macd < macd_signal:  # Additional confirmation
                    action = "SELL"
                    confidence = min(0.95, abs(predicted_change) / current_price * 100)
                    reason = f"AI predicts {predicted_change:.4f} price decrease with technical confirmation"
                else:
                    action = "HOLD"
                    confidence = 0.5
                    reason = "AI predicts decrease but technical indicators show caution"
            else:
                action = "HOLD"
                confidence = 0.6
                reason = "AI predicts minimal price movement"

            # Calculate risk level
            volatility = indicators.get('ATR', 0) / current_price
            if volatility > 0.05:
                risk_level = "HIGH"
            elif volatility > 0.02:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"

            # Calculate targets and stops
            atr = indicators.get('ATR', current_price * 0.02)
            if action == "BUY":
                profit_target = current_price + (atr * 2)
                stop_loss = current_price - atr
            elif action == "SELL":
                profit_target = current_price - (atr * 2)
                stop_loss = current_price + atr
            else:
                profit_target = current_price
                stop_loss = current_price

            return TradingSignal(
                symbol=symbol,
                action=action,
                confidence=confidence,
                price=current_price,
                timestamp=datetime.now(),
                reason=reason,
                risk_level=risk_level,
                profit_target=profit_target,
                stop_loss=stop_loss
            )

        except Exception as e:
            logger.error(f"❌ Signal generation failed: {e}")
            return TradingSignal(
                symbol=symbol,
                action="HOLD",
                confidence=0.0,
                price=current_price,
                timestamp=datetime.now(),
                reason=f"Error in analysis: {e}",
                risk_level="HIGH",
                profit_target=current_price,
                stop_loss=current_price
            )

    async def get_market_overview(self) -> Dict:
        """Get comprehensive market overview"""
        try:
            overview = {
                'timestamp': datetime.now().isoformat(),
                'indices': {},
                'sectors': {},
                'commodities': {},
                'forex': {},
                'crypto': {},
                'market_sentiment': 'NEUTRAL',
                'volatility_index': 0.0,
                'fear_greed_index': 50
            }

            # Major indices
            indices = ['^GSPC', '^DJI', '^IXIC', '^RUT']
            for index in indices:
                try:
                    ticker = yf.Ticker(index)
                    info = ticker.history(period="2d")
                    if not info.empty:
                        current = info['Close'].iloc[-1]
                        previous = info['Close'].iloc[-2]
                        change = ((current - previous) / previous) * 100

                        overview['indices'][index] = {
                            'price': float(current),
                            'change': float(change),
                            'volume': int(info['Volume'].iloc[-1])
                        }
                except Exception as e:
                    logger.warning(f"Failed to get data for {index}: {e}")

            # Calculate market sentiment
            positive_moves = sum(1 for data in overview['indices'].values() if data['change'] > 0)
            total_moves = len(overview['indices'])

            if total_moves > 0:
                sentiment_ratio = positive_moves / total_moves
                if sentiment_ratio > 0.6:
                    overview['market_sentiment'] = 'BULLISH'
                elif sentiment_ratio < 0.4:
                    overview['market_sentiment'] = 'BEARISH'
                else:
                    overview['market_sentiment'] = 'NEUTRAL'

            return overview

        except Exception as e:
            logger.error(f"❌ Market overview failed: {e}")
            return {}

    async def portfolio_optimization(self, symbols: List[str], investment_amount: float) -> Dict:
        """Optimize portfolio allocation using modern portfolio theory"""
        try:
            logger.info(f"🎯 Optimizing portfolio for {len(symbols)} symbols with ${investment_amount:,.2f}")

            # Get historical data for all symbols
            data = {}
            for symbol in symbols:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="1y")
                if not hist.empty:
                    data[symbol] = hist['Close']

            if len(data) < 2:
                return {'error': 'Insufficient data for optimization'}

            # Calculate returns
            returns_df = pd.DataFrame(data).pct_change().dropna()

            # Calculate expected returns and covariance matrix
            expected_returns = returns_df.mean() * 252  # Annualized
            cov_matrix = returns_df.cov() * 252  # Annualized

            # Simple equal weight optimization (can be enhanced with scipy.optimize)
            num_assets = len(symbols)
            weights = np.array([1.0 / num_assets] * num_assets)

            # Calculate portfolio metrics
            portfolio_return = np.sum(expected_returns * weights)
            portfolio_variance = np.dot(weights.T, np.dot(cov_matrix, weights))
            portfolio_volatility = np.sqrt(portfolio_variance)
            sharpe_ratio = portfolio_return / portfolio_volatility

            # Allocation
            allocation = {}
            for i, symbol in enumerate(symbols):
                allocation[symbol] = {
                    'weight': float(weights[i]),
                    'amount': float(investment_amount * weights[i]),
                    'expected_return': float(expected_returns[symbol])
                }

            return {
                'allocation': allocation,
                'expected_return': float(portfolio_return),
                'volatility': float(portfolio_volatility),
                'sharpe_ratio': float(sharpe_ratio),
                'total_investment': investment_amount
            }

        except Exception as e:
            logger.error(f"❌ Portfolio optimization failed: {e}")
            return {'error': str(e)}

    async def risk_management_check(self, signal: TradingSignal) -> bool:
        """Check if trade passes risk management criteria"""
        try:
            # Check maximum risk per trade
            potential_loss = abs(signal.price - signal.stop_loss)
            risk_percentage = potential_loss / signal.price

            if risk_percentage > self.risk_limit:
                logger.warning(f"⚠️ Trade exceeds risk limit: {risk_percentage:.2%}")
                return False

            # Check confidence threshold
            if signal.confidence < 0.7:
                logger.warning(f"⚠️ Low confidence signal: {signal.confidence:.2f}")
                return False

            # Check portfolio exposure
            # (This would check current portfolio allocation in a real implementation)

            return True

        except Exception as e:
            logger.error(f"❌ Risk management check failed: {e}")
            return False

    async def start_real_time_monitoring(self):
        """Start real-time market monitoring"""
        try:
            logger.info("🔄 Starting real-time market monitoring...")

            while True:
                try:
                    # Analyze top symbols
                    signals = []
                    for symbol in self.symbols[:10]:  # Monitor top 10
                        signal = await self.analyze_symbol(symbol)
                        if signal and signal.action != "HOLD":
                            # Check risk management
                            if await self.risk_management_check(signal):
                                signals.append(signal)

                    # Send signals via WebSocket
                    if signals:
                        await self.send_trading_signals(signals)

                    # Get market overview
                    market_overview = await self.get_market_overview()
                    await self.send_market_update(market_overview)

                    # Wait before next cycle
                    await asyncio.sleep(300)  # 5 minutes

                except Exception as e:
                    logger.error(f"❌ Monitoring cycle failed: {e}")
                    await asyncio.sleep(60)  # Wait 1 minute before retry

        except KeyboardInterrupt:
            logger.info("🛑 Real-time monitoring stopped")
        except Exception as e:
            logger.error(f"❌ Real-time monitoring failed: {e}")

    async def send_trading_signals(self, signals: List[TradingSignal]):
        """Send trading signals via WebSocket"""
        try:
            message = {
                'type': 'trading_signals',
                'timestamp': datetime.now().isoformat(),
                'signals': [
                    {
                        'symbol': signal.symbol,
                        'action': signal.action,
                        'confidence': signal.confidence,
                        'price': signal.price,
                        'reason': signal.reason,
                        'risk_level': signal.risk_level,
                        'profit_target': signal.profit_target,
                        'stop_loss': signal.stop_loss
                    }
                    for signal in signals
                ]
            }

            async with websockets.connect(self.websocket_uri) as websocket:
                await websocket.send(json.dumps(message))
                logger.info(f"📡 Sent {len(signals)} trading signals")

        except Exception as e:
            logger.error(f"❌ Failed to send trading signals: {e}")

    async def send_market_update(self, market_data: Dict):
        """Send market update via WebSocket"""
        try:
            message = {
                'type': 'market_update',
                'data': market_data
            }

            async with websockets.connect(self.websocket_uri) as websocket:
                await websocket.send(json.dumps(message))

        except Exception as e:
            logger.error(f"❌ Failed to send market update: {e}")

    async def backtesting(self, symbol: str, start_date: str, end_date: str) -> Dict:
        """Perform backtesting on historical data"""
        try:
            logger.info(f"📊 Running backtest for {symbol} from {start_date} to {end_date}")

            # Get historical data
            ticker = yf.Ticker(symbol)
            data = ticker.history(start=start_date, end=end_date)

            if data.empty:
                return {'error': 'No historical data available'}

            # Calculate indicators
            data = self.calculate_technical_indicators(data)

            # Simulate trading
            trades = []
            position = 0
            entry_price = 0
            initial_capital = 10000
            capital = initial_capital

            for i in range(len(data) - 1):
                current_row = data.iloc[i]
                next_row = data.iloc[i + 1]

                # Skip if not enough data for indicators
                if pd.isna(current_row['RSI']):
                    continue

                current_price = current_row['Close']
                next_price = next_row['Close']

                # Simple strategy: Buy when RSI < 30, Sell when RSI > 70
                if position == 0 and current_row['RSI'] < 30:  # Buy signal
                    position = capital / current_price
                    entry_price = current_price
                    capital = 0
                    trades.append({
                        'action': 'BUY',
                        'price': current_price,
                        'date': current_row.name,
                        'quantity': position
                    })

                elif position > 0 and current_row['RSI'] > 70:  # Sell signal
                    capital = position * current_price
                    profit = capital - (position * entry_price)
                    trades.append({
                        'action': 'SELL',
                        'price': current_price,
                        'date': current_row.name,
                        'quantity': position,
                        'profit': profit
                    })
                    position = 0

            # Close final position if open
            if position > 0:
                final_price = data['Close'].iloc[-1]
                capital = position * final_price
                profit = capital - (position * entry_price)
                trades.append({
                    'action': 'SELL',
                    'price': final_price,
                    'date': data.index[-1],
                    'quantity': position,
                    'profit': profit
                })

            # Calculate performance metrics
            total_return = ((capital - initial_capital) / initial_capital) * 100
            num_trades = len([t for t in trades if t['action'] == 'SELL'])
            winning_trades = len([t for t in trades if t['action'] == 'SELL' and t.get('profit', 0) > 0])
            win_rate = (winning_trades / num_trades * 100) if num_trades > 0 else 0

            return {
                'symbol': symbol,
                'period': f"{start_date} to {end_date}",
                'initial_capital': initial_capital,
                'final_capital': capital,
                'total_return': total_return,
                'num_trades': num_trades,
                'win_rate': win_rate,
                'trades': trades[-10:]  # Last 10 trades for display
            }

        except Exception as e:
            logger.error(f"❌ Backtesting failed: {e}")
            return {'error': str(e)}

async def main():
    """Main function to run the Financial AI Trader"""
    try:
        logger.info("🚀 Starting AiLydian Financial AI Trader")

        # Initialize trader
        trader = FinancialAITrader()
        await trader.initialize()

        # Start monitoring
        await trader.start_real_time_monitoring()

    except KeyboardInterrupt:
        logger.info("🛑 Financial AI Trader stopped by user")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")

if __name__ == "__main__":
    asyncio.run(main())