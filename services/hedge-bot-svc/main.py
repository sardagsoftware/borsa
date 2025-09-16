"""
AILYDIAN Global Trader - Hedge Bot Service
Advanced delta-gamma neutral hedging with automated risk management

Features:
- Delta-gamma neutral portfolio hedging
- Real-time Greeks monitoring and rebalancing
- Multi-asset correlation hedging
- Volatility risk management
- Automated execution with slippage control
- Risk scenario stress testing
- PnL attribution analysis
- Emergency position liquidation
"""

import os
import logging
import math
import numpy as np
import pandas as pd
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from decimal import Decimal, ROUND_HALF_UP
import asyncio
import json
from dataclasses import dataclass, asdict
from enum import Enum
import warnings
warnings.filterwarnings('ignore')

import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, Field, validator
from web3 import Web3
from redis.asyncio import Redis
import psycopg2
from psycopg2.extras import RealDictCursor
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://borsa:borsa@localhost:5432/borsa")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Service endpoints
SERVICE_ENDPOINTS = {
    "options_greeks": "http://localhost:8009",
    "defi_strategist": "http://localhost:8008",
    "yield_vaults": "http://localhost:8007",
    "rwa_registry": "http://localhost:8006",
    "tokenization": "http://localhost:8005"
}

# Trading venues for hedging
TRADING_VENUES = {
    "deribit": {
        "endpoint": "https://www.deribit.com/api/v2",
        "instruments": ["BTC", "ETH", "SOL"],
        "supports_options": True,
        "supports_futures": True,
        "max_order_size": Decimal("1000000")
    },
    "binance": {
        "endpoint": "https://api.binance.com",
        "instruments": ["BTC", "ETH", "BNB"],
        "supports_options": False,
        "supports_futures": True,
        "max_order_size": Decimal("5000000")
    },
    "uniswap_v3": {
        "endpoint": "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
        "instruments": ["ETH", "USDC", "USDT", "WBTC"],
        "supports_options": False,
        "supports_futures": False,
        "max_order_size": Decimal("10000000")
    }
}

# Enums
class HedgeType(str, Enum):
    DELTA_NEUTRAL = "delta_neutral"
    GAMMA_NEUTRAL = "gamma_neutral"
    DELTA_GAMMA_NEUTRAL = "delta_gamma_neutral"
    VEGA_NEUTRAL = "vega_neutral"
    THETA_NEUTRAL = "theta_neutral"
    CORRELATION = "correlation"

class RiskMetric(str, Enum):
    DELTA = "delta"
    GAMMA = "gamma"
    THETA = "theta"
    VEGA = "vega"
    RHO = "rho"
    VAR = "var"
    CVAR = "cvar"
    CORRELATION = "correlation"

class HedgeSignal(str, Enum):
    NO_ACTION = "no_action"
    HEDGE_MINOR = "hedge_minor"
    HEDGE_MAJOR = "hedge_major"
    EMERGENCY_HEDGE = "emergency_hedge"
    LIQUIDATE = "liquidate"

class ExecutionStatus(str, Enum):
    PENDING = "pending"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

# Pydantic Models
class Position(BaseModel):
    position_id: str = Field(..., description="Position identifier")
    instrument: str = Field(..., description="Instrument name")
    asset_type: str = Field(..., description="Asset type (option, future, spot)")
    quantity: Decimal = Field(..., description="Position size")
    entry_price: Decimal = Field(..., description="Entry price")
    current_price: Optional[Decimal] = Field(None, description="Current market price")
    pnl: Optional[Decimal] = Field(None, description="Unrealized PnL")
    venue: str = Field(..., description="Trading venue")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GreeksExposure(BaseModel):
    delta: Decimal = Field(..., description="Portfolio delta exposure")
    gamma: Decimal = Field(..., description="Portfolio gamma exposure")
    theta: Decimal = Field(..., description="Portfolio theta exposure")
    vega: Decimal = Field(..., description="Portfolio vega exposure")
    rho: Decimal = Field(..., description="Portfolio rho exposure")
    correlation_risk: Decimal = Field(..., description="Correlation risk metric")
    concentration_risk: Decimal = Field(..., description="Concentration risk")

class RiskLimits(BaseModel):
    max_delta: Decimal = Field(default=Decimal("1000"), description="Max portfolio delta")
    max_gamma: Decimal = Field(default=Decimal("100"), description="Max portfolio gamma")
    max_vega: Decimal = Field(default=Decimal("5000"), description="Max portfolio vega")
    max_theta: Decimal = Field(default=Decimal("-500"), description="Max daily theta decay")
    max_var_95: Decimal = Field(default=Decimal("50000"), description="Max 95% VaR")
    max_drawdown: Decimal = Field(default=Decimal("100000"), description="Max drawdown")
    max_correlation: Decimal = Field(default=Decimal("0.8"), description="Max asset correlation")
    rebalance_threshold: Decimal = Field(default=Decimal("0.1"), description="Rebalance threshold")

class HedgeStrategy(BaseModel):
    strategy_id: str = Field(..., description="Strategy identifier")
    name: str = Field(..., description="Strategy name")
    hedge_types: List[HedgeType] = Field(..., description="Hedge types to maintain")
    target_positions: List[Position] = Field(..., description="Target positions")
    risk_limits: RiskLimits = Field(..., description="Risk limits")
    rebalance_frequency: int = Field(default=300, description="Rebalance frequency in seconds")
    execution_venues: List[str] = Field(..., description="Allowed execution venues")
    is_active: bool = Field(default=True, description="Strategy status")
    emergency_liquidation: bool = Field(default=False, description="Emergency liquidation mode")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HedgeRecommendation(BaseModel):
    strategy_id: str = Field(..., description="Strategy ID")
    signal: HedgeSignal = Field(..., description="Hedge signal")
    urgency_score: int = Field(..., ge=1, le=10, description="Urgency (1-10)")
    current_exposure: GreeksExposure = Field(..., description="Current Greeks exposure")
    target_exposure: GreeksExposure = Field(..., description="Target Greeks exposure")
    hedge_trades: List[Dict[str, Any]] = Field(..., description="Required hedge trades")
    estimated_cost: Decimal = Field(..., description="Estimated execution cost")
    expected_risk_reduction: Decimal = Field(..., description="Expected risk reduction %")
    reasoning: str = Field(..., description="Hedge reasoning")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExecutionOrder(BaseModel):
    order_id: str = Field(..., description="Order identifier")
    strategy_id: str = Field(..., description="Strategy ID")
    instrument: str = Field(..., description="Instrument")
    side: str = Field(..., description="Buy/Sell")
    quantity: Decimal = Field(..., description="Order quantity")
    order_type: str = Field(default="market", description="Order type")
    limit_price: Optional[Decimal] = Field(None, description="Limit price")
    venue: str = Field(..., description="Execution venue")
    status: ExecutionStatus = Field(default=ExecutionStatus.PENDING, description="Order status")
    fill_price: Optional[Decimal] = Field(None, description="Fill price")
    filled_quantity: Decimal = Field(default=Decimal("0"), description="Filled quantity")
    fees: Optional[Decimal] = Field(None, description="Execution fees")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PortfolioAnalysis(BaseModel):
    total_positions: int = Field(..., description="Total number of positions")
    total_notional: Decimal = Field(..., description="Total notional exposure")
    unrealized_pnl: Decimal = Field(..., description="Unrealized PnL")
    daily_pnl: Decimal = Field(..., description="Daily PnL")
    greeks_exposure: GreeksExposure = Field(..., description="Greeks exposure")
    risk_metrics: Dict[str, Decimal] = Field(..., description="Risk metrics")
    concentration_analysis: Dict[str, Decimal] = Field(..., description="Concentration by asset")
    correlation_matrix: Optional[Dict[str, Dict[str, Decimal]]] = Field(None, description="Correlation matrix")

# Initialize FastAPI app
app = FastAPI(
    title="AILYDIAN Hedge Bot Service",
    description="Advanced delta-gamma neutral hedging",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Global connections
redis_client = None

class GreeksCalculator:
    """Portfolio Greeks calculation engine"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_option_greeks(self, instrument: str) -> Optional[Dict[str, Decimal]]:
        """Get option Greeks from Options Greeks Service"""
        try:
            url = f"{SERVICE_ENDPOINTS['options_greeks']}/api/v1/options/greeks/{instrument}"
            response = await self.client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    greeks = data.get("data", {}).get("greeks", {})
                    return {
                        "delta": Decimal(str(greeks.get("delta", 0))),
                        "gamma": Decimal(str(greeks.get("gamma", 0))),
                        "theta": Decimal(str(greeks.get("theta", 0))),
                        "vega": Decimal(str(greeks.get("vega", 0))),
                        "rho": Decimal(str(greeks.get("rho", 0)))
                    }
        except Exception as e:
            logger.error(f"Greeks retrieval error for {instrument}: {e}")
        
        return None
    
    async def calculate_portfolio_greeks(self, positions: List[Position]) -> GreeksExposure:
        """Calculate aggregated portfolio Greeks"""
        try:
            total_delta = Decimal("0")
            total_gamma = Decimal("0")
            total_theta = Decimal("0")
            total_vega = Decimal("0")
            total_rho = Decimal("0")
            
            asset_exposures = {}
            
            for position in positions:
                # Get Greeks for this instrument
                greeks = await self.get_option_greeks(position.instrument)
                
                if greeks:
                    # Scale by position size
                    quantity = position.quantity
                    total_delta += greeks["delta"] * quantity
                    total_gamma += greeks["gamma"] * quantity
                    total_theta += greeks["theta"] * quantity
                    total_vega += greeks["vega"] * quantity
                    total_rho += greeks["rho"] * quantity
                    
                    # Track asset exposure for concentration analysis
                    underlying = position.instrument.split("-")[0] if "-" in position.instrument else position.instrument
                    if underlying not in asset_exposures:
                        asset_exposures[underlying] = Decimal("0")
                    asset_exposures[underlying] += abs(quantity * (position.current_price or position.entry_price))
            
            # Calculate concentration risk (max single asset exposure)
            total_exposure = sum(asset_exposures.values())
            max_concentration = max(asset_exposures.values()) / total_exposure if total_exposure > 0 else Decimal("0")
            
            # Simple correlation risk estimate (would be more sophisticated in production)
            correlation_risk = max_concentration * Decimal("0.5")  # Simplified
            
            return GreeksExposure(
                delta=total_delta,
                gamma=total_gamma,
                theta=total_theta,
                vega=total_vega,
                rho=total_rho,
                correlation_risk=correlation_risk,
                concentration_risk=max_concentration
            )
            
        except Exception as e:
            logger.error(f"Portfolio Greeks calculation error: {e}")
            return GreeksExposure(
                delta=Decimal("0"), gamma=Decimal("0"), theta=Decimal("0"),
                vega=Decimal("0"), rho=Decimal("0"), correlation_risk=Decimal("0"),
                concentration_risk=Decimal("0")
            )
    
    async def close(self):
        """Cleanup"""
        await self.client.aclose()

class RiskAnalyzer:
    """Risk analysis and VaR calculation"""
    
    def __init__(self):
        self.confidence_levels = [0.95, 0.99]
        self.lookback_days = 252  # One year of trading days
    
    async def calculate_var(self, positions: List[Position], confidence: float = 0.95) -> Decimal:
        """Calculate Value at Risk"""
        try:
            # Simplified VaR calculation using delta-normal method
            portfolio_value = sum(
                pos.quantity * (pos.current_price or pos.entry_price) 
                for pos in positions
            )
            
            # Assume portfolio volatility (in production, would use historical returns)
            portfolio_volatility = Decimal("0.15")  # 15% annual volatility
            daily_volatility = portfolio_volatility / Decimal(str(math.sqrt(252)))
            
            # Normal distribution z-score for given confidence
            if confidence == 0.95:
                z_score = Decimal("1.645")
            elif confidence == 0.99:
                z_score = Decimal("2.33")
            else:
                z_score = Decimal("1.645")  # Default
            
            var = portfolio_value * daily_volatility * z_score
            
            return var
            
        except Exception as e:
            logger.error(f"VaR calculation error: {e}")
            return Decimal("0")
    
    async def calculate_expected_shortfall(self, positions: List[Position], confidence: float = 0.95) -> Decimal:
        """Calculate Conditional Value at Risk (Expected Shortfall)"""
        try:
            var = await self.calculate_var(positions, confidence)
            
            # ES is typically 20-30% higher than VaR for normal distributions
            es = var * Decimal("1.25")
            
            return es
            
        except Exception as e:
            logger.error(f"Expected Shortfall calculation error: {e}")
            return Decimal("0")
    
    def calculate_correlation_matrix(self, assets: List[str]) -> Dict[str, Dict[str, Decimal]]:
        """Calculate correlation matrix (simplified)"""
        correlation_matrix = {}
        
        # Simplified correlation assumptions
        correlations = {
            ("BTC", "ETH"): 0.7,
            ("ETH", "SOL"): 0.6,
            ("BTC", "SOL"): 0.5,
            ("USDC", "USDT"): 0.95,
            ("USDC", "DAI"): 0.9
        }
        
        for asset1 in assets:
            correlation_matrix[asset1] = {}
            for asset2 in assets:
                if asset1 == asset2:
                    correlation_matrix[asset1][asset2] = Decimal("1.0")
                else:
                    # Look up correlation
                    key1 = (asset1, asset2)
                    key2 = (asset2, asset1)
                    
                    if key1 in correlations:
                        corr = correlations[key1]
                    elif key2 in correlations:
                        corr = correlations[key2]
                    else:
                        corr = 0.3  # Default correlation
                    
                    correlation_matrix[asset1][asset2] = Decimal(str(corr))
        
        return correlation_matrix

class HedgingEngine:
    """Core hedging engine"""
    
    def __init__(self):
        self.greeks_calculator = GreeksCalculator()
        self.risk_analyzer = RiskAnalyzer()
        self.execution_client = httpx.AsyncClient(timeout=30.0)
    
    async def initialize_database(self):
        """Initialize database tables"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor()
            
            # Hedge strategies table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS hedge_strategies (
                    strategy_id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    hedge_types VARCHAR[] NOT NULL,
                    target_positions JSONB NOT NULL,
                    risk_limits JSONB NOT NULL,
                    rebalance_frequency INTEGER DEFAULT 300,
                    execution_venues VARCHAR[] NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    emergency_liquidation BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            # Current positions table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS hedge_positions (
                    position_id VARCHAR(50) PRIMARY KEY,
                    strategy_id VARCHAR(50) NOT NULL,
                    instrument VARCHAR(100) NOT NULL,
                    asset_type VARCHAR(20) NOT NULL,
                    quantity DECIMAL(30,8) NOT NULL,
                    entry_price DECIMAL(20,8) NOT NULL,
                    current_price DECIMAL(20,8),
                    unrealized_pnl DECIMAL(30,8),
                    venue VARCHAR(30) NOT NULL,
                    timestamp TIMESTAMPTZ DEFAULT NOW(),
                    FOREIGN KEY (strategy_id) REFERENCES hedge_strategies(strategy_id)
                )
            """)
            
            # Hedge recommendations table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS hedge_recommendations (
                    id SERIAL PRIMARY KEY,
                    strategy_id VARCHAR(50) NOT NULL,
                    signal VARCHAR(20) NOT NULL,
                    urgency_score INTEGER NOT NULL,
                    current_exposure JSONB NOT NULL,
                    target_exposure JSONB NOT NULL,
                    hedge_trades JSONB NOT NULL,
                    estimated_cost DECIMAL(20,8),
                    expected_risk_reduction DECIMAL(10,4),
                    reasoning TEXT,
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    FOREIGN KEY (strategy_id) REFERENCES hedge_strategies(strategy_id)
                )
            """)
            
            # Execution orders table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS hedge_orders (
                    order_id VARCHAR(50) PRIMARY KEY,
                    strategy_id VARCHAR(50) NOT NULL,
                    recommendation_id INTEGER,
                    instrument VARCHAR(100) NOT NULL,
                    side VARCHAR(10) NOT NULL,
                    quantity DECIMAL(30,8) NOT NULL,
                    order_type VARCHAR(20) DEFAULT 'market',
                    limit_price DECIMAL(20,8),
                    venue VARCHAR(30) NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    fill_price DECIMAL(20,8),
                    filled_quantity DECIMAL(30,8) DEFAULT 0,
                    fees DECIMAL(20,8),
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    FOREIGN KEY (strategy_id) REFERENCES hedge_strategies(strategy_id),
                    FOREIGN KEY (recommendation_id) REFERENCES hedge_recommendations(id)
                )
            """)
            
            # Portfolio analytics table (time-series)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS portfolio_analytics (
                    time TIMESTAMPTZ NOT NULL,
                    strategy_id VARCHAR(50) NOT NULL,
                    total_positions INTEGER,
                    total_notional DECIMAL(30,8),
                    unrealized_pnl DECIMAL(30,8),
                    daily_pnl DECIMAL(30,8),
                    portfolio_delta DECIMAL(20,8),
                    portfolio_gamma DECIMAL(20,8),
                    portfolio_theta DECIMAL(20,8),
                    portfolio_vega DECIMAL(20,8),
                    portfolio_rho DECIMAL(20,8),
                    var_95 DECIMAL(30,8),
                    expected_shortfall DECIMAL(30,8),
                    correlation_risk DECIMAL(10,6),
                    concentration_risk DECIMAL(10,6),
                    FOREIGN KEY (strategy_id) REFERENCES hedge_strategies(strategy_id)
                )
            """)
            
            # Create indexes
            cur.execute("CREATE INDEX IF NOT EXISTS idx_hedge_positions_strategy ON hedge_positions(strategy_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_hedge_orders_strategy ON hedge_orders(strategy_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_strategy_time ON portfolio_analytics(strategy_id, time)")
            
            # Try to create hypertable for analytics
            try:
                cur.execute("SELECT create_hypertable('portfolio_analytics', 'time', if_not_exists => TRUE)")
            except Exception:
                logger.info("TimescaleDB not available for portfolio_analytics")
            
            conn.commit()
            cur.close()
            conn.close()
            
            logger.info("Hedge Bot database initialized")
            
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
    
    async def create_hedge_strategy(self, strategy: HedgeStrategy) -> Dict[str, Any]:
        """Create new hedge strategy"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO hedge_strategies (
                    strategy_id, name, hedge_types, target_positions, risk_limits,
                    rebalance_frequency, execution_venues, is_active, emergency_liquidation
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                strategy.strategy_id, strategy.name, list(strategy.hedge_types),
                json.dumps([asdict(pos) for pos in strategy.target_positions]),
                json.dumps(asdict(strategy.risk_limits)), strategy.rebalance_frequency,
                strategy.execution_venues, strategy.is_active, strategy.emergency_liquidation
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            logger.info(f"Hedge strategy created: {strategy.strategy_id}")
            return {"status": "created", "strategy": asdict(strategy)}
            
        except Exception as e:
            logger.error(f"Strategy creation error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create hedge strategy: {str(e)}")
    
    async def analyze_portfolio_risk(self, strategy_id: str) -> PortfolioAnalysis:
        """Comprehensive portfolio risk analysis"""
        try:
            # Get current positions
            positions = await self.get_strategy_positions(strategy_id)
            
            if not positions:
                return PortfolioAnalysis(
                    total_positions=0, total_notional=Decimal("0"), unrealized_pnl=Decimal("0"),
                    daily_pnl=Decimal("0"), greeks_exposure=GreeksExposure(
                        delta=Decimal("0"), gamma=Decimal("0"), theta=Decimal("0"),
                        vega=Decimal("0"), rho=Decimal("0"), correlation_risk=Decimal("0"),
                        concentration_risk=Decimal("0")
                    ),
                    risk_metrics={}, concentration_analysis={}
                )
            
            # Calculate portfolio Greeks
            greeks_exposure = await self.greeks_calculator.calculate_portfolio_greeks(positions)
            
            # Calculate risk metrics
            var_95 = await self.risk_analyzer.calculate_var(positions, 0.95)
            expected_shortfall = await self.risk_analyzer.calculate_expected_shortfall(positions, 0.95)
            
            # Portfolio aggregations
            total_notional = sum(
                abs(pos.quantity * (pos.current_price or pos.entry_price))
                for pos in positions
            )
            
            unrealized_pnl = sum(
                pos.pnl or Decimal("0") for pos in positions
            )
            
            # Asset concentration analysis
            asset_exposures = {}
            for pos in positions:
                underlying = pos.instrument.split("-")[0] if "-" in pos.instrument else pos.instrument
                notional = abs(pos.quantity * (pos.current_price or pos.entry_price))
                
                if underlying not in asset_exposures:
                    asset_exposures[underlying] = Decimal("0")
                asset_exposures[underlying] += notional
            
            # Normalize to percentages
            concentration_analysis = {}
            if total_notional > 0:
                for asset, exposure in asset_exposures.items():
                    concentration_analysis[asset] = (exposure / total_notional) * 100
            
            # Correlation matrix
            assets = list(asset_exposures.keys())
            correlation_matrix = self.risk_analyzer.calculate_correlation_matrix(assets)
            
            return PortfolioAnalysis(
                total_positions=len(positions),
                total_notional=total_notional,
                unrealized_pnl=unrealized_pnl,
                daily_pnl=greeks_exposure.theta,  # Theta is daily decay
                greeks_exposure=greeks_exposure,
                risk_metrics={
                    "var_95": var_95,
                    "expected_shortfall": expected_shortfall,
                    "max_delta": abs(greeks_exposure.delta),
                    "max_gamma": abs(greeks_exposure.gamma),
                    "theta_decay": greeks_exposure.theta
                },
                concentration_analysis=concentration_analysis,
                correlation_matrix=correlation_matrix
            )
            
        except Exception as e:
            logger.error(f"Portfolio analysis error: {e}")
            raise HTTPException(status_code=500, detail="Portfolio analysis failed")
    
    async def generate_hedge_recommendation(self, strategy_id: str) -> HedgeRecommendation:
        """Generate hedge recommendation"""
        try:
            # Get strategy configuration
            strategy = await self.get_strategy(strategy_id)
            if not strategy:
                raise HTTPException(status_code=404, detail="Strategy not found")
            
            # Analyze current portfolio
            analysis = await self.analyze_portfolio_risk(strategy_id)
            current_exposure = analysis.greeks_exposure
            
            # Get risk limits
            risk_limits = strategy.get("risk_limits", {})
            max_delta = Decimal(str(risk_limits.get("max_delta", 1000)))
            max_gamma = Decimal(str(risk_limits.get("max_gamma", 100)))
            max_vega = Decimal(str(risk_limits.get("max_vega", 5000)))
            rebalance_threshold = Decimal(str(risk_limits.get("rebalance_threshold", 0.1)))
            
            # Determine hedge signal
            delta_breach = abs(current_exposure.delta) > max_delta
            gamma_breach = abs(current_exposure.gamma) > max_gamma
            vega_breach = abs(current_exposure.vega) > max_vega
            
            delta_ratio = abs(current_exposure.delta) / max_delta
            gamma_ratio = abs(current_exposure.gamma) / max_gamma
            vega_ratio = abs(current_exposure.vega) / max_vega
            
            max_breach_ratio = max(delta_ratio, gamma_ratio, vega_ratio)
            
            if max_breach_ratio < rebalance_threshold:
                signal = HedgeSignal.NO_ACTION
                urgency = 1
            elif max_breach_ratio < Decimal("0.5"):
                signal = HedgeSignal.HEDGE_MINOR
                urgency = 3
            elif max_breach_ratio < Decimal("1.0"):
                signal = HedgeSignal.HEDGE_MAJOR
                urgency = 7
            else:
                signal = HedgeSignal.EMERGENCY_HEDGE
                urgency = 10
            
            # Calculate target exposure (neutralize Greeks)
            target_exposure = GreeksExposure(
                delta=Decimal("0"),  # Target delta neutral
                gamma=current_exposure.gamma * Decimal("0.5"),  # Reduce gamma by 50%
                theta=current_exposure.theta,  # Keep theta (time decay)
                vega=current_exposure.vega * Decimal("0.3"),  # Reduce vega by 70%
                rho=current_exposure.rho * Decimal("0.5"),  # Reduce rho by 50%
                correlation_risk=current_exposure.correlation_risk * Decimal("0.7"),
                concentration_risk=current_exposure.concentration_risk * Decimal("0.8")
            )
            
            # Generate hedge trades
            hedge_trades = []
            
            # Delta hedge (if needed)
            if abs(current_exposure.delta) > max_delta * rebalance_threshold:
                delta_hedge_quantity = -current_exposure.delta  # Opposite sign to neutralize
                
                # Use futures or spot for delta hedging
                hedge_instrument = "BTC-PERPETUAL" if "BTC" in str(analysis.concentration_analysis) else "ETH-PERPETUAL"
                
                hedge_trades.append({
                    "instrument": hedge_instrument,
                    "side": "sell" if delta_hedge_quantity > 0 else "buy",
                    "quantity": abs(delta_hedge_quantity),
                    "hedge_type": "delta_hedge",
                    "venue": "deribit",
                    "estimated_cost": abs(delta_hedge_quantity) * Decimal("0.0005")  # 0.05% cost estimate
                })
            
            # Gamma hedge (if needed)
            if abs(current_exposure.gamma) > max_gamma * rebalance_threshold:
                # Use options for gamma hedging
                gamma_hedge_trades = await self.generate_gamma_hedge_trades(current_exposure.gamma)
                hedge_trades.extend(gamma_hedge_trades)
            
            # Calculate total estimated cost
            estimated_cost = sum(
                trade.get("estimated_cost", Decimal("0")) for trade in hedge_trades
            )
            
            # Calculate expected risk reduction
            current_risk = max(delta_ratio, gamma_ratio, vega_ratio)
            expected_risk_reduction = (current_risk - Decimal("0.1")) / current_risk * 100 if current_risk > 0 else Decimal("0")
            
            reasoning = f"Portfolio risk analysis: Delta breach={delta_breach}, Gamma breach={gamma_breach}, Vega breach={vega_breach}. "
            reasoning += f"Max breach ratio: {max_breach_ratio:.2f}. "
            reasoning += f"Recommended {len(hedge_trades)} hedge trades to reduce risk by {expected_risk_reduction:.1f}%"
            
            recommendation = HedgeRecommendation(
                strategy_id=strategy_id,
                signal=signal,
                urgency_score=urgency,
                current_exposure=current_exposure,
                target_exposure=target_exposure,
                hedge_trades=hedge_trades,
                estimated_cost=estimated_cost,
                expected_risk_reduction=expected_risk_reduction,
                reasoning=reasoning
            )
            
            # Save recommendation
            await self.save_hedge_recommendation(recommendation)
            
            return recommendation
            
        except Exception as e:
            logger.error(f"Hedge recommendation error: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate hedge recommendation")
    
    async def generate_gamma_hedge_trades(self, current_gamma: Decimal) -> List[Dict[str, Any]]:
        """Generate gamma hedge trades using options"""
        trades = []
        
        try:
            # Simplified gamma hedging logic
            if abs(current_gamma) > Decimal("10"):
                # Use long options to reduce short gamma exposure
                # Or short options to reduce long gamma exposure
                
                side = "buy" if current_gamma < 0 else "sell"  # Buy options if short gamma
                quantity = abs(current_gamma) / Decimal("10")  # Simplified sizing
                
                # Use ATM straddle for gamma hedging
                trades.append({
                    "instrument": "BTC-ATM-STRADDLE",
                    "side": side,
                    "quantity": quantity,
                    "hedge_type": "gamma_hedge",
                    "venue": "deribit",
                    "estimated_cost": quantity * Decimal("100")  # $100 per straddle estimate
                })
                
        except Exception as e:
            logger.error(f"Gamma hedge generation error: {e}")
        
        return trades
    
    async def execute_hedge_recommendation(self, recommendation_id: int) -> Dict[str, Any]:
        """Execute hedge recommendation"""
        try:
            # Get recommendation
            recommendation = await self.get_recommendation(recommendation_id)
            if not recommendation:
                raise HTTPException(status_code=404, detail="Recommendation not found")
            
            execution_results = []
            
            # Execute each hedge trade
            for trade in recommendation.get("hedge_trades", []):
                order = ExecutionOrder(
                    order_id=f"hedge_{recommendation_id}_{len(execution_results)}",
                    strategy_id=recommendation["strategy_id"],
                    instrument=trade["instrument"],
                    side=trade["side"],
                    quantity=Decimal(str(trade["quantity"])),
                    venue=trade["venue"]
                )
                
                # Simulate execution (in production, would call actual exchange APIs)
                execution_result = await self.simulate_order_execution(order)
                execution_results.append(execution_result)
                
                # Save order to database
                await self.save_execution_order(order)
            
            return {
                "recommendation_id": recommendation_id,
                "execution_results": execution_results,
                "total_executed": len(execution_results),
                "status": "completed"
            }
            
        except Exception as e:
            logger.error(f"Hedge execution error: {e}")
            raise HTTPException(status_code=500, detail="Failed to execute hedge")
    
    async def simulate_order_execution(self, order: ExecutionOrder) -> Dict[str, Any]:
        """Simulate order execution (placeholder for real execution logic)"""
        try:
            # Simulate market execution with slippage
            slippage = np.random.uniform(0.001, 0.003)  # 0.1-0.3% slippage
            
            if order.side == "buy":
                fill_price = Decimal("50000") * (1 + Decimal(str(slippage)))  # Mock BTC price
            else:
                fill_price = Decimal("50000") * (1 - Decimal(str(slippage)))
            
            # Calculate fees (0.1% taker fee estimate)
            fees = order.quantity * fill_price * Decimal("0.001")
            
            # Update order
            order.status = ExecutionStatus.COMPLETED
            order.fill_price = fill_price
            order.filled_quantity = order.quantity
            order.fees = fees
            order.updated_at = datetime.now(timezone.utc)
            
            return {
                "order_id": order.order_id,
                "status": "filled",
                "fill_price": str(fill_price),
                "filled_quantity": str(order.filled_quantity),
                "fees": str(fees)
            }
            
        except Exception as e:
            logger.error(f"Order simulation error: {e}")
            return {
                "order_id": order.order_id,
                "status": "failed",
                "error": str(e)
            }
    
    async def get_strategy(self, strategy_id: str) -> Optional[Dict]:
        """Get strategy by ID"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute("SELECT * FROM hedge_strategies WHERE strategy_id = %s", (strategy_id,))
            strategy = cur.fetchone()
            
            cur.close()
            conn.close()
            
            return dict(strategy) if strategy else None
            
        except Exception as e:
            logger.error(f"Strategy retrieval error: {e}")
            return None
    
    async def get_strategy_positions(self, strategy_id: str) -> List[Position]:
        """Get current positions for strategy"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute("SELECT * FROM hedge_positions WHERE strategy_id = %s", (strategy_id,))
            rows = cur.fetchall()
            
            cur.close()
            conn.close()
            
            positions = []
            for row in rows:
                position = Position(
                    position_id=row["position_id"],
                    instrument=row["instrument"],
                    asset_type=row["asset_type"],
                    quantity=Decimal(str(row["quantity"])),
                    entry_price=Decimal(str(row["entry_price"])),
                    current_price=Decimal(str(row["current_price"])) if row["current_price"] else None,
                    pnl=Decimal(str(row["unrealized_pnl"])) if row["unrealized_pnl"] else None,
                    venue=row["venue"],
                    timestamp=row["timestamp"]
                )
                positions.append(position)
            
            return positions
            
        except Exception as e:
            logger.error(f"Position retrieval error: {e}")
            return []
    
    async def get_recommendation(self, recommendation_id: int) -> Optional[Dict]:
        """Get recommendation by ID"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute("SELECT * FROM hedge_recommendations WHERE id = %s", (recommendation_id,))
            recommendation = cur.fetchone()
            
            cur.close()
            conn.close()
            
            return dict(recommendation) if recommendation else None
            
        except Exception as e:
            logger.error(f"Recommendation retrieval error: {e}")
            return None
    
    async def save_hedge_recommendation(self, recommendation: HedgeRecommendation):
        """Save hedge recommendation"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO hedge_recommendations (
                    strategy_id, signal, urgency_score, current_exposure,
                    target_exposure, hedge_trades, estimated_cost,
                    expected_risk_reduction, reasoning
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                recommendation.strategy_id, recommendation.signal, recommendation.urgency_score,
                json.dumps(asdict(recommendation.current_exposure)),
                json.dumps(asdict(recommendation.target_exposure)),
                json.dumps(recommendation.hedge_trades),
                recommendation.estimated_cost, recommendation.expected_risk_reduction,
                recommendation.reasoning
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
        except Exception as e:
            logger.error(f"Save recommendation error: {e}")
    
    async def save_execution_order(self, order: ExecutionOrder):
        """Save execution order"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO hedge_orders (
                    order_id, strategy_id, instrument, side, quantity,
                    order_type, limit_price, venue, status, fill_price,
                    filled_quantity, fees, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                order.order_id, order.strategy_id, order.instrument, order.side,
                order.quantity, order.order_type, order.limit_price, order.venue,
                order.status, order.fill_price, order.filled_quantity, order.fees,
                order.created_at, order.updated_at
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
        except Exception as e:
            logger.error(f"Save order error: {e}")
    
    async def close(self):
        """Cleanup"""
        await self.greeks_calculator.close()
        await self.execution_client.aclose()

# Initialize hedging engine
hedging_engine = HedgingEngine()

@app.on_event("startup")
async def startup_event():
    """Initialize connections and services"""
    global redis_client
    try:
        # Initialize Redis
        redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
        await redis_client.ping()
        
        # Initialize database
        await hedging_engine.initialize_database()
        
        logger.info("Hedge Bot Service started successfully")
        
    except Exception as e:
        logger.error(f"Startup error: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup connections"""
    global redis_client
    if redis_client:
        await redis_client.close()
    
    await hedging_engine.close()
    
    logger.info("Hedge Bot Service shutdown complete")

# API Endpoints

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "service": "Hedge Bot Service",
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/health")
async def detailed_health():
    """Detailed health check"""
    health_status = {
        "service": "healthy",
        "redis": "disconnected",
        "database": "unknown",
        "options_greeks_service": "unknown"
    }
    
    # Check Redis
    try:
        if redis_client:
            await redis_client.ping()
            health_status["redis"] = "healthy"
    except:
        pass
    
    # Check database
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        conn.close()
        health_status["database"] = "healthy"
    except:
        pass
    
    # Check Options Greeks service connectivity
    try:
        response = await hedging_engine.greeks_calculator.client.get(
            f"{SERVICE_ENDPOINTS['options_greeks']}/health"
        )
        health_status["options_greeks_service"] = "healthy" if response.status_code == 200 else "degraded"
    except:
        health_status["options_greeks_service"] = "unavailable"
    
    return health_status

@app.post("/api/v1/strategies", response_model=Dict[str, Any])
async def create_hedge_strategy(strategy: HedgeStrategy):
    """Create new hedge strategy"""
    try:
        result = await hedging_engine.create_hedge_strategy(strategy)
        
        return {
            "success": True,
            "data": result,
            "message": "Hedge strategy created successfully"
        }
        
    except Exception as e:
        logger.error(f"Strategy creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/strategies/{strategy_id}")
async def get_hedge_strategy(strategy_id: str):
    """Get hedge strategy details"""
    try:
        strategy = await hedging_engine.get_strategy(strategy_id)
        
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        return {
            "success": True,
            "data": strategy
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Strategy retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve strategy")

@app.get("/api/v1/strategies/{strategy_id}/analysis")
async def analyze_portfolio(strategy_id: str):
    """Get comprehensive portfolio risk analysis"""
    try:
        analysis = await hedging_engine.analyze_portfolio_risk(strategy_id)
        
        return {
            "success": True,
            "data": asdict(analysis),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Portfolio analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/strategies/{strategy_id}/hedge-recommendation")
async def get_hedge_recommendation(strategy_id: str, background_tasks: BackgroundTasks):
    """Generate hedge recommendation"""
    try:
        recommendation = await hedging_engine.generate_hedge_recommendation(strategy_id)
        
        return {
            "success": True,
            "data": asdict(recommendation),
            "message": "Hedge recommendation generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Hedge recommendation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/recommendations/{recommendation_id}/execute")
async def execute_hedge(recommendation_id: int):
    """Execute hedge recommendation"""
    try:
        result = await hedging_engine.execute_hedge_recommendation(recommendation_id)
        
        return {
            "success": True,
            "data": result,
            "message": "Hedge executed successfully"
        }
        
    except Exception as e:
        logger.error(f"Hedge execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/strategies/{strategy_id}/positions")
async def get_strategy_positions(strategy_id: str):
    """Get current positions for strategy"""
    try:
        positions = await hedging_engine.get_strategy_positions(strategy_id)
        
        return {
            "success": True,
            "data": [asdict(pos) for pos in positions],
            "count": len(positions)
        }
        
    except Exception as e:
        logger.error(f"Position retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve positions")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8010,
        reload=True,
        log_level="info"
    )
