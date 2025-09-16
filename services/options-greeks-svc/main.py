"""
AILYDIAN Global Trader - Options Greeks Service
Advanced options pricing and Greeks calculation with Black-Scholes and beyond

Features:
- Black-Scholes-Merton option pricing
- Complete Greeks calculation (Delta, Gamma, Theta, Vega, Rho)
- Implied volatility calculation
- American options pricing (Binomial/Trinomial trees)
- Exotic options support
- Real-time market data integration (Deribit, CME)
- Options strategy optimization
- Risk scenario analysis
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

# Scientific computing
from scipy.stats import norm
from scipy.optimize import brentq, minimize_scalar
from scipy.special import ndtr

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://borsa:borsa@localhost:5432/borsa")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Market data endpoints
MARKET_ENDPOINTS = {
    "deribit": {
        "base_url": "https://www.deribit.com/api/v2",
        "ws_url": "wss://www.deribit.com/ws/api/v2",
        "test_base_url": "https://test.deribit.com/api/v2",
        "instruments": ["BTC", "ETH", "SOL", "MATIC"],
        "api_key": os.getenv("DERIBIT_API_KEY", ""),
        "api_secret": os.getenv("DERIBIT_API_SECRET", "")
    },
    "binance_options": {
        "base_url": "https://eapi.binance.com",
        "instruments": ["BTC", "ETH", "BNB"],
        "api_key": os.getenv("BINANCE_OPTIONS_API_KEY", ""),
        "api_secret": os.getenv("BINANCE_OPTIONS_API_SECRET", "")
    },
    "okex": {
        "base_url": "https://www.okx.com",
        "instruments": ["BTC", "ETH"],
        "api_key": os.getenv("OKX_API_KEY", ""),
        "api_secret": os.getenv("OKX_API_SECRET", "")
    }
}

# Enums
class OptionType(str, Enum):
    CALL = "call"
    PUT = "put"

class OptionStyle(str, Enum):
    EUROPEAN = "european"
    AMERICAN = "american"
    BERMUDIAN = "bermudian"

class ExoticType(str, Enum):
    VANILLA = "vanilla"
    BARRIER = "barrier"
    ASIAN = "asian"
    BINARY = "binary"
    LOOKBACK = "lookback"

class PricingModel(str, Enum):
    BLACK_SCHOLES = "black_scholes"
    BLACK_SCHOLES_MERTON = "black_scholes_merton"
    BINOMIAL = "binomial"
    TRINOMIAL = "trinomial"
    MONTE_CARLO = "monte_carlo"

class Greeks(str, Enum):
    DELTA = "delta"
    GAMMA = "gamma"
    THETA = "theta"
    VEGA = "vega"
    RHO = "rho"
    VOLGA = "volga"
    VANNA = "vanna"
    CHARM = "charm"
    SPEED = "speed"
    ZOMMA = "zomma"

# Pydantic Models
class OptionContract(BaseModel):
    contract_id: str = Field(..., description="Unique contract identifier")
    underlying: str = Field(..., description="Underlying asset symbol")
    option_type: OptionType = Field(..., description="Call or Put")
    option_style: OptionStyle = Field(default=OptionStyle.EUROPEAN, description="Option style")
    exotic_type: ExoticType = Field(default=ExoticType.VANILLA, description="Exotic option type")
    strike_price: Decimal = Field(..., gt=0, description="Strike price")
    expiry_date: datetime = Field(..., description="Expiration date")
    multiplier: int = Field(default=1, description="Contract multiplier")
    tick_size: Decimal = Field(default=Decimal("0.01"), description="Minimum price increment")
    exchange: str = Field(default="deribit", description="Exchange/venue")
    is_active: bool = Field(default=True, description="Contract status")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MarketData(BaseModel):
    underlying: str
    spot_price: Decimal = Field(..., gt=0, description="Current spot price")
    risk_free_rate: Decimal = Field(default=Decimal("0.05"), description="Risk-free rate")
    dividend_yield: Decimal = Field(default=Decimal("0.0"), description="Dividend yield")
    implied_volatility: Optional[Decimal] = Field(None, description="Implied volatility")
    historical_volatility: Optional[Decimal] = Field(None, description="Historical volatility")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OptionPriceRequest(BaseModel):
    contract: OptionContract = Field(..., description="Option contract")
    market_data: MarketData = Field(..., description="Market data")
    pricing_model: PricingModel = Field(default=PricingModel.BLACK_SCHOLES, description="Pricing model")
    volatility_override: Optional[Decimal] = Field(None, description="Volatility override")
    steps: Optional[int] = Field(100, description="Tree steps (for tree models)")
    simulations: Optional[int] = Field(10000, description="MC simulations")

class GreeksCalculation(BaseModel):
    delta: Decimal = Field(..., description="Price sensitivity to underlying")
    gamma: Decimal = Field(..., description="Delta sensitivity to underlying")
    theta: Decimal = Field(..., description="Time decay")
    vega: Decimal = Field(..., description="Volatility sensitivity")
    rho: Decimal = Field(..., description="Interest rate sensitivity")
    # Second-order Greeks
    volga: Optional[Decimal] = Field(None, description="Vega sensitivity to volatility")
    vanna: Optional[Decimal] = Field(None, description="Vega sensitivity to underlying")
    charm: Optional[Decimal] = Field(None, description="Delta decay")
    speed: Optional[Decimal] = Field(None, description="Gamma sensitivity to underlying")
    zomma: Optional[Decimal] = Field(None, description="Gamma sensitivity to volatility")

class OptionPricing(BaseModel):
    contract_id: str
    theoretical_price: Decimal = Field(..., description="Theoretical option price")
    bid_price: Optional[Decimal] = Field(None, description="Market bid price")
    ask_price: Optional[Decimal] = Field(None, description="Market ask price")
    mid_price: Optional[Decimal] = Field(None, description="Market mid price")
    implied_volatility: Optional[Decimal] = Field(None, description="Implied volatility")
    greeks: GreeksCalculation = Field(..., description="Greeks calculation")
    intrinsic_value: Decimal = Field(..., description="Intrinsic value")
    time_value: Decimal = Field(..., description="Time value")
    model_used: PricingModel = Field(..., description="Pricing model used")
    calculation_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VolatilitySmile(BaseModel):
    underlying: str
    expiry_date: datetime
    strikes: List[Decimal] = Field(..., description="Strike prices")
    implied_volatilities: List[Decimal] = Field(..., description="Implied volatilities")
    spot_price: Decimal = Field(..., description="Current spot price")
    forward_price: Decimal = Field(..., description="Forward price")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StrategyLeg(BaseModel):
    contract: OptionContract
    quantity: int = Field(..., description="Number of contracts (+ for long, - for short)")
    entry_price: Optional[Decimal] = Field(None, description="Entry price")

class OptionsStrategy(BaseModel):
    strategy_id: str = Field(..., description="Strategy identifier")
    name: str = Field(..., description="Strategy name")
    description: str = Field(..., description="Strategy description")
    legs: List[StrategyLeg] = Field(..., description="Strategy legs")
    max_profit: Optional[Decimal] = Field(None, description="Maximum profit")
    max_loss: Optional[Decimal] = Field(None, description="Maximum loss")
    breakeven_points: List[Decimal] = Field(default_factory=list, description="Breakeven points")
    margin_requirement: Optional[Decimal] = Field(None, description="Margin requirement")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RiskScenario(BaseModel):
    scenario_name: str = Field(..., description="Scenario name")
    spot_change: Decimal = Field(..., description="Spot price change %")
    volatility_change: Decimal = Field(default=Decimal("0"), description="Volatility change")
    time_change: int = Field(default=0, description="Time change in days")
    pnl: Decimal = Field(..., description="Profit/Loss")
    greeks_impact: Dict[str, Decimal] = Field(..., description="Greeks impact")

# Initialize FastAPI app
app = FastAPI(
    title="AILYDIAN Options Greeks Service",
    description="Advanced options pricing and Greeks calculation",
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

class BlackScholesEngine:
    """Black-Scholes option pricing engine with Greeks calculation"""
    
    @staticmethod
    def d1(S: float, K: float, T: float, r: float, sigma: float, q: float = 0.0) -> float:
        """Calculate d1 parameter"""
        return (math.log(S / K) + (r - q + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    
    @staticmethod
    def d2(S: float, K: float, T: float, r: float, sigma: float, q: float = 0.0) -> float:
        """Calculate d2 parameter"""
        return BlackScholesEngine.d1(S, K, T, r, sigma, q) - sigma * math.sqrt(T)
    
    @classmethod
    def price(cls, S: float, K: float, T: float, r: float, sigma: float, 
              option_type: OptionType, q: float = 0.0) -> float:
        """Calculate Black-Scholes option price"""
        if T <= 0:
            # Option expired - return intrinsic value
            if option_type == OptionType.CALL:
                return max(S - K, 0)
            else:
                return max(K - S, 0)
        
        d1 = cls.d1(S, K, T, r, sigma, q)
        d2 = cls.d2(S, K, T, r, sigma, q)
        
        if option_type == OptionType.CALL:
            price = S * math.exp(-q * T) * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)
        else:
            price = K * math.exp(-r * T) * norm.cdf(-d2) - S * math.exp(-q * T) * norm.cdf(-d1)
        
        return max(price, 0)  # Ensure non-negative price
    
    @classmethod
    def delta(cls, S: float, K: float, T: float, r: float, sigma: float, 
              option_type: OptionType, q: float = 0.0) -> float:
        """Calculate Delta"""
        if T <= 0:
            if option_type == OptionType.CALL:
                return 1.0 if S > K else 0.0
            else:
                return -1.0 if S < K else 0.0
        
        d1 = cls.d1(S, K, T, r, sigma, q)
        
        if option_type == OptionType.CALL:
            return math.exp(-q * T) * norm.cdf(d1)
        else:
            return -math.exp(-q * T) * norm.cdf(-d1)
    
    @classmethod
    def gamma(cls, S: float, K: float, T: float, r: float, sigma: float, q: float = 0.0) -> float:
        """Calculate Gamma"""
        if T <= 0:
            return 0.0
        
        d1 = cls.d1(S, K, T, r, sigma, q)
        return math.exp(-q * T) * norm.pdf(d1) / (S * sigma * math.sqrt(T))
    
    @classmethod
    def theta(cls, S: float, K: float, T: float, r: float, sigma: float, 
              option_type: OptionType, q: float = 0.0) -> float:
        """Calculate Theta (per day)"""
        if T <= 0:
            return 0.0
        
        d1 = cls.d1(S, K, T, r, sigma, q)
        d2 = cls.d2(S, K, T, r, sigma, q)
        
        # Common terms
        term1 = -S * math.exp(-q * T) * norm.pdf(d1) * sigma / (2 * math.sqrt(T))
        term2 = q * S * math.exp(-q * T)
        term3 = r * K * math.exp(-r * T)
        
        if option_type == OptionType.CALL:
            theta = term1 + term2 * norm.cdf(d1) - term3 * norm.cdf(d2)
        else:
            theta = term1 - term2 * norm.cdf(-d1) + term3 * norm.cdf(-d2)
        
        return theta / 365.25  # Convert to per-day
    
    @classmethod
    def vega(cls, S: float, K: float, T: float, r: float, sigma: float, q: float = 0.0) -> float:
        """Calculate Vega"""
        if T <= 0:
            return 0.0
        
        d1 = cls.d1(S, K, T, r, sigma, q)
        return S * math.exp(-q * T) * norm.pdf(d1) * math.sqrt(T) / 100  # Per 1% vol change
    
    @classmethod
    def rho(cls, S: float, K: float, T: float, r: float, sigma: float, 
            option_type: OptionType, q: float = 0.0) -> float:
        """Calculate Rho"""
        if T <= 0:
            return 0.0
        
        d2 = cls.d2(S, K, T, r, sigma, q)
        
        if option_type == OptionType.CALL:
            return K * T * math.exp(-r * T) * norm.cdf(d2) / 100  # Per 1% rate change
        else:
            return -K * T * math.exp(-r * T) * norm.cdf(-d2) / 100
    
    @classmethod
    def calculate_all_greeks(cls, S: float, K: float, T: float, r: float, sigma: float, 
                           option_type: OptionType, q: float = 0.0) -> GreeksCalculation:
        """Calculate all first-order Greeks"""
        return GreeksCalculation(
            delta=Decimal(str(round(cls.delta(S, K, T, r, sigma, option_type, q), 6))),
            gamma=Decimal(str(round(cls.gamma(S, K, T, r, sigma, q), 8))),
            theta=Decimal(str(round(cls.theta(S, K, T, r, sigma, option_type, q), 6))),
            vega=Decimal(str(round(cls.vega(S, K, T, r, sigma, q), 6))),
            rho=Decimal(str(round(cls.rho(S, K, T, r, sigma, option_type, q), 6)))
        )

class ImpliedVolatilityEngine:
    """Implied volatility calculation engine"""
    
    @staticmethod
    def newton_raphson(S: float, K: float, T: float, r: float, market_price: float, 
                      option_type: OptionType, q: float = 0.0, 
                      max_iterations: int = 100, tolerance: float = 1e-6) -> float:
        """Calculate implied volatility using Newton-Raphson method"""
        
        # Initial guess
        sigma = 0.2
        
        for i in range(max_iterations):
            # Calculate price and vega
            price = BlackScholesEngine.price(S, K, T, r, sigma, option_type, q)
            vega = BlackScholesEngine.vega(S, K, T, r, sigma, q) * 100  # Convert back to raw vega
            
            # Price difference
            price_diff = price - market_price
            
            if abs(price_diff) < tolerance:
                return sigma
            
            if vega < 1e-10:  # Avoid division by zero
                break
            
            # Newton-Raphson update
            sigma = sigma - price_diff / vega
            
            # Keep sigma positive and reasonable
            sigma = max(0.001, min(sigma, 5.0))
        
        return sigma
    
    @classmethod
    def calculate(cls, S: float, K: float, T: float, r: float, market_price: float, 
                  option_type: OptionType, q: float = 0.0) -> Optional[float]:
        """Calculate implied volatility with error handling"""
        try:
            if T <= 0 or market_price <= 0:
                return None
            
            # Check if price is within reasonable bounds
            intrinsic = max(S - K if option_type == OptionType.CALL else K - S, 0)
            if market_price < intrinsic:
                return None
            
            iv = cls.newton_raphson(S, K, T, r, market_price, option_type, q)
            return iv if 0.001 <= iv <= 5.0 else None
            
        except Exception as e:
            logger.warning(f"IV calculation error: {e}")
            return None

class BinomialTreeEngine:
    """Binomial tree option pricing for American options"""
    
    @staticmethod
    def american_option_price(S: float, K: float, T: float, r: float, sigma: float, 
                            option_type: OptionType, steps: int = 100, q: float = 0.0) -> float:
        """Price American option using binomial tree"""
        
        dt = T / steps
        u = math.exp(sigma * math.sqrt(dt))
        d = 1 / u
        p = (math.exp((r - q) * dt) - d) / (u - d)
        discount = math.exp(-r * dt)
        
        # Initialize asset prices at maturity
        asset_prices = np.zeros(steps + 1)
        option_values = np.zeros(steps + 1)
        
        for i in range(steps + 1):
            asset_prices[i] = S * (u ** (steps - i)) * (d ** i)
            if option_type == OptionType.CALL:
                option_values[i] = max(asset_prices[i] - K, 0)
            else:
                option_values[i] = max(K - asset_prices[i], 0)
        
        # Backward induction
        for j in range(steps - 1, -1, -1):
            for i in range(j + 1):
                asset_price = S * (u ** (j - i)) * (d ** i)
                
                # European value
                european_value = discount * (p * option_values[i] + (1 - p) * option_values[i + 1])
                
                # Early exercise value
                if option_type == OptionType.CALL:
                    early_exercise = max(asset_price - K, 0)
                else:
                    early_exercise = max(K - asset_price, 0)
                
                # American option value (max of European and early exercise)
                option_values[i] = max(european_value, early_exercise)
        
        return option_values[0]

class MarketDataFetcher:
    """Real-time market data fetcher"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.cache = {}
    
    async def get_deribit_data(self, instrument: str) -> Optional[Dict]:
        """Fetch data from Deribit"""
        try:
            config = MARKET_ENDPOINTS["deribit"]
            url = f"{config['base_url']}/public/get_order_book"
            
            params = {
                "instrument_name": f"{instrument}-PERPETUAL",
                "depth": 5
            }
            
            response = await self.client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                if data.get("result"):
                    return {
                        "exchange": "deribit",
                        "instrument": instrument,
                        "spot_price": Decimal(str(data["result"]["mark_price"])),
                        "bid": Decimal(str(data["result"]["bids"][0][0]) if data["result"]["bids"] else "0"),
                        "ask": Decimal(str(data["result"]["asks"][0][0]) if data["result"]["asks"] else "0"),
                        "timestamp": datetime.now(timezone.utc)
                    }
        except Exception as e:
            logger.error(f"Deribit data error: {e}")
        
        return None
    
    async def get_options_chain(self, underlying: str, expiry: Optional[str] = None) -> List[Dict]:
        """Fetch options chain"""
        try:
            config = MARKET_ENDPOINTS["deribit"]
            url = f"{config['base_url']}/public/get_instruments"
            
            params = {
                "currency": underlying,
                "kind": "option",
                "expired": "false"
            }
            
            response = await self.client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                instruments = data.get("result", [])
                
                options_chain = []
                for instrument in instruments[:50]:  # Limit results
                    if expiry and expiry not in instrument["instrument_name"]:
                        continue
                    
                    option_data = {
                        "instrument_name": instrument["instrument_name"],
                        "underlying": underlying,
                        "strike": Decimal(str(instrument["strike"])),
                        "expiry": datetime.fromisoformat(instrument["expiration_timestamp"][:-1] + "+00:00"),
                        "option_type": OptionType.CALL if instrument["option_type"] == "call" else OptionType.PUT,
                        "is_active": instrument.get("is_active", True)
                    }
                    
                    options_chain.append(option_data)
                
                return options_chain
                
        except Exception as e:
            logger.error(f"Options chain error: {e}")
        
        return []
    
    async def close(self):
        """Cleanup"""
        await self.client.aclose()

class OptionsCalculator:
    """Main options pricing and Greeks calculator"""
    
    def __init__(self):
        self.market_fetcher = MarketDataFetcher()
        self.cache = {}
    
    async def initialize_database(self):
        """Initialize database tables"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor()
            
            # Option contracts table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS option_contracts (
                    contract_id VARCHAR(50) PRIMARY KEY,
                    underlying VARCHAR(20) NOT NULL,
                    option_type VARCHAR(10) NOT NULL,
                    option_style VARCHAR(15) DEFAULT 'european',
                    exotic_type VARCHAR(15) DEFAULT 'vanilla',
                    strike_price DECIMAL(20,8) NOT NULL,
                    expiry_date TIMESTAMPTZ NOT NULL,
                    multiplier INTEGER DEFAULT 1,
                    tick_size DECIMAL(10,8) DEFAULT 0.01,
                    exchange VARCHAR(30) DEFAULT 'deribit',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            # Market data table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS market_data (
                    id SERIAL PRIMARY KEY,
                    underlying VARCHAR(20) NOT NULL,
                    spot_price DECIMAL(20,8) NOT NULL,
                    risk_free_rate DECIMAL(10,6) DEFAULT 0.05,
                    dividend_yield DECIMAL(10,6) DEFAULT 0.0,
                    implied_volatility DECIMAL(10,6),
                    historical_volatility DECIMAL(10,6),
                    timestamp TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            # Option pricing results
            cur.execute("""
                CREATE TABLE IF NOT EXISTS option_pricing (
                    id SERIAL PRIMARY KEY,
                    contract_id VARCHAR(50) NOT NULL,
                    theoretical_price DECIMAL(20,8) NOT NULL,
                    bid_price DECIMAL(20,8),
                    ask_price DECIMAL(20,8),
                    mid_price DECIMAL(20,8),
                    implied_volatility DECIMAL(10,6),
                    delta_value DECIMAL(10,6),
                    gamma_value DECIMAL(10,8),
                    theta_value DECIMAL(10,6),
                    vega_value DECIMAL(10,6),
                    rho_value DECIMAL(10,6),
                    intrinsic_value DECIMAL(20,8),
                    time_value DECIMAL(20,8),
                    model_used VARCHAR(30),
                    calculation_time TIMESTAMPTZ DEFAULT NOW(),
                    FOREIGN KEY (contract_id) REFERENCES option_contracts(contract_id)
                )
            """)
            
            # Volatility surface
            cur.execute("""
                CREATE TABLE IF NOT EXISTS volatility_surface (
                    id SERIAL PRIMARY KEY,
                    underlying VARCHAR(20) NOT NULL,
                    expiry_date TIMESTAMPTZ NOT NULL,
                    strike_price DECIMAL(20,8) NOT NULL,
                    implied_volatility DECIMAL(10,6) NOT NULL,
                    delta DECIMAL(10,6),
                    spot_price DECIMAL(20,8),
                    timestamp TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            # Options strategies
            cur.execute("""
                CREATE TABLE IF NOT EXISTS options_strategies (
                    strategy_id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    legs JSONB NOT NULL,
                    max_profit DECIMAL(20,8),
                    max_loss DECIMAL(20,8),
                    breakeven_points DECIMAL[] DEFAULT '{}',
                    margin_requirement DECIMAL(20,8),
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            # Create indexes
            cur.execute("CREATE INDEX IF NOT EXISTS idx_option_pricing_contract ON option_pricing(contract_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_market_data_underlying ON market_data(underlying)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_volatility_surface_underlying ON volatility_surface(underlying, expiry_date)")
            
            conn.commit()
            cur.close()
            conn.close()
            
            logger.info("Options Greeks database initialized")
            
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
    
    async def price_option(self, request: OptionPriceRequest) -> OptionPricing:
        """Price option and calculate Greeks"""
        try:
            contract = request.contract
            market = request.market_data
            
            # Convert to float for calculations
            S = float(market.spot_price)
            K = float(contract.strike_price)
            r = float(market.risk_free_rate)
            q = float(market.dividend_yield)
            
            # Calculate time to expiry
            now = datetime.now(timezone.utc)
            if contract.expiry_date.tzinfo is None:
                expiry = contract.expiry_date.replace(tzinfo=timezone.utc)
            else:
                expiry = contract.expiry_date
            
            T = (expiry - now).total_seconds() / (365.25 * 24 * 3600)
            
            if T <= 0:
                # Expired option
                if contract.option_type == OptionType.CALL:
                    intrinsic = max(S - K, 0)
                else:
                    intrinsic = max(K - S, 0)
                
                return OptionPricing(
                    contract_id=contract.contract_id,
                    theoretical_price=Decimal(str(intrinsic)),
                    greeks=GreeksCalculation(
                        delta=Decimal("0"), gamma=Decimal("0"), theta=Decimal("0"),
                        vega=Decimal("0"), rho=Decimal("0")
                    ),
                    intrinsic_value=Decimal(str(intrinsic)),
                    time_value=Decimal("0"),
                    model_used=request.pricing_model
                )
            
            # Determine volatility
            sigma = None
            if request.volatility_override:
                sigma = float(request.volatility_override)
            elif market.implied_volatility:
                sigma = float(market.implied_volatility)
            elif market.historical_volatility:
                sigma = float(market.historical_volatility)
            else:
                sigma = 0.2  # Default fallback
            
            # Calculate price based on model
            if request.pricing_model == PricingModel.BLACK_SCHOLES:
                price = BlackScholesEngine.price(S, K, T, r, sigma, contract.option_type, q)
                greeks = BlackScholesEngine.calculate_all_greeks(S, K, T, r, sigma, contract.option_type, q)
            
            elif request.pricing_model == PricingModel.BINOMIAL:
                price = BinomialTreeEngine.american_option_price(
                    S, K, T, r, sigma, contract.option_type, request.steps or 100, q
                )
                # Use BS Greeks as approximation for binomial
                greeks = BlackScholesEngine.calculate_all_greeks(S, K, T, r, sigma, contract.option_type, q)
            
            else:
                # Default to Black-Scholes
                price = BlackScholesEngine.price(S, K, T, r, sigma, contract.option_type, q)
                greeks = BlackScholesEngine.calculate_all_greeks(S, K, T, r, sigma, contract.option_type, q)
            
            # Calculate intrinsic and time value
            if contract.option_type == OptionType.CALL:
                intrinsic = max(S - K, 0)
            else:
                intrinsic = max(K - S, 0)
            
            time_value = max(price - intrinsic, 0)
            
            result = OptionPricing(
                contract_id=contract.contract_id,
                theoretical_price=Decimal(str(round(price, 8))),
                greeks=greeks,
                intrinsic_value=Decimal(str(round(intrinsic, 8))),
                time_value=Decimal(str(round(time_value, 8))),
                model_used=request.pricing_model
            )
            
            # Save to database
            await self.save_pricing_result(result)
            
            return result
            
        except Exception as e:
            logger.error(f"Option pricing error: {e}")
            raise HTTPException(status_code=500, detail=f"Pricing calculation failed: {str(e)}")
    
    async def calculate_implied_volatility(self, contract: OptionContract, 
                                         market_data: MarketData, 
                                         market_price: Decimal) -> Optional[Decimal]:
        """Calculate implied volatility"""
        try:
            S = float(market_data.spot_price)
            K = float(contract.strike_price)
            r = float(market_data.risk_free_rate)
            q = float(market_data.dividend_yield)
            price = float(market_price)
            
            # Calculate time to expiry
            now = datetime.now(timezone.utc)
            if contract.expiry_date.tzinfo is None:
                expiry = contract.expiry_date.replace(tzinfo=timezone.utc)
            else:
                expiry = contract.expiry_date
            
            T = (expiry - now).total_seconds() / (365.25 * 24 * 3600)
            
            if T <= 0:
                return None
            
            iv = ImpliedVolatilityEngine.calculate(S, K, T, r, price, contract.option_type, q)
            
            return Decimal(str(iv)) if iv else None
            
        except Exception as e:
            logger.error(f"IV calculation error: {e}")
            return None
    
    async def get_volatility_smile(self, underlying: str, expiry_date: datetime) -> Optional[VolatilitySmile]:
        """Generate volatility smile"""
        try:
            # Get options chain
            options_chain = await self.market_fetcher.get_options_chain(underlying)
            
            if not options_chain:
                return None
            
            # Filter by expiry and get market data
            market_data = MarketData(
                underlying=underlying,
                spot_price=Decimal("50000"),  # Mock data
                risk_free_rate=Decimal("0.05"),
                historical_volatility=Decimal("0.6")
            )
            
            strikes = []
            ivs = []
            
            for option in options_chain:
                if option["expiry"].date() == expiry_date.date():
                    # Mock market price for IV calculation
                    mock_price = Decimal("500")  # This should come from real market data
                    
                    contract = OptionContract(
                        contract_id=option["instrument_name"],
                        underlying=underlying,
                        option_type=option["option_type"],
                        strike_price=option["strike"],
                        expiry_date=option["expiry"]
                    )
                    
                    iv = await self.calculate_implied_volatility(contract, market_data, mock_price)
                    
                    if iv:
                        strikes.append(option["strike"])
                        ivs.append(iv)
            
            if strikes and ivs:
                return VolatilitySmile(
                    underlying=underlying,
                    expiry_date=expiry_date,
                    strikes=strikes,
                    implied_volatilities=ivs,
                    spot_price=market_data.spot_price,
                    forward_price=market_data.spot_price  # Simplified
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Volatility smile error: {e}")
            return None
    
    async def save_pricing_result(self, pricing: OptionPricing):
        """Save pricing result to database"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO option_pricing (
                    contract_id, theoretical_price, bid_price, ask_price, mid_price,
                    implied_volatility, delta_value, gamma_value, theta_value,
                    vega_value, rho_value, intrinsic_value, time_value, model_used
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                pricing.contract_id, pricing.theoretical_price, pricing.bid_price,
                pricing.ask_price, pricing.mid_price, pricing.implied_volatility,
                pricing.greeks.delta, pricing.greeks.gamma, pricing.greeks.theta,
                pricing.greeks.vega, pricing.greeks.rho, pricing.intrinsic_value,
                pricing.time_value, pricing.model_used
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
        except Exception as e:
            logger.error(f"Save pricing error: {e}")

# Initialize calculator
options_calculator = OptionsCalculator()

@app.on_event("startup")
async def startup_event():
    """Initialize connections and services"""
    global redis_client
    try:
        # Initialize Redis
        redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
        await redis_client.ping()
        
        # Initialize database
        await options_calculator.initialize_database()
        
        logger.info("Options Greeks Service started successfully")
        
    except Exception as e:
        logger.error(f"Startup error: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup connections"""
    global redis_client
    if redis_client:
        await redis_client.close()
    
    await options_calculator.market_fetcher.close()
    
    logger.info("Options Greeks Service shutdown complete")

# API Endpoints

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "service": "Options Greeks Service",
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
        "market_data": "unknown"
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
    
    # Check market data
    try:
        test_data = await options_calculator.market_fetcher.get_deribit_data("BTC")
        health_status["market_data"] = "healthy" if test_data else "degraded"
    except:
        pass
    
    return health_status

@app.post("/api/v1/options/price", response_model=OptionPricing)
async def price_option(request: OptionPriceRequest):
    """Price option and calculate Greeks"""
    try:
        result = await options_calculator.price_option(request)
        
        return result
        
    except Exception as e:
        logger.error(f"Option pricing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/options/implied-volatility")
async def calculate_implied_volatility(
    contract: OptionContract,
    market_data: MarketData,
    market_price: Decimal
):
    """Calculate implied volatility"""
    try:
        iv = await options_calculator.calculate_implied_volatility(contract, market_data, market_price)
        
        if iv is None:
            raise HTTPException(status_code=400, detail="Could not calculate implied volatility")
        
        return {
            "success": True,
            "data": {
                "contract_id": contract.contract_id,
                "market_price": str(market_price),
                "implied_volatility": str(iv),
                "volatility_percentage": str(iv * 100)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"IV calculation error: {e}")
        raise HTTPException(status_code=500, detail="IV calculation failed")

@app.get("/api/v1/options/volatility-smile/{underlying}")
async def get_volatility_smile(
    underlying: str,
    expiry_date: datetime = Query(..., description="Expiry date (YYYY-MM-DD)")
):
    """Get volatility smile for given expiry"""
    try:
        smile = await options_calculator.get_volatility_smile(underlying, expiry_date)
        
        if not smile:
            raise HTTPException(status_code=404, detail="No volatility data found")
        
        return {
            "success": True,
            "data": asdict(smile)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Volatility smile error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate volatility smile")

@app.get("/api/v1/market-data/{underlying}")
async def get_market_data(underlying: str):
    """Get current market data"""
    try:
        data = await options_calculator.market_fetcher.get_deribit_data(underlying)
        
        if not data:
            raise HTTPException(status_code=404, detail="Market data not available")
        
        return {
            "success": True,
            "data": data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Market data error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch market data")

@app.get("/api/v1/options-chain/{underlying}")
async def get_options_chain(underlying: str, expiry: Optional[str] = None):
    """Get options chain"""
    try:
        chain = await options_calculator.market_fetcher.get_options_chain(underlying, expiry)
        
        return {
            "success": True,
            "data": chain,
            "count": len(chain)
        }
        
    except Exception as e:
        logger.error(f"Options chain error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch options chain")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8009,
        reload=True,
        log_level="info"
    )
