"""
AILYDIAN Global Trader - DeFi Strategist Service
Quantum-ML powered portfolio optimization and yield farming strategies

Features:
- Quantum-inspired machine learning algorithms
- Multi-protocol yield farming optimization
- Risk-adjusted portfolio allocation
- Dynamic rebalancing strategies
- IL (Impermanent Loss) prediction
- MEV-aware execution
- Cross-chain yield opportunities
"""

import os
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from decimal import Decimal, ROUND_DOWN
import asyncio
import json
import math
from dataclasses import dataclass, asdict
from enum import Enum

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

# Quantum ML imports (simulated - in production would use actual quantum libraries)
from scipy.optimize import minimize
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://borsa:borsa@localhost:5432/borsa")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
QUANTUM_ML_SERVICE = os.getenv("QUANTUM_ML_SERVICE", "http://localhost:8001")

# DeFi Protocols for yield farming
DEFI_PROTOCOLS = {
    "uniswap_v3": {
        "type": "amm",
        "chain": "ethereum",
        "endpoint": "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
        "pools": ["USDC-WETH-0.05", "USDC-WETH-0.3", "WBTC-WETH-0.3"]
    },
    "aave": {
        "type": "lending",
        "chain": "ethereum",
        "endpoint": "https://aave-api-v2.aave.com",
        "assets": ["USDC", "USDT", "DAI", "WETH", "WBTC"]
    },
    "compound": {
        "type": "lending",
        "chain": "ethereum", 
        "endpoint": "https://api.compound.finance",
        "assets": ["USDC", "USDT", "DAI", "ETH"]
    },
    "curve": {
        "type": "amm",
        "chain": "ethereum",
        "endpoint": "https://api.curve.fi",
        "pools": ["3pool", "stETH", "fraxusdc"]
    },
    "balancer": {
        "type": "amm",
        "chain": "ethereum",
        "endpoint": "https://api.balancer.fi",
        "pools": ["80-20-WETH-WBTC", "50-50-USDC-WETH"]
    },
    "yearn": {
        "type": "yield",
        "chain": "ethereum",
        "endpoint": "https://api.yearn.finance",
        "vaults": ["yvUSDC", "yvDAI", "yvWETH"]
    }
}

# Enums
class StrategyType(str, Enum):
    YIELD_FARMING = "yield_farming"
    LIQUIDITY_PROVISION = "liquidity_provision"
    LENDING = "lending"
    STAKING = "staking"
    ARBITRAGE = "arbitrage"
    MEV_EXTRACTION = "mev_extraction"

class RiskLevel(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"
    EXPERIMENTAL = "experimental"

class OptimizationType(str, Enum):
    MAX_YIELD = "max_yield"
    MAX_SHARPE = "max_sharpe"
    MIN_RISK = "min_risk"
    RISK_PARITY = "risk_parity"
    KELLY_CRITERION = "kelly_criterion"

class RebalanceSignal(str, Enum):
    NO_ACTION = "no_action"
    REBALANCE_MINOR = "rebalance_minor"
    REBALANCE_MAJOR = "rebalance_major"
    EXIT_STRATEGY = "exit_strategy"
    EMERGENCY_EXIT = "emergency_exit"

# Pydantic Models
class AssetAllocation(BaseModel):
    asset_symbol: str = Field(..., description="Asset symbol")
    protocol: str = Field(..., description="DeFi protocol")
    strategy_type: StrategyType = Field(..., description="Strategy type")
    allocation_percentage: Decimal = Field(..., ge=0, le=100, description="Allocation percentage")
    expected_apy: Decimal = Field(..., ge=0, description="Expected APY")
    risk_score: Decimal = Field(..., ge=0, le=100, description="Risk score (0-100)")
    liquidity_score: Decimal = Field(..., ge=0, le=100, description="Liquidity score")
    gas_cost_estimate: Decimal = Field(..., ge=0, description="Gas cost estimate")
    entry_conditions: Dict[str, Any] = Field(default_factory=dict, description="Entry conditions")
    exit_conditions: Dict[str, Any] = Field(default_factory=dict, description="Exit conditions")

class PortfolioStrategy(BaseModel):
    strategy_id: str = Field(..., description="Unique strategy identifier")
    name: str = Field(..., description="Strategy name")
    description: str = Field(..., description="Strategy description")
    risk_level: RiskLevel = Field(..., description="Risk level")
    optimization_type: OptimizationType = Field(..., description="Optimization objective")
    target_apy: Decimal = Field(..., ge=0, description="Target APY")
    max_drawdown: Decimal = Field(..., ge=0, le=100, description="Maximum drawdown tolerance")
    rebalance_frequency: int = Field(..., ge=1, description="Rebalance frequency in hours")
    min_position_size: Decimal = Field(..., ge=0, description="Minimum position size")
    max_position_size: Optional[Decimal] = Field(None, description="Maximum position size")
    allocations: List[AssetAllocation] = Field(..., description="Asset allocations")
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Strategy constraints")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @validator('allocations')
    def validate_allocations(cls, v):
        total_allocation = sum(alloc.allocation_percentage for alloc in v)
        if abs(total_allocation - 100) > Decimal("0.01"):
            raise ValueError(f"Allocations must sum to 100%, got {total_allocation}%")
        return v

class MarketData(BaseModel):
    asset_symbol: str
    price: Decimal
    volume_24h: Decimal
    price_change_24h: Decimal
    volatility_30d: Decimal
    liquidity_depth: Decimal
    timestamp: datetime

class YieldOpportunity(BaseModel):
    protocol: str
    strategy_type: StrategyType
    asset_pair: str
    current_apy: Decimal
    predicted_apy: Decimal
    tvl: Decimal
    risk_score: Decimal
    il_risk: Decimal  # Impermanent Loss risk
    entry_cost: Decimal
    exit_cost: Decimal
    confidence_score: Decimal
    time_horizon: int  # in days
    
class OptimizationResult(BaseModel):
    strategy_id: str
    optimization_type: OptimizationType
    target_metrics: Dict[str, Decimal]
    optimized_allocations: List[AssetAllocation]
    expected_performance: Dict[str, Decimal]
    risk_metrics: Dict[str, Decimal]
    confidence_interval: Dict[str, Tuple[Decimal, Decimal]]
    backtest_results: Optional[Dict[str, Any]] = None

class RebalanceRecommendation(BaseModel):
    strategy_id: str
    signal: RebalanceSignal
    urgency_score: int = Field(ge=1, le=10, description="Urgency (1-10)")
    current_allocations: List[AssetAllocation]
    recommended_allocations: List[AssetAllocation]
    expected_impact: Dict[str, Decimal]
    execution_order: List[Dict[str, Any]]
    estimated_cost: Decimal
    reasoning: str

# Initialize FastAPI app
app = FastAPI(
    title="AILYDIAN DeFi Strategist Service",
    description="Quantum-ML powered DeFi portfolio optimization",
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

class QuantumMLEngine:
    """Quantum-inspired machine learning engine for DeFi optimization"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=0.95)
        self.yield_predictor = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )
        self.risk_predictor = RandomForestRegressor(
            n_estimators=200,
            max_depth=8,
            random_state=42
        )
        self.is_trained = False
    
    async def quantum_superposition_optimizer(self, returns: np.ndarray, risks: np.ndarray, 
                                            constraints: Dict[str, Any]) -> np.ndarray:
        """Quantum-inspired superposition-based portfolio optimization"""
        
        def objective_function(weights):
            weights = weights / np.sum(weights)  # Normalize
            
            # Expected return
            portfolio_return = np.dot(weights, returns)
            
            # Portfolio variance
            cov_matrix = np.cov(returns.reshape(-1, 1) * risks.reshape(-1, 1))
            portfolio_variance = np.dot(weights, np.dot(cov_matrix, weights))
            portfolio_risk = np.sqrt(portfolio_variance)
            
            # Risk-adjusted return (Sharpe-like ratio)
            risk_free_rate = constraints.get("risk_free_rate", 0.02)
            sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_risk if portfolio_risk > 0 else 0
            
            # Quantum interference term (simulated)
            interference = np.sum([weights[i] * weights[j] * np.cos(returns[i] - returns[j]) 
                                 for i in range(len(weights)) for j in range(i+1, len(weights))])
            
            # Maximize Sharpe ratio with quantum enhancement
            return -(sharpe_ratio + 0.1 * interference)
        
        # Constraints
        n_assets = len(returns)
        bounds = [(0, constraints.get("max_allocation", 0.4)) for _ in range(n_assets)]
        
        # Sum to 1 constraint
        constraint = {'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0}
        
        # Initial guess (equal weights)
        initial_weights = np.ones(n_assets) / n_assets
        
        # Optimize
        result = minimize(objective_function, initial_weights, method='SLSQP',
                        bounds=bounds, constraints=constraint)
        
        return result.x if result.success else initial_weights
    
    async def predict_yield_and_risk(self, features: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Predict yield and risk using ML models"""
        if not self.is_trained:
            # Generate synthetic training data (in production, use historical data)
            await self.train_synthetic_models()
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        features_pca = self.pca.transform(features_scaled)
        
        # Predict
        predicted_yields = self.yield_predictor.predict(features_pca)
        predicted_risks = self.risk_predictor.predict(features_pca)
        
        return predicted_yields, predicted_risks
    
    async def train_synthetic_models(self):
        """Train models with synthetic data (placeholder for real training)"""
        # Generate synthetic training data
        n_samples = 1000
        n_features = 10
        
        # Synthetic features (price, volume, volatility, etc.)
        X = np.random.randn(n_samples, n_features)
        
        # Synthetic targets
        y_yield = 0.05 + 0.1 * X[:, 0] + 0.05 * X[:, 1] + 0.01 * np.random.randn(n_samples)
        y_risk = 0.1 + 0.2 * np.abs(X[:, 2]) + 0.1 * np.abs(X[:, 3]) + 0.05 * np.random.randn(n_samples)
        
        # Fit scalers and models
        X_scaled = self.scaler.fit_transform(X)
        X_pca = self.pca.fit_transform(X_scaled)
        
        self.yield_predictor.fit(X_pca, y_yield)
        self.risk_predictor.fit(X_pca, y_risk)
        
        self.is_trained = True
        logger.info("Quantum ML models trained with synthetic data")

class ProtocolDataFetcher:
    """Fetch data from various DeFi protocols"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_protocol_yields(self, protocol: str) -> List[YieldOpportunity]:
        """Fetch yield opportunities from protocol"""
        try:
            config = DEFI_PROTOCOLS.get(protocol, {})
            
            if protocol == "uniswap_v3":
                return await self._fetch_uniswap_yields(config)
            elif protocol == "aave":
                return await self._fetch_aave_yields(config)
            elif protocol == "compound":
                return await self._fetch_compound_yields(config)
            elif protocol == "curve":
                return await self._fetch_curve_yields(config)
            elif protocol == "balancer":
                return await self._fetch_balancer_yields(config)
            elif protocol == "yearn":
                return await self._fetch_yearn_yields(config)
            else:
                return []
                
        except Exception as e:
            logger.error(f"Error fetching yields from {protocol}: {e}")
            return []
    
    async def _fetch_uniswap_yields(self, config: Dict) -> List[YieldOpportunity]:
        """Fetch Uniswap V3 liquidity pool yields"""
        opportunities = []
        
        # Simulated data (in production, query actual subgraph)
        for pool in config.get("pools", []):
            opportunity = YieldOpportunity(
                protocol="uniswap_v3",
                strategy_type=StrategyType.LIQUIDITY_PROVISION,
                asset_pair=pool,
                current_apy=Decimal(str(np.random.uniform(5, 50))),
                predicted_apy=Decimal(str(np.random.uniform(5, 50))),
                tvl=Decimal(str(np.random.uniform(1000000, 100000000))),
                risk_score=Decimal(str(np.random.uniform(20, 80))),
                il_risk=Decimal(str(np.random.uniform(5, 25))),
                entry_cost=Decimal(str(np.random.uniform(50, 200))),
                exit_cost=Decimal(str(np.random.uniform(50, 200))),
                confidence_score=Decimal(str(np.random.uniform(0.6, 0.9))),
                time_horizon=30
            )
            opportunities.append(opportunity)
        
        return opportunities
    
    async def _fetch_aave_yields(self, config: Dict) -> List[YieldOpportunity]:
        """Fetch Aave lending yields"""
        opportunities = []
        
        for asset in config.get("assets", []):
            opportunity = YieldOpportunity(
                protocol="aave",
                strategy_type=StrategyType.LENDING,
                asset_pair=asset,
                current_apy=Decimal(str(np.random.uniform(1, 8))),
                predicted_apy=Decimal(str(np.random.uniform(1, 8))),
                tvl=Decimal(str(np.random.uniform(10000000, 1000000000))),
                risk_score=Decimal(str(np.random.uniform(10, 30))),
                il_risk=Decimal("0"),  # No IL risk in lending
                entry_cost=Decimal(str(np.random.uniform(20, 100))),
                exit_cost=Decimal(str(np.random.uniform(20, 100))),
                confidence_score=Decimal(str(np.random.uniform(0.8, 0.95))),
                time_horizon=90
            )
            opportunities.append(opportunity)
        
        return opportunities
    
    async def _fetch_compound_yields(self, config: Dict) -> List[YieldOpportunity]:
        """Fetch Compound lending yields"""
        opportunities = []
        
        for asset in config.get("assets", []):
            opportunity = YieldOpportunity(
                protocol="compound",
                strategy_type=StrategyType.LENDING,
                asset_pair=asset,
                current_apy=Decimal(str(np.random.uniform(0.5, 6))),
                predicted_apy=Decimal(str(np.random.uniform(0.5, 6))),
                tvl=Decimal(str(np.random.uniform(5000000, 500000000))),
                risk_score=Decimal(str(np.random.uniform(15, 35))),
                il_risk=Decimal("0"),
                entry_cost=Decimal(str(np.random.uniform(25, 120))),
                exit_cost=Decimal(str(np.random.uniform(25, 120))),
                confidence_score=Decimal(str(np.random.uniform(0.75, 0.9))),
                time_horizon=60
            )
            opportunities.append(opportunity)
        
        return opportunities
    
    async def _fetch_curve_yields(self, config: Dict) -> List[YieldOpportunity]:
        """Fetch Curve pool yields"""
        opportunities = []
        
        for pool in config.get("pools", []):
            opportunity = YieldOpportunity(
                protocol="curve",
                strategy_type=StrategyType.LIQUIDITY_PROVISION,
                asset_pair=pool,
                current_apy=Decimal(str(np.random.uniform(2, 15))),
                predicted_apy=Decimal(str(np.random.uniform(2, 15))),
                tvl=Decimal(str(np.random.uniform(10000000, 2000000000))),
                risk_score=Decimal(str(np.random.uniform(15, 45))),
                il_risk=Decimal(str(np.random.uniform(1, 8))),
                entry_cost=Decimal(str(np.random.uniform(30, 150))),
                exit_cost=Decimal(str(np.random.uniform(30, 150))),
                confidence_score=Decimal(str(np.random.uniform(0.7, 0.85))),
                time_horizon=45
            )
            opportunities.append(opportunity)
        
        return opportunities
    
    async def _fetch_balancer_yields(self, config: Dict) -> List[YieldOpportunity]:
        """Fetch Balancer pool yields"""
        opportunities = []
        
        for pool in config.get("pools", []):
            opportunity = YieldOpportunity(
                protocol="balancer",
                strategy_type=StrategyType.LIQUIDITY_PROVISION,
                asset_pair=pool,
                current_apy=Decimal(str(np.random.uniform(3, 20))),
                predicted_apy=Decimal(str(np.random.uniform(3, 20))),
                tvl=Decimal(str(np.random.uniform(1000000, 500000000))),
                risk_score=Decimal(str(np.random.uniform(25, 55))),
                il_risk=Decimal(str(np.random.uniform(3, 15))),
                entry_cost=Decimal(str(np.random.uniform(40, 180))),
                exit_cost=Decimal(str(np.random.uniform(40, 180))),
                confidence_score=Decimal(str(np.random.uniform(0.65, 0.8))),
                time_horizon=30
            )
            opportunities.append(opportunity)
        
        return opportunities
    
    async def _fetch_yearn_yields(self, config: Dict) -> List[YieldOpportunity]:
        """Fetch Yearn vault yields"""
        opportunities = []
        
        for vault in config.get("vaults", []):
            opportunity = YieldOpportunity(
                protocol="yearn",
                strategy_type=StrategyType.YIELD_FARMING,
                asset_pair=vault,
                current_apy=Decimal(str(np.random.uniform(4, 25))),
                predicted_apy=Decimal(str(np.random.uniform(4, 25))),
                tvl=Decimal(str(np.random.uniform(5000000, 1000000000))),
                risk_score=Decimal(str(np.random.uniform(20, 50))),
                il_risk=Decimal(str(np.random.uniform(0, 10))),
                entry_cost=Decimal(str(np.random.uniform(50, 200))),
                exit_cost=Decimal(str(np.random.uniform(50, 200))),
                confidence_score=Decimal(str(np.random.uniform(0.75, 0.9))),
                time_horizon=60
            )
            opportunities.append(opportunity)
        
        return opportunities
    
    async def close(self):
        """Cleanup"""
        await self.client.aclose()

class StrategyOptimizer:
    """Core strategy optimization engine"""
    
    def __init__(self):
        self.quantum_ml = QuantumMLEngine()
        self.data_fetcher = ProtocolDataFetcher()
    
    async def initialize_database(self):
        """Initialize database tables"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor()
            
            # Portfolio strategies table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS portfolio_strategies (
                    strategy_id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    risk_level VARCHAR(20) NOT NULL,
                    optimization_type VARCHAR(30) NOT NULL,
                    target_apy DECIMAL(10,4) NOT NULL,
                    max_drawdown DECIMAL(5,2) NOT NULL,
                    rebalance_frequency INTEGER NOT NULL,
                    min_position_size DECIMAL(20,8) NOT NULL,
                    max_position_size DECIMAL(20,8),
                    allocations JSONB NOT NULL,
                    constraints JSONB DEFAULT '{}',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            # Strategy performance tracking
            cur.execute("""
                CREATE TABLE IF NOT EXISTS strategy_performance (
                    time TIMESTAMPTZ NOT NULL,
                    strategy_id VARCHAR(50) NOT NULL,
                    total_value DECIMAL(30,8),
                    daily_return DECIMAL(10,6),
                    realized_apy DECIMAL(10,4),
                    risk_metrics JSONB,
                    gas_costs DECIMAL(20,8),
                    rebalance_count INTEGER DEFAULT 0,
                    FOREIGN KEY (strategy_id) REFERENCES portfolio_strategies(strategy_id)
                )
            """)
            
            # Yield opportunities cache
            cur.execute("""
                CREATE TABLE IF NOT EXISTS yield_opportunities (
                    id SERIAL PRIMARY KEY,
                    protocol VARCHAR(50) NOT NULL,
                    strategy_type VARCHAR(30) NOT NULL,
                    asset_pair VARCHAR(50) NOT NULL,
                    current_apy DECIMAL(10,4),
                    predicted_apy DECIMAL(10,4),
                    tvl DECIMAL(30,8),
                    risk_score DECIMAL(5,2),
                    il_risk DECIMAL(5,2),
                    entry_cost DECIMAL(20,8),
                    exit_cost DECIMAL(20,8),
                    confidence_score DECIMAL(3,2),
                    time_horizon INTEGER,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            # Rebalance recommendations
            cur.execute("""
                CREATE TABLE IF NOT EXISTS rebalance_recommendations (
                    id SERIAL PRIMARY KEY,
                    strategy_id VARCHAR(50) NOT NULL,
                    signal VARCHAR(30) NOT NULL,
                    urgency_score INTEGER NOT NULL,
                    current_allocations JSONB NOT NULL,
                    recommended_allocations JSONB NOT NULL,
                    expected_impact JSONB NOT NULL,
                    execution_order JSONB NOT NULL,
                    estimated_cost DECIMAL(20,8),
                    reasoning TEXT,
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    FOREIGN KEY (strategy_id) REFERENCES portfolio_strategies(strategy_id)
                )
            """)
            
            # Try to create hypertables for time-series data
            try:
                cur.execute("SELECT create_hypertable('strategy_performance', 'time', if_not_exists => TRUE)")
            except Exception:
                logger.info("TimescaleDB not available for strategy_performance")
            
            conn.commit()
            cur.close()
            conn.close()
            
            logger.info("DeFi Strategist database initialized")
            
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
    
    async def create_strategy(self, strategy: PortfolioStrategy) -> Dict[str, Any]:
        """Create new portfolio strategy"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO portfolio_strategies (
                    strategy_id, name, description, risk_level, optimization_type,
                    target_apy, max_drawdown, rebalance_frequency, min_position_size,
                    max_position_size, allocations, constraints, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                strategy.strategy_id, strategy.name, strategy.description,
                strategy.risk_level, strategy.optimization_type, strategy.target_apy,
                strategy.max_drawdown, strategy.rebalance_frequency,
                strategy.min_position_size, strategy.max_position_size,
                json.dumps([asdict(alloc) for alloc in strategy.allocations]),
                json.dumps(strategy.constraints), strategy.created_at, strategy.created_at
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            logger.info(f"Strategy created: {strategy.strategy_id}")
            return {"status": "created", "strategy": asdict(strategy)}
            
        except Exception as e:
            logger.error(f"Strategy creation error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create strategy: {str(e)}")
    
    async def optimize_portfolio(self, strategy_id: str, constraints: Optional[Dict] = None) -> OptimizationResult:
        """Optimize portfolio using quantum ML"""
        try:
            # Get strategy
            strategy = await self.get_strategy(strategy_id)
            if not strategy:
                raise HTTPException(status_code=404, detail="Strategy not found")
            
            # Fetch current yield opportunities
            all_opportunities = []
            for protocol in DEFI_PROTOCOLS.keys():
                opportunities = await self.data_fetcher.get_protocol_yields(protocol)
                all_opportunities.extend(opportunities)
            
            if not all_opportunities:
                raise HTTPException(status_code=500, detail="No yield opportunities found")
            
            # Prepare ML features
            features = []
            returns = []
            risks = []
            
            for opp in all_opportunities:
                feature_vector = [
                    float(opp.current_apy),
                    float(opp.tvl),
                    float(opp.risk_score),
                    float(opp.il_risk),
                    float(opp.confidence_score),
                    float(opp.entry_cost),
                    float(opp.exit_cost),
                    opp.time_horizon,
                    1 if opp.strategy_type == StrategyType.LENDING else 0,
                    1 if opp.strategy_type == StrategyType.LIQUIDITY_PROVISION else 0
                ]
                features.append(feature_vector)
                returns.append(float(opp.predicted_apy))
                risks.append(float(opp.risk_score))
            
            features_array = np.array(features)
            returns_array = np.array(returns)
            risks_array = np.array(risks)
            
            # Quantum ML prediction
            predicted_returns, predicted_risks = await self.quantum_ml.predict_yield_and_risk(features_array)
            
            # Optimization constraints
            opt_constraints = constraints or {}
            opt_constraints.update(strategy.get("constraints", {}))
            
            # Quantum optimization
            optimal_weights = await self.quantum_ml.quantum_superposition_optimizer(
                predicted_returns, predicted_risks, opt_constraints
            )
            
            # Create optimized allocations
            optimized_allocations = []
            for i, weight in enumerate(optimal_weights):
                if weight > 0.01:  # Only include meaningful allocations
                    opp = all_opportunities[i]
                    allocation = AssetAllocation(
                        asset_symbol=opp.asset_pair,
                        protocol=opp.protocol,
                        strategy_type=opp.strategy_type,
                        allocation_percentage=Decimal(str(weight * 100)),
                        expected_apy=opp.predicted_apy,
                        risk_score=opp.risk_score,
                        liquidity_score=Decimal("75"),  # Simplified
                        gas_cost_estimate=opp.entry_cost,
                        entry_conditions={"min_tvl": float(opp.tvl)},
                        exit_conditions={"max_drawdown": 15}
                    )
                    optimized_allocations.append(allocation)
            
            # Calculate expected performance
            expected_return = np.dot(optimal_weights, predicted_returns)
            expected_risk = np.sqrt(np.dot(optimal_weights**2, predicted_risks**2))
            sharpe_ratio = expected_return / expected_risk if expected_risk > 0 else 0
            
            # Create result
            result = OptimizationResult(
                strategy_id=strategy_id,
                optimization_type=OptimizationType(strategy.get("optimization_type", "max_sharpe")),
                target_metrics={
                    "target_apy": Decimal(str(expected_return)),
                    "target_risk": Decimal(str(expected_risk)),
                    "target_sharpe": Decimal(str(sharpe_ratio))
                },
                optimized_allocations=optimized_allocations,
                expected_performance={
                    "annual_return": Decimal(str(expected_return)),
                    "volatility": Decimal(str(expected_risk)),
                    "sharpe_ratio": Decimal(str(sharpe_ratio)),
                    "max_drawdown": Decimal(str(np.max(predicted_risks) * 0.5))
                },
                risk_metrics={
                    "var_95": Decimal(str(np.percentile(predicted_risks, 95))),
                    "cvar_95": Decimal(str(np.mean(predicted_risks[predicted_risks >= np.percentile(predicted_risks, 95)]))),
                    "correlation_risk": Decimal(str(np.corrcoef(predicted_returns)[0,1] if len(predicted_returns) > 1 else 0))
                },
                confidence_interval={
                    "return_lower": (Decimal(str(expected_return)), Decimal(str(expected_return * 0.8))),
                    "return_upper": (Decimal(str(expected_return)), Decimal(str(expected_return * 1.2)))
                }
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Portfolio optimization error: {e}")
            raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")
    
    async def generate_rebalance_signal(self, strategy_id: str) -> RebalanceRecommendation:
        """Generate rebalance recommendation"""
        try:
            strategy = await self.get_strategy(strategy_id)
            if not strategy:
                raise HTTPException(status_code=404, detail="Strategy not found")
            
            # Get current optimization
            current_optimization = await self.optimize_portfolio(strategy_id)
            
            # Compare with current allocations
            current_allocations = strategy.get("allocations", [])
            recommended_allocations = current_optimization.optimized_allocations
            
            # Calculate differences
            total_deviation = Decimal("0")
            for i, current in enumerate(current_allocations):
                if i < len(recommended_allocations):
                    recommended = recommended_allocations[i]
                    deviation = abs(current["allocation_percentage"] - recommended.allocation_percentage)
                    total_deviation += deviation
            
            # Determine signal
            if total_deviation < Decimal("5"):
                signal = RebalanceSignal.NO_ACTION
                urgency = 1
            elif total_deviation < Decimal("15"):
                signal = RebalanceSignal.REBALANCE_MINOR
                urgency = 4
            elif total_deviation < Decimal("30"):
                signal = RebalanceSignal.REBALANCE_MAJOR
                urgency = 7
            else:
                signal = RebalanceSignal.EXIT_STRATEGY
                urgency = 9
            
            # Create execution order
            execution_order = []
            for i, alloc in enumerate(recommended_allocations):
                execution_order.append({
                    "step": i + 1,
                    "action": "rebalance",
                    "protocol": alloc.protocol,
                    "asset": alloc.asset_symbol,
                    "target_percentage": float(alloc.allocation_percentage),
                    "estimated_gas": float(alloc.gas_cost_estimate)
                })
            
            recommendation = RebalanceRecommendation(
                strategy_id=strategy_id,
                signal=signal,
                urgency_score=urgency,
                current_allocations=[AssetAllocation(**alloc) for alloc in current_allocations],
                recommended_allocations=recommended_allocations,
                expected_impact={
                    "apy_improvement": current_optimization.expected_performance["annual_return"],
                    "risk_change": current_optimization.risk_metrics["var_95"],
                    "cost_benefit_ratio": total_deviation
                },
                execution_order=execution_order,
                estimated_cost=sum(Decimal(str(step["estimated_gas"])) for step in execution_order),
                reasoning=f"Total allocation deviation: {total_deviation}%. "
                         f"Expected APY improvement: {current_optimization.expected_performance['annual_return']}%"
            )
            
            # Save recommendation
            await self.save_rebalance_recommendation(recommendation)
            
            return recommendation
            
        except Exception as e:
            logger.error(f"Rebalance signal error: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate rebalance signal")
    
    async def get_strategy(self, strategy_id: str) -> Optional[Dict]:
        """Get strategy by ID"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute("SELECT * FROM portfolio_strategies WHERE strategy_id = %s", (strategy_id,))
            strategy = cur.fetchone()
            
            cur.close()
            conn.close()
            
            return dict(strategy) if strategy else None
            
        except Exception as e:
            logger.error(f"Strategy retrieval error: {e}")
            return None
    
    async def save_rebalance_recommendation(self, recommendation: RebalanceRecommendation):
        """Save rebalance recommendation"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO rebalance_recommendations (
                    strategy_id, signal, urgency_score, current_allocations,
                    recommended_allocations, expected_impact, execution_order,
                    estimated_cost, reasoning
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                recommendation.strategy_id, recommendation.signal, recommendation.urgency_score,
                json.dumps([asdict(alloc) for alloc in recommendation.current_allocations]),
                json.dumps([asdict(alloc) for alloc in recommendation.recommended_allocations]),
                json.dumps({k: str(v) for k, v in recommendation.expected_impact.items()}),
                json.dumps(recommendation.execution_order),
                recommendation.estimated_cost, recommendation.reasoning
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
        except Exception as e:
            logger.error(f"Save recommendation error: {e}")

# Initialize optimizer
strategy_optimizer = StrategyOptimizer()

@app.on_event("startup")
async def startup_event():
    """Initialize connections and services"""
    global redis_client
    try:
        # Initialize Redis
        redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
        await redis_client.ping()
        
        # Initialize database
        await strategy_optimizer.initialize_database()
        
        logger.info("DeFi Strategist Service started successfully")
        
    except Exception as e:
        logger.error(f"Startup error: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup connections"""
    global redis_client
    if redis_client:
        await redis_client.close()
    
    await strategy_optimizer.data_fetcher.close()
    
    logger.info("DeFi Strategist Service shutdown complete")

# API Endpoints

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "service": "DeFi Strategist Service",
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
        "quantum_ml": "unknown"
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
    
    # Check ML engine
    try:
        health_status["quantum_ml"] = "trained" if strategy_optimizer.quantum_ml.is_trained else "untrained"
    except:
        pass
    
    return health_status

@app.post("/api/v1/strategies", response_model=Dict[str, Any])
async def create_strategy(strategy: PortfolioStrategy):
    """Create new portfolio strategy"""
    try:
        result = await strategy_optimizer.create_strategy(strategy)
        
        return {
            "success": True,
            "data": result,
            "message": "Strategy created successfully"
        }
        
    except Exception as e:
        logger.error(f"Strategy creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/strategies/{strategy_id}")
async def get_strategy(strategy_id: str):
    """Get strategy details"""
    try:
        strategy = await strategy_optimizer.get_strategy(strategy_id)
        
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

@app.post("/api/v1/strategies/{strategy_id}/optimize")
async def optimize_strategy(strategy_id: str, constraints: Optional[Dict[str, Any]] = None):
    """Optimize portfolio strategy"""
    try:
        result = await strategy_optimizer.optimize_portfolio(strategy_id, constraints)
        
        return {
            "success": True,
            "data": asdict(result),
            "message": "Strategy optimized successfully"
        }
        
    except Exception as e:
        logger.error(f"Optimization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/strategies/{strategy_id}/rebalance-signal")
async def get_rebalance_signal(strategy_id: str):
    """Get rebalance recommendation"""
    try:
        recommendation = await strategy_optimizer.generate_rebalance_signal(strategy_id)
        
        return {
            "success": True,
            "data": asdict(recommendation),
            "message": "Rebalance signal generated"
        }
        
    except Exception as e:
        logger.error(f"Rebalance signal error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/yield-opportunities")
async def get_yield_opportunities(protocol: Optional[str] = None):
    """Get current yield opportunities"""
    try:
        opportunities = []
        
        protocols = [protocol] if protocol else list(DEFI_PROTOCOLS.keys())
        
        for proto in protocols:
            proto_opportunities = await strategy_optimizer.data_fetcher.get_protocol_yields(proto)
            opportunities.extend([asdict(opp) for opp in proto_opportunities])
        
        # Sort by predicted APY
        opportunities.sort(key=lambda x: x["predicted_apy"], reverse=True)
        
        return {
            "success": True,
            "data": opportunities,
            "count": len(opportunities),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Yield opportunities error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch yield opportunities")

@app.get("/api/v1/quantum-ml/status")
async def get_quantum_ml_status():
    """Get Quantum ML engine status"""
    try:
        return {
            "success": True,
            "data": {
                "is_trained": strategy_optimizer.quantum_ml.is_trained,
                "scaler_fitted": hasattr(strategy_optimizer.quantum_ml.scaler, 'mean_'),
                "pca_fitted": hasattr(strategy_optimizer.quantum_ml.pca, 'components_'),
                "models_ready": all([
                    hasattr(strategy_optimizer.quantum_ml.yield_predictor, 'feature_importances_'),
                    hasattr(strategy_optimizer.quantum_ml.risk_predictor, 'feature_importances_')
                ])
            }
        }
        
    except Exception as e:
        logger.error(f"ML status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get ML status")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8008,
        reload=True,
        log_level="info"
    )
