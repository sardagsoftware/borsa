# AILYDIAN Bridge Risk Scoring Service
# L2/L3 Bridge Risk Assessment with Real-time Monitoring
# Port: 8011

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import asyncio
import httpx
import json
import logging
import numpy as np
import pandas as pd
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI(
    title="AILYDIAN Bridge Risk Scoring Service",
    description="L2/L3 Bridge Risk Assessment with Real-time Monitoring",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DATABASE_CONFIG = {
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": os.getenv("POSTGRES_PORT", 5432),
    "database": os.getenv("POSTGRES_DB", "ailydian_bridge"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", "password"),
}

# Redis configuration
REDIS_CONFIG = {
    "host": os.getenv("REDIS_HOST", "localhost"),
    "port": os.getenv("REDIS_PORT", 6379),
    "db": os.getenv("REDIS_DB", 6),
    "decode_responses": True,
}

# External API configuration
L2BEAT_API_BASE = "https://l2beat.com/api"
DEFILLAMA_API_BASE = "https://api.llama.fi"
CHAINLINK_API_BASE = "https://api.chain.link"

# Risk scoring thresholds
RISK_THRESHOLDS = {
    "TVL_MIN": 100_000_000,  # $100M minimum TVL for low risk
    "AUDIT_SCORE_MIN": 8.0,   # Minimum audit score for low risk
    "UPTIME_MIN": 99.5,       # Minimum uptime percentage
    "LIQUIDITY_RATIO_MIN": 0.1,  # Minimum liquidity ratio
    "VALIDATOR_COUNT_MIN": 100,   # Minimum validator count
}

# Enums
class RiskLevel(str, Enum):
    VERY_LOW = "VERY_LOW"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class BridgeType(str, Enum):
    OPTIMISTIC_ROLLUP = "OPTIMISTIC_ROLLUP"
    ZK_ROLLUP = "ZK_ROLLUP"
    STATE_CHANNEL = "STATE_CHANNEL"
    PLASMA = "PLASMA"
    SIDECHAIN = "SIDECHAIN"
    VALIDIUM = "VALIDIUM"
    NATIVE_BRIDGE = "NATIVE_BRIDGE"
    THIRD_PARTY_BRIDGE = "THIRD_PARTY_BRIDGE"

class ChainStatus(str, Enum):
    ACTIVE = "ACTIVE"
    DEGRADED = "DEGRADED"
    MAINTENANCE = "MAINTENANCE"
    OFFLINE = "OFFLINE"

# Pydantic models
class BridgeMetrics(BaseModel):
    tvl: Decimal = Field(..., description="Total Value Locked in USD")
    daily_volume: Decimal = Field(..., description="24h volume in USD")
    transaction_count: int = Field(..., description="24h transaction count")
    avg_gas_cost: Decimal = Field(..., description="Average gas cost in USD")
    withdrawal_delay: int = Field(..., description="Withdrawal delay in minutes")
    liquidity_ratio: float = Field(..., description="Available liquidity ratio")
    
    class Config:
        json_encoders = {
            Decimal: lambda v: str(v)
        }

class SecurityScore(BaseModel):
    audit_score: float = Field(..., ge=0.0, le=10.0, description="Security audit score")
    bug_bounty_program: bool = Field(..., description="Has bug bounty program")
    formal_verification: bool = Field(..., description="Uses formal verification")
    multi_sig_threshold: int = Field(..., description="Multi-signature threshold")
    upgrade_delay: int = Field(..., description="Upgrade delay in hours")
    validator_count: int = Field(..., description="Number of validators")
    
class TechnicalRisk(BaseModel):
    uptime_percentage: float = Field(..., ge=0.0, le=100.0)
    avg_block_time: float = Field(..., description="Average block time in seconds")
    finality_time: int = Field(..., description="Transaction finality time in minutes")
    reorg_resistance: float = Field(..., ge=0.0, le=10.0)
    code_complexity_score: float = Field(..., ge=0.0, le=10.0)
    dependency_risk_score: float = Field(..., ge=0.0, le=10.0)

class BridgeInfo(BaseModel):
    bridge_id: str
    name: str
    bridge_type: BridgeType
    source_chain: str
    destination_chain: str
    website: str
    contract_address: str
    status: ChainStatus
    launch_date: datetime
    
class RiskAssessment(BaseModel):
    bridge_id: str
    overall_risk_level: RiskLevel
    risk_score: float = Field(..., ge=0.0, le=100.0)
    metrics: BridgeMetrics
    security: SecurityScore
    technical: TechnicalRisk
    risk_factors: List[str]
    recommendations: List[str]
    last_updated: datetime
    confidence_level: float = Field(..., ge=0.0, le=1.0)

class RiskRequest(BaseModel):
    bridge_id: str
    amount: Optional[Decimal] = None
    include_historical: bool = False
    risk_tolerance: Optional[str] = "medium"

# Data classes for internal use
@dataclass
class L2BeatData:
    tvl: float
    daily_volume: float
    transaction_count: int
    stage: str
    purpose: str
    technology: str
    risks: List[str]

@dataclass
class AuditData:
    firm: str
    score: float
    date: datetime
    issues_found: int
    critical_issues: int
    report_url: str

# Database manager
class BridgeRiskDatabase:
    def __init__(self):
        self.connection = None
    
    async def connect(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(**DATABASE_CONFIG)
            await self.init_tables()
            logger.info("Connected to bridge risk database")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    async def init_tables(self):
        """Initialize database tables"""
        queries = [
            """
            CREATE TABLE IF NOT EXISTS bridge_registry (
                bridge_id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                bridge_type VARCHAR(50) NOT NULL,
                source_chain VARCHAR(100) NOT NULL,
                destination_chain VARCHAR(100) NOT NULL,
                website VARCHAR(500),
                contract_address VARCHAR(100),
                status VARCHAR(50) NOT NULL,
                launch_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS bridge_metrics (
                id SERIAL PRIMARY KEY,
                bridge_id VARCHAR(100) REFERENCES bridge_registry(bridge_id),
                tvl DECIMAL(20,2),
                daily_volume DECIMAL(20,2),
                transaction_count INTEGER,
                avg_gas_cost DECIMAL(10,6),
                withdrawal_delay INTEGER,
                liquidity_ratio DECIMAL(5,4),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS security_scores (
                id SERIAL PRIMARY KEY,
                bridge_id VARCHAR(100) REFERENCES bridge_registry(bridge_id),
                audit_score DECIMAL(3,1),
                bug_bounty_program BOOLEAN,
                formal_verification BOOLEAN,
                multi_sig_threshold INTEGER,
                upgrade_delay INTEGER,
                validator_count INTEGER,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS technical_metrics (
                id SERIAL PRIMARY KEY,
                bridge_id VARCHAR(100) REFERENCES bridge_registry(bridge_id),
                uptime_percentage DECIMAL(5,2),
                avg_block_time DECIMAL(10,3),
                finality_time INTEGER,
                reorg_resistance DECIMAL(3,1),
                code_complexity_score DECIMAL(3,1),
                dependency_risk_score DECIMAL(3,1),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS risk_assessments (
                id SERIAL PRIMARY KEY,
                bridge_id VARCHAR(100) REFERENCES bridge_registry(bridge_id),
                risk_level VARCHAR(20) NOT NULL,
                risk_score DECIMAL(5,2) NOT NULL,
                risk_factors JSONB,
                recommendations JSONB,
                confidence_level DECIMAL(3,2),
                assessment_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS audit_history (
                id SERIAL PRIMARY KEY,
                bridge_id VARCHAR(100) REFERENCES bridge_registry(bridge_id),
                audit_firm VARCHAR(200),
                audit_score DECIMAL(3,1),
                audit_date DATE,
                issues_found INTEGER,
                critical_issues INTEGER,
                report_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS incident_history (
                id SERIAL PRIMARY KEY,
                bridge_id VARCHAR(100) REFERENCES bridge_registry(bridge_id),
                incident_type VARCHAR(100),
                severity VARCHAR(20),
                description TEXT,
                funds_affected DECIMAL(20,2),
                incident_date TIMESTAMP,
                resolution_date TIMESTAMP,
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS liquidity_monitoring (
                id SERIAL PRIMARY KEY,
                bridge_id VARCHAR(100) REFERENCES bridge_registry(bridge_id),
                token_address VARCHAR(100),
                token_symbol VARCHAR(20),
                available_liquidity DECIMAL(20,2),
                utilization_rate DECIMAL(5,4),
                reserve_ratio DECIMAL(5,4),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        ]
        
        # Execute table creation queries
        with self.connection.cursor() as cursor:
            for query in queries:
                cursor.execute(query)
        self.connection.commit()
        
        # Create indexes for performance
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_bridge_metrics_timestamp ON bridge_metrics(timestamp);",
            "CREATE INDEX IF NOT EXISTS idx_risk_assessments_bridge_id ON risk_assessments(bridge_id);",
            "CREATE INDEX IF NOT EXISTS idx_liquidity_monitoring_timestamp ON liquidity_monitoring(timestamp);",
        ]
        
        with self.connection.cursor() as cursor:
            for index in indexes:
                cursor.execute(index)
        self.connection.commit()
        
        logger.info("Bridge risk database tables initialized")

# L2Beat API client
class L2BeatClient:
    def __init__(self):
        self.session = None
    
    async def __aenter__(self):
        self.session = httpx.AsyncClient(timeout=30.0)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.aclose()
    
    async def get_l2beat_data(self, project_name: str) -> Optional[L2BeatData]:
        """Fetch L2Beat data for a specific project"""
        try:
            # L2Beat API endpoints
            tvl_response = await self.session.get(f"{L2BEAT_API_BASE}/tvl/{project_name}")
            activity_response = await self.session.get(f"{L2BEAT_API_BASE}/activity/{project_name}")
            
            if tvl_response.status_code == 200 and activity_response.status_code == 200:
                tvl_data = tvl_response.json()
                activity_data = activity_response.json()
                
                return L2BeatData(
                    tvl=tvl_data.get("tvl", 0),
                    daily_volume=activity_data.get("dailyVolume", 0),
                    transaction_count=activity_data.get("dailyTxCount", 0),
                    stage=tvl_data.get("stage", "Unknown"),
                    purpose=tvl_data.get("purpose", "Unknown"),
                    technology=tvl_data.get("technology", "Unknown"),
                    risks=tvl_data.get("risks", [])
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching L2Beat data for {project_name}: {e}")
            return None
    
    async def get_bridge_list(self) -> List[Dict[str, Any]]:
        """Get list of all bridges from L2Beat"""
        try:
            response = await self.session.get(f"{L2BEAT_API_BASE}/bridges")
            if response.status_code == 200:
                return response.json().get("bridges", [])
            return []
        except Exception as e:
            logger.error(f"Error fetching bridge list: {e}")
            return []

# Risk scoring engine
class RiskScoringEngine:
    def __init__(self, database: BridgeRiskDatabase):
        self.db = database
        self.redis_client = redis.Redis(**REDIS_CONFIG)
    
    def calculate_tvl_risk_score(self, tvl: float) -> float:
        """Calculate risk score based on TVL"""
        if tvl >= 1_000_000_000:  # $1B+
            return 0.0  # Very low risk
        elif tvl >= 500_000_000:   # $500M+
            return 2.0  # Low risk
        elif tvl >= 100_000_000:   # $100M+
            return 4.0  # Medium risk
        elif tvl >= 10_000_000:    # $10M+
            return 7.0  # High risk
        else:
            return 9.0  # Critical risk
    
    def calculate_security_risk_score(self, security: SecurityScore) -> float:
        """Calculate risk score based on security metrics"""
        score = 0.0
        
        # Audit score (0-4 points)
        audit_risk = max(0, 4 - (security.audit_score * 0.4))
        score += audit_risk
        
        # Bug bounty program (-0.5 points if present)
        if security.bug_bounty_program:
            score -= 0.5
        
        # Formal verification (-0.5 points if present)
        if security.formal_verification:
            score -= 0.5
        
        # Multi-sig threshold (0-2 points)
        if security.multi_sig_threshold < 3:
            score += 2.0
        elif security.multi_sig_threshold < 5:
            score += 1.0
        
        # Upgrade delay (0-2 points)
        if security.upgrade_delay < 24:  # Less than 24 hours
            score += 2.0
        elif security.upgrade_delay < 168:  # Less than 1 week
            score += 1.0
        
        # Validator count (0-2 points)
        if security.validator_count < 10:
            score += 2.0
        elif security.validator_count < 50:
            score += 1.0
        
        return max(0.0, min(10.0, score))
    
    def calculate_technical_risk_score(self, technical: TechnicalRisk) -> float:
        """Calculate risk score based on technical metrics"""
        score = 0.0
        
        # Uptime (0-3 points)
        if technical.uptime_percentage < 95.0:
            score += 3.0
        elif technical.uptime_percentage < 99.0:
            score += 1.5
        elif technical.uptime_percentage < 99.5:
            score += 0.5
        
        # Block time (0-2 points)
        if technical.avg_block_time > 60:  # More than 1 minute
            score += 2.0
        elif technical.avg_block_time > 30:  # More than 30 seconds
            score += 1.0
        
        # Finality time (0-2 points)
        if technical.finality_time > 1440:  # More than 24 hours
            score += 2.0
        elif technical.finality_time > 60:   # More than 1 hour
            score += 1.0
        
        # Reorg resistance (0-1 points)
        if technical.reorg_resistance < 5.0:
            score += 1.0
        
        # Code complexity (0-1 points)
        if technical.code_complexity_score > 7.0:
            score += 1.0
        
        # Dependency risk (0-1 points)
        if technical.dependency_risk_score > 7.0:
            score += 1.0
        
        return max(0.0, min(10.0, score))
    
    def calculate_liquidity_risk_score(self, metrics: BridgeMetrics) -> float:
        """Calculate risk score based on liquidity metrics"""
        if metrics.liquidity_ratio < 0.05:  # Less than 5%
            return 3.0
        elif metrics.liquidity_ratio < 0.1:  # Less than 10%
            return 2.0
        elif metrics.liquidity_ratio < 0.2:  # Less than 20%
            return 1.0
        else:
            return 0.0
    
    def calculate_overall_risk_score(
        self, 
        metrics: BridgeMetrics, 
        security: SecurityScore, 
        technical: TechnicalRisk
    ) -> Tuple[float, RiskLevel, float]:
        """Calculate overall risk score and level"""
        # Weight factors for different risk components
        weights = {
            "tvl": 0.25,
            "security": 0.35,
            "technical": 0.25,
            "liquidity": 0.15
        }
        
        # Calculate individual risk scores
        tvl_risk = self.calculate_tvl_risk_score(float(metrics.tvl))
        security_risk = self.calculate_security_risk_score(security)
        technical_risk = self.calculate_technical_risk_score(technical)
        liquidity_risk = self.calculate_liquidity_risk_score(metrics)
        
        # Calculate weighted overall score
        overall_score = (
            tvl_risk * weights["tvl"] +
            security_risk * weights["security"] +
            technical_risk * weights["technical"] +
            liquidity_risk * weights["liquidity"]
        ) * 10  # Scale to 0-100
        
        # Determine risk level
        if overall_score <= 20:
            risk_level = RiskLevel.VERY_LOW
        elif overall_score <= 40:
            risk_level = RiskLevel.LOW
        elif overall_score <= 60:
            risk_level = RiskLevel.MEDIUM
        elif overall_score <= 80:
            risk_level = RiskLevel.HIGH
        else:
            risk_level = RiskLevel.CRITICAL
        
        # Calculate confidence level based on data completeness
        confidence_factors = [
            1.0 if metrics.tvl > 0 else 0.5,
            1.0 if security.audit_score > 0 else 0.3,
            1.0 if technical.uptime_percentage > 0 else 0.7,
            1.0 if metrics.liquidity_ratio > 0 else 0.6
        ]
        confidence_level = np.mean(confidence_factors)
        
        return overall_score, risk_level, confidence_level
    
    def generate_risk_factors(
        self, 
        metrics: BridgeMetrics, 
        security: SecurityScore, 
        technical: TechnicalRisk
    ) -> List[str]:
        """Generate list of risk factors"""
        factors = []
        
        # TVL-based risks
        if metrics.tvl < 100_000_000:
            factors.append("Low TVL increases exit scam risk")
        
        # Security risks
        if security.audit_score < 7.0:
            factors.append("Low security audit score")
        if not security.bug_bounty_program:
            factors.append("No bug bounty program")
        if security.multi_sig_threshold < 3:
            factors.append("Insufficient multi-signature protection")
        if security.upgrade_delay < 168:  # 1 week
            factors.append("Short upgrade delay period")
        
        # Technical risks
        if technical.uptime_percentage < 99.0:
            factors.append("Poor uptime history")
        if technical.finality_time > 1440:  # 24 hours
            factors.append("Long transaction finality time")
        if technical.code_complexity_score > 8.0:
            factors.append("High code complexity")
        
        # Liquidity risks
        if metrics.liquidity_ratio < 0.1:
            factors.append("Low liquidity ratio")
        
        return factors
    
    def generate_recommendations(
        self, 
        risk_level: RiskLevel, 
        factors: List[str]
    ) -> List[str]:
        """Generate risk mitigation recommendations"""
        recommendations = []
        
        if risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            recommendations.append("Consider using alternative bridges with better risk profiles")
            recommendations.append("Limit transaction amounts")
            recommendations.append("Monitor bridge status closely before transactions")
        
        if "Low TVL increases exit scam risk" in factors:
            recommendations.append("Use multiple smaller transactions instead of large ones")
        
        if "Low security audit score" in factors:
            recommendations.append("Wait for additional security audits")
        
        if "Poor uptime history" in factors:
            recommendations.append("Check bridge status before initiating transactions")
        
        if "Low liquidity ratio" in factors:
            recommendations.append("Consider transaction timing during high liquidity periods")
        
        # General recommendations
        if risk_level != RiskLevel.CRITICAL:
            recommendations.append("Monitor transaction progress closely")
            recommendations.append("Keep transaction receipts and bridge documentation")
        
        return recommendations

# Main service class
class BridgeRiskService:
    def __init__(self):
        self.database = BridgeRiskDatabase()
        self.risk_engine = RiskScoringEngine(self.database)
        self.l2beat_client = None
        self.redis_client = redis.Redis(**REDIS_CONFIG)
    
    async def initialize(self):
        """Initialize the service"""
        await self.database.connect()
        logger.info("Bridge Risk Service initialized")
    
    async def get_bridge_risk_assessment(
        self, 
        bridge_id: str, 
        include_historical: bool = False
    ) -> Optional[RiskAssessment]:
        """Get comprehensive risk assessment for a bridge"""
        try:
            # Check cache first
            cache_key = f"bridge_risk:{bridge_id}"
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data and not include_historical:
                return RiskAssessment.parse_raw(cached_data)
            
            # Fetch fresh data
            async with L2BeatClient() as client:
                # Get bridge info
                bridge_info = await self._get_bridge_info(bridge_id)
                if not bridge_info:
                    return None
                
                # Get L2Beat data
                l2beat_data = await client.get_l2beat_data(bridge_info.name.lower())
                
                # Get metrics from database
                metrics = await self._get_bridge_metrics(bridge_id)
                security = await self._get_security_score(bridge_id)
                technical = await self._get_technical_metrics(bridge_id)
                
                # If no recent data, use L2Beat data
                if not metrics and l2beat_data:
                    metrics = BridgeMetrics(
                        tvl=Decimal(str(l2beat_data.tvl)),
                        daily_volume=Decimal(str(l2beat_data.daily_volume)),
                        transaction_count=l2beat_data.transaction_count,
                        avg_gas_cost=Decimal("0.01"),  # Default
                        withdrawal_delay=1440,  # Default 24 hours
                        liquidity_ratio=0.15  # Default 15%
                    )
                
                if not metrics:
                    return None
                
                # Calculate risk assessment
                risk_score, risk_level, confidence = self.risk_engine.calculate_overall_risk_score(
                    metrics, security, technical
                )
                
                risk_factors = self.risk_engine.generate_risk_factors(metrics, security, technical)
                recommendations = self.risk_engine.generate_recommendations(risk_level, risk_factors)
                
                assessment = RiskAssessment(
                    bridge_id=bridge_id,
                    overall_risk_level=risk_level,
                    risk_score=risk_score,
                    metrics=metrics,
                    security=security,
                    technical=technical,
                    risk_factors=risk_factors,
                    recommendations=recommendations,
                    last_updated=datetime.utcnow(),
                    confidence_level=confidence
                )
                
                # Cache the result
                self.redis_client.setex(
                    cache_key, 
                    3600,  # 1 hour
                    assessment.json()
                )
                
                # Store in database
                await self._store_risk_assessment(assessment)
                
                return assessment
                
        except Exception as e:
            logger.error(f"Error getting risk assessment for {bridge_id}: {e}")
            return None
    
    async def _get_bridge_info(self, bridge_id: str) -> Optional[BridgeInfo]:
        """Get bridge information from database"""
        try:
            with self.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    "SELECT * FROM bridge_registry WHERE bridge_id = %s",
                    (bridge_id,)
                )
                row = cursor.fetchone()
                
                if row:
                    return BridgeInfo(**dict(row))
                
                return None
                
        except Exception as e:
            logger.error(f"Error fetching bridge info: {e}")
            return None
    
    async def _get_bridge_metrics(self, bridge_id: str) -> Optional[BridgeMetrics]:
        """Get latest bridge metrics from database"""
        try:
            with self.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT * FROM bridge_metrics 
                    WHERE bridge_id = %s 
                    ORDER BY timestamp DESC 
                    LIMIT 1
                    """,
                    (bridge_id,)
                )
                row = cursor.fetchone()
                
                if row:
                    return BridgeMetrics(
                        tvl=row['tvl'],
                        daily_volume=row['daily_volume'],
                        transaction_count=row['transaction_count'],
                        avg_gas_cost=row['avg_gas_cost'],
                        withdrawal_delay=row['withdrawal_delay'],
                        liquidity_ratio=float(row['liquidity_ratio'])
                    )
                
                return None
                
        except Exception as e:
            logger.error(f"Error fetching bridge metrics: {e}")
            return None
    
    async def _get_security_score(self, bridge_id: str) -> SecurityScore:
        """Get security score from database"""
        try:
            with self.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT * FROM security_scores 
                    WHERE bridge_id = %s 
                    ORDER BY timestamp DESC 
                    LIMIT 1
                    """,
                    (bridge_id,)
                )
                row = cursor.fetchone()
                
                if row:
                    return SecurityScore(
                        audit_score=float(row['audit_score']),
                        bug_bounty_program=row['bug_bounty_program'],
                        formal_verification=row['formal_verification'],
                        multi_sig_threshold=row['multi_sig_threshold'],
                        upgrade_delay=row['upgrade_delay'],
                        validator_count=row['validator_count']
                    )
                
                # Return default values
                return SecurityScore(
                    audit_score=5.0,
                    bug_bounty_program=False,
                    formal_verification=False,
                    multi_sig_threshold=2,
                    upgrade_delay=0,
                    validator_count=5
                )
                
        except Exception as e:
            logger.error(f"Error fetching security score: {e}")
            return SecurityScore(
                audit_score=5.0,
                bug_bounty_program=False,
                formal_verification=False,
                multi_sig_threshold=2,
                upgrade_delay=0,
                validator_count=5
            )
    
    async def _get_technical_metrics(self, bridge_id: str) -> TechnicalRisk:
        """Get technical metrics from database"""
        try:
            with self.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT * FROM technical_metrics 
                    WHERE bridge_id = %s 
                    ORDER BY timestamp DESC 
                    LIMIT 1
                    """,
                    (bridge_id,)
                )
                row = cursor.fetchone()
                
                if row:
                    return TechnicalRisk(
                        uptime_percentage=float(row['uptime_percentage']),
                        avg_block_time=float(row['avg_block_time']),
                        finality_time=row['finality_time'],
                        reorg_resistance=float(row['reorg_resistance']),
                        code_complexity_score=float(row['code_complexity_score']),
                        dependency_risk_score=float(row['dependency_risk_score'])
                    )
                
                # Return default values
                return TechnicalRisk(
                    uptime_percentage=99.0,
                    avg_block_time=12.0,
                    finality_time=15,
                    reorg_resistance=8.0,
                    code_complexity_score=6.0,
                    dependency_risk_score=5.0
                )
                
        except Exception as e:
            logger.error(f"Error fetching technical metrics: {e}")
            return TechnicalRisk(
                uptime_percentage=99.0,
                avg_block_time=12.0,
                finality_time=15,
                reorg_resistance=8.0,
                code_complexity_score=6.0,
                dependency_risk_score=5.0
            )
    
    async def _store_risk_assessment(self, assessment: RiskAssessment):
        """Store risk assessment in database"""
        try:
            with self.database.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO risk_assessments 
                    (bridge_id, risk_level, risk_score, risk_factors, recommendations, 
                     confidence_level, assessment_data)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        assessment.bridge_id,
                        assessment.overall_risk_level.value,
                        assessment.risk_score,
                        json.dumps(assessment.risk_factors),
                        json.dumps(assessment.recommendations),
                        assessment.confidence_level,
                        assessment.json()
                    )
                )
            self.database.connection.commit()
            
        except Exception as e:
            logger.error(f"Error storing risk assessment: {e}")

# Initialize service
bridge_service = BridgeRiskService()

# API endpoints
@app.on_event("startup")
async def startup_event():
    """Initialize service on startup"""
    await bridge_service.initialize()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AILYDIAN Bridge Risk Scoring Service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.post("/api/v1/risk/assess", response_model=RiskAssessment)
async def assess_bridge_risk(request: RiskRequest):
    """Get comprehensive risk assessment for a bridge"""
    assessment = await bridge_service.get_bridge_risk_assessment(
        bridge_id=request.bridge_id,
        include_historical=request.include_historical
    )
    
    if not assessment:
        raise HTTPException(
            status_code=404,
            detail=f"Bridge risk assessment not available for {request.bridge_id}"
        )
    
    return assessment

@app.get("/api/v1/bridges", response_model=List[BridgeInfo])
async def list_bridges():
    """Get list of all supported bridges"""
    try:
        bridges = []
        with bridge_service.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM bridge_registry ORDER BY name")
            rows = cursor.fetchall()
            
            for row in rows:
                bridges.append(BridgeInfo(**dict(row)))
        
        return bridges
        
    except Exception as e:
        logger.error(f"Error listing bridges: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/v1/bridge/{bridge_id}/metrics", response_model=BridgeMetrics)
async def get_bridge_metrics(bridge_id: str):
    """Get current bridge metrics"""
    metrics = await bridge_service._get_bridge_metrics(bridge_id)
    
    if not metrics:
        raise HTTPException(
            status_code=404,
            detail=f"Metrics not found for bridge {bridge_id}"
        )
    
    return metrics

@app.get("/api/v1/bridge/{bridge_id}/security", response_model=SecurityScore)
async def get_bridge_security(bridge_id: str):
    """Get bridge security assessment"""
    security = await bridge_service._get_security_score(bridge_id)
    return security

@app.get("/api/v1/bridge/{bridge_id}/technical", response_model=TechnicalRisk)
async def get_bridge_technical(bridge_id: str):
    """Get bridge technical risk assessment"""
    technical = await bridge_service._get_technical_metrics(bridge_id)
    return technical

@app.get("/api/v1/risk/levels")
async def get_risk_levels():
    """Get available risk levels and their descriptions"""
    return {
        "risk_levels": {
            "VERY_LOW": "Minimal risk - established bridge with strong security",
            "LOW": "Low risk - good security practices and track record",
            "MEDIUM": "Medium risk - some concerns but generally safe",
            "HIGH": "High risk - significant concerns, use with caution",
            "CRITICAL": "Critical risk - avoid or use minimal amounts only"
        },
        "thresholds": RISK_THRESHOLDS
    }

@app.get("/api/v1/bridge/{bridge_id}/history")
async def get_risk_history(bridge_id: str, days: int = 30):
    """Get historical risk assessments for a bridge"""
    try:
        with bridge_service.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                SELECT risk_level, risk_score, confidence_level, created_at
                FROM risk_assessments 
                WHERE bridge_id = %s 
                AND created_at >= %s
                ORDER BY created_at DESC
                """,
                (bridge_id, datetime.utcnow() - timedelta(days=days))
            )
            rows = cursor.fetchall()
            
            return {
                "bridge_id": bridge_id,
                "period_days": days,
                "assessments": [dict(row) for row in rows]
            }
            
    except Exception as e:
        logger.error(f"Error fetching risk history: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8011)
