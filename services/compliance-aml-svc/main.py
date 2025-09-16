"""
AILYDIAN Global Trader Ultra Pro
Compliance & AML Service - Comprehensive transaction monitoring and regulatory compliance
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Tuple, Union
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
import asyncio
import logging
import json
import hashlib
import hmac
import re
import httpx
import redis
import psycopg2
from psycopg2.extras import RealDictCursor, execute_values
import numpy as np
import pandas as pd
from dataclasses import dataclass
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Enums
class RiskLevel(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertType(str, Enum):
    SANCTIONS_MATCH = "sanctions_match"
    AML_SUSPICIOUS = "aml_suspicious"
    KYT_FLAGGED = "kyt_flagged"
    VOLUME_ANOMALY = "volume_anomaly"
    PATTERN_MATCH = "pattern_match"
    REGULATORY_BREACH = "regulatory_breach"

class TransactionStatus(str, Enum):
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    REQUIRES_MANUAL_REVIEW = "requires_manual_review"

class ComplianceAction(str, Enum):
    BLOCK = "block"
    FLAG = "flag"
    MONITOR = "monitor"
    REPORT = "report"
    ESCALATE = "escalate"

# Pydantic Models
class TransactionScreeningRequest(BaseModel):
    transaction_id: str
    user_id: str
    from_address: str
    to_address: str
    amount: Decimal
    currency: str
    transaction_type: str
    metadata: Dict[str, Any] = {}

class ComplianceAlert(BaseModel):
    alert_id: str
    user_id: str
    transaction_id: Optional[str] = None
    alert_type: AlertType
    risk_score: float = Field(..., ge=0.0, le=100.0)
    description: str
    recommended_action: ComplianceAction
    created_at: datetime
    metadata: Dict[str, Any] = {}

class KYTAnalysisRequest(BaseModel):
    address: str
    blockchain: str = "ethereum"
    depth: int = Field(default=3, ge=1, le=5)

class SanctionsCheckRequest(BaseModel):
    entity_name: Optional[str] = None
    address: Optional[str] = None
    entity_type: str = "individual"  # individual, entity, address

class ComplianceReport(BaseModel):
    report_id: str
    report_type: str
    period_start: datetime
    period_end: datetime
    total_transactions: int
    flagged_transactions: int
    blocked_transactions: int
    risk_distribution: Dict[str, int]
    generated_at: datetime

@dataclass
class SanctionsList:
    """OFAC, EU, UN Sanctions Lists"""
    entities: List[Dict[str, Any]]
    addresses: List[str]
    last_updated: datetime

class AMLEngine:
    """Advanced Anti-Money Laundering Engine"""
    
    def __init__(self, redis_client: redis.Redis, db_pool):
        self.redis = redis_client
        self.db_pool = db_pool
        
        # AML Pattern Definitions
        self.suspicious_patterns = {
            "structuring": {
                "description": "Multiple transactions just below reporting threshold",
                "threshold_amount": 10000,
                "time_window_hours": 24,
                "min_transactions": 3
            },
            "rapid_movement": {
                "description": "Rapid movement of funds through multiple accounts",
                "time_window_minutes": 30,
                "min_hops": 3
            },
            "round_number": {
                "description": "Unusual frequency of round number transactions",
                "pattern": r"^[1-9]0+\.0+$"
            },
            "velocity": {
                "description": "Unusual transaction velocity",
                "daily_threshold_multiplier": 10
            }
        }
        
    async def analyze_transaction(self, transaction: TransactionScreeningRequest) -> Dict[str, Any]:
        """Comprehensive transaction analysis"""
        analysis_results = {
            "transaction_id": transaction.transaction_id,
            "risk_score": 0.0,
            "flags": [],
            "patterns_detected": [],
            "recommended_action": ComplianceAction.MONITOR
        }
        
        try:
            # Check for structuring patterns
            structuring_risk = await self._check_structuring_pattern(transaction)
            analysis_results["risk_score"] += structuring_risk["score"]
            if structuring_risk["detected"]:
                analysis_results["flags"].append("Potential structuring detected")
                analysis_results["patterns_detected"].append("structuring")
            
            # Check for rapid movement patterns
            rapid_movement_risk = await self._check_rapid_movement(transaction)
            analysis_results["risk_score"] += rapid_movement_risk["score"]
            if rapid_movement_risk["detected"]:
                analysis_results["flags"].append("Rapid fund movement detected")
                analysis_results["patterns_detected"].append("rapid_movement")
            
            # Check transaction velocity
            velocity_risk = await self._check_velocity_anomaly(transaction)
            analysis_results["risk_score"] += velocity_risk["score"]
            if velocity_risk["detected"]:
                analysis_results["flags"].append("Unusual transaction velocity")
                analysis_results["patterns_detected"].append("velocity_anomaly")
            
            # Check for round number patterns
            if self._is_round_number_pattern(transaction.amount):
                analysis_results["risk_score"] += 15.0
                analysis_results["flags"].append("Round number transaction pattern")
                analysis_results["patterns_detected"].append("round_number")
            
            # Determine recommended action based on risk score
            if analysis_results["risk_score"] >= 80:
                analysis_results["recommended_action"] = ComplianceAction.BLOCK
            elif analysis_results["risk_score"] >= 60:
                analysis_results["recommended_action"] = ComplianceAction.ESCALATE
            elif analysis_results["risk_score"] >= 40:
                analysis_results["recommended_action"] = ComplianceAction.FLAG
            elif analysis_results["risk_score"] >= 20:
                analysis_results["recommended_action"] = ComplianceAction.MONITOR
            
            # Store analysis results
            await self._store_aml_analysis(analysis_results)
            
            return analysis_results
            
        except Exception as e:
            logger.error(f"AML analysis failed: {e}")
            return {
                "transaction_id": transaction.transaction_id,
                "risk_score": 50.0,  # Default medium risk on error
                "flags": ["Analysis failed - manual review required"],
                "patterns_detected": [],
                "recommended_action": ComplianceAction.FLAG
            }
    
    async def _check_structuring_pattern(self, transaction: TransactionScreeningRequest) -> Dict[str, Any]:
        """Check for structuring patterns (multiple transactions below reporting threshold)"""
        pattern = self.suspicious_patterns["structuring"]
        
        async with self.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                await cur.execute("""
                    SELECT COUNT(*) as tx_count, SUM(amount) as total_amount
                    FROM compliance_transactions 
                    WHERE user_id = %s 
                    AND created_at > %s 
                    AND amount < %s
                    AND status != 'rejected'
                """, (
                    transaction.user_id,
                    datetime.utcnow() - timedelta(hours=pattern["time_window_hours"]),
                    pattern["threshold_amount"]
                ))
                result = await cur.fetchone()
                
                if result and result["tx_count"] >= pattern["min_transactions"]:
                    return {
                        "detected": True,
                        "score": 30.0,
                        "details": {
                            "transaction_count": result["tx_count"],
                            "total_amount": float(result["total_amount"]),
                            "pattern": "structuring"
                        }
                    }
                
                return {"detected": False, "score": 0.0}
    
    async def _check_rapid_movement(self, transaction: TransactionScreeningRequest) -> Dict[str, Any]:
        """Check for rapid movement of funds"""
        pattern = self.suspicious_patterns["rapid_movement"]
        
        # This would integrate with blockchain analysis tools
        # For now, simulate based on transaction metadata
        if "rapid_sequence" in transaction.metadata:
            return {
                "detected": True,
                "score": 25.0,
                "details": {"pattern": "rapid_movement"}
            }
        
        return {"detected": False, "score": 0.0}
    
    async def _check_velocity_anomaly(self, transaction: TransactionScreeningRequest) -> Dict[str, Any]:
        """Check for unusual transaction velocity"""
        async with self.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get user's historical daily average
                await cur.execute("""
                    SELECT AVG(daily_volume) as avg_daily_volume
                    FROM (
                        SELECT DATE(created_at) as tx_date, SUM(amount) as daily_volume
                        FROM compliance_transactions 
                        WHERE user_id = %s 
                        AND created_at > %s
                        GROUP BY DATE(created_at)
                    ) daily_volumes
                """, (
                    transaction.user_id,
                    datetime.utcnow() - timedelta(days=30)
                ))
                result = await cur.fetchone()
                
                if result and result["avg_daily_volume"]:
                    avg_daily = float(result["avg_daily_volume"])
                    current_amount = float(transaction.amount)
                    
                    if current_amount > avg_daily * self.suspicious_patterns["velocity"]["daily_threshold_multiplier"]:
                        return {
                            "detected": True,
                            "score": 20.0,
                            "details": {
                                "current_amount": current_amount,
                                "average_daily": avg_daily,
                                "multiplier": current_amount / avg_daily
                            }
                        }
                
                return {"detected": False, "score": 0.0}
    
    def _is_round_number_pattern(self, amount: Decimal) -> bool:
        """Check if amount follows suspicious round number pattern"""
        pattern = self.suspicious_patterns["round_number"]["pattern"]
        return bool(re.match(pattern, str(amount)))
    
    async def _store_aml_analysis(self, analysis: Dict[str, Any]):
        """Store AML analysis results"""
        async with self.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO aml_analyses (
                        transaction_id, risk_score, flags, patterns_detected,
                        recommended_action, analysis_data, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    analysis["transaction_id"],
                    analysis["risk_score"],
                    json.dumps(analysis["flags"]),
                    json.dumps(analysis["patterns_detected"]),
                    analysis["recommended_action"],
                    json.dumps(analysis),
                    datetime.utcnow()
                ))
                await conn.commit()

class KYTEngine:
    """Know Your Transaction - Blockchain Analysis Engine"""
    
    def __init__(self, redis_client: redis.Redis, db_pool):
        self.redis = redis_client
        self.db_pool = db_pool
        
        # KYT Risk Categories
        self.risk_categories = {
            "darknet_markets": {"risk_score": 90, "description": "Associated with darknet marketplaces"},
            "mixer_services": {"risk_score": 85, "description": "Tumbling/mixing services"},
            "sanctions": {"risk_score": 100, "description": "Sanctioned entities"},
            "ransomware": {"risk_score": 95, "description": "Ransomware payments"},
            "terrorist_financing": {"risk_score": 100, "description": "Terrorism financing"},
            "gambling": {"risk_score": 40, "description": "Online gambling services"},
            "exchange_hot_wallet": {"risk_score": 10, "description": "Exchange hot wallet"},
            "defi_protocol": {"risk_score": 15, "description": "DeFi protocol interaction"}
        }
    
    async def analyze_address(self, request: KYTAnalysisRequest) -> Dict[str, Any]:
        """Comprehensive blockchain address analysis"""
        analysis_results = {
            "address": request.address,
            "blockchain": request.blockchain,
            "risk_score": 0.0,
            "risk_categories": [],
            "transaction_history": [],
            "connected_addresses": [],
            "recommendations": []
        }
        
        try:
            # Check against known risky addresses
            risk_assessment = await self._check_address_risk(request.address)
            analysis_results["risk_score"] = risk_assessment["score"]
            analysis_results["risk_categories"] = risk_assessment["categories"]
            
            # Analyze transaction patterns
            tx_patterns = await self._analyze_transaction_patterns(request.address, request.depth)
            analysis_results["transaction_history"] = tx_patterns["transactions"]
            analysis_results["connected_addresses"] = tx_patterns["connections"]
            
            # Generate recommendations
            analysis_results["recommendations"] = await self._generate_kyt_recommendations(analysis_results)
            
            # Store analysis
            await self._store_kyt_analysis(analysis_results)
            
            return analysis_results
            
        except Exception as e:
            logger.error(f"KYT analysis failed for {request.address}: {e}")
            return {
                "address": request.address,
                "blockchain": request.blockchain,
                "risk_score": 50.0,
                "risk_categories": ["analysis_failed"],
                "transaction_history": [],
                "connected_addresses": [],
                "recommendations": ["Manual review required due to analysis failure"]
            }
    
    async def _check_address_risk(self, address: str) -> Dict[str, Any]:
        """Check address against risk databases"""
        # In production, this would query external KYT providers like Chainalysis, Elliptic
        cached_risk = await self.redis.get(f"kyt_risk:{address}")
        if cached_risk:
            return json.loads(cached_risk)
        
        # Simulate risk check
        risk_data = {
            "score": 15.0,  # Default low risk
            "categories": []
        }
        
        # Check against internal blacklist
        async with self.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                await cur.execute("""
                    SELECT risk_category, risk_score, description
                    FROM risky_addresses 
                    WHERE address = %s
                """, (address,))
                
                risk_records = await cur.fetchall()
                if risk_records:
                    risk_data["score"] = max([record["risk_score"] for record in risk_records])
                    risk_data["categories"] = [record["risk_category"] for record in risk_records]
        
        # Cache result
        await self.redis.setex(f"kyt_risk:{address}", 3600, json.dumps(risk_data))
        return risk_data
    
    async def _analyze_transaction_patterns(self, address: str, depth: int) -> Dict[str, Any]:
        """Analyze transaction patterns and connected addresses"""
        # This would integrate with blockchain analytics APIs
        # For simulation, return basic pattern analysis
        return {
            "transactions": [],
            "connections": [],
            "pattern_analysis": {
                "frequent_counterparties": [],
                "unusual_amounts": [],
                "time_patterns": []
            }
        }
    
    async def _generate_kyt_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate KYT-based recommendations"""
        recommendations = []
        
        if analysis["risk_score"] >= 80:
            recommendations.append("Block all transactions - high risk address")
        elif analysis["risk_score"] >= 60:
            recommendations.append("Enhanced monitoring required")
        elif analysis["risk_score"] >= 40:
            recommendations.append("Additional due diligence recommended")
        else:
            recommendations.append("Standard monitoring sufficient")
        
        return recommendations
    
    async def _store_kyt_analysis(self, analysis: Dict[str, Any]):
        """Store KYT analysis results"""
        async with self.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO kyt_analyses (
                        address, blockchain, risk_score, risk_categories,
                        analysis_data, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    analysis["address"],
                    analysis["blockchain"],
                    analysis["risk_score"],
                    json.dumps(analysis["risk_categories"]),
                    json.dumps(analysis),
                    datetime.utcnow()
                ))
                await conn.commit()

class SanctionsEngine:
    """Sanctions Screening Engine"""
    
    def __init__(self, redis_client: redis.Redis, db_pool):
        self.redis = redis_client
        self.db_pool = db_pool
        self.sanctions_lists = {}
        
    async def initialize_sanctions_data(self):
        """Initialize sanctions lists from various sources"""
        try:
            # Load OFAC, EU, UN sanctions lists
            await self._load_ofac_list()
            await self._load_eu_sanctions()
            await self._load_un_sanctions()
            logger.info("Sanctions data initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize sanctions data: {e}")
    
    async def screen_entity(self, request: SanctionsCheckRequest) -> Dict[str, Any]:
        """Screen entity against sanctions lists"""
        screening_results = {
            "entity_name": request.entity_name,
            "address": request.address,
            "entity_type": request.entity_type,
            "is_sanctioned": False,
            "matches": [],
            "risk_score": 0.0,
            "screening_sources": ["OFAC", "EU", "UN"]
        }
        
        try:
            # Name-based screening
            if request.entity_name:
                name_matches = await self._screen_by_name(request.entity_name)
                screening_results["matches"].extend(name_matches)
            
            # Address-based screening
            if request.address:
                address_matches = await self._screen_by_address(request.address)
                screening_results["matches"].extend(address_matches)
            
            # Determine if sanctioned
            screening_results["is_sanctioned"] = len(screening_results["matches"]) > 0
            screening_results["risk_score"] = 100.0 if screening_results["is_sanctioned"] else 0.0
            
            # Store screening result
            await self._store_sanctions_screening(screening_results)
            
            return screening_results
            
        except Exception as e:
            logger.error(f"Sanctions screening failed: {e}")
            return {
                "entity_name": request.entity_name,
                "address": request.address,
                "entity_type": request.entity_type,
                "is_sanctioned": False,
                "matches": [],
                "risk_score": 50.0,  # Medium risk on error
                "screening_sources": [],
                "error": "Screening process failed"
            }
    
    async def _load_ofac_list(self):
        """Load OFAC Specially Designated Nationals (SDN) list"""
        # In production, this would download from OFAC API
        # For now, store in database
        async with self.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    SELECT entity_name, entity_type, addresses, metadata
                    FROM sanctions_lists 
                    WHERE source = 'OFAC' AND is_active = true
                """)
                self.sanctions_lists["OFAC"] = await cur.fetchall()
    
    async def _load_eu_sanctions(self):
        """Load EU sanctions list"""
        async with self.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    SELECT entity_name, entity_type, addresses, metadata
                    FROM sanctions_lists 
                    WHERE source = 'EU' AND is_active = true
                """)
                self.sanctions_lists["EU"] = await cur.fetchall()
    
    async def _load_un_sanctions(self):
        """Load UN sanctions list"""
        async with self.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    SELECT entity_name, entity_type, addresses, metadata
                    FROM sanctions_lists 
                    WHERE source = 'UN' AND is_active = true
                """)
                self.sanctions_lists["UN"] = await cur.fetchall()
    
    async def _screen_by_name(self, entity_name: str) -> List[Dict[str, Any]]:
        """Screen entity by name using fuzzy matching"""
        matches = []
        entity_name_lower = entity_name.lower()
        
        async with self.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Use PostgreSQL fuzzy matching
                await cur.execute("""
                    SELECT entity_name, source, similarity(entity_name, %s) as sim_score
                    FROM sanctions_lists 
                    WHERE similarity(entity_name, %s) > 0.8
                    AND is_active = true
                    ORDER BY sim_score DESC
                """, (entity_name, entity_name))
                
                sanctions_matches = await cur.fetchall()
                for match in sanctions_matches:
                    matches.append({
                        "matched_name": match["entity_name"],
                        "source": match["source"],
                        "similarity_score": match["sim_score"],
                        "match_type": "name"
                    })
        
        return matches
    
    async def _screen_by_address(self, address: str) -> List[Dict[str, Any]]:
        """Screen by blockchain address"""
        matches = []
        
        async with self.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                await cur.execute("""
                    SELECT entity_name, source
                    FROM sanctions_lists 
                    WHERE %s = ANY(addresses)
                    AND is_active = true
                """, (address,))
                
                address_matches = await cur.fetchall()
                for match in address_matches:
                    matches.append({
                        "matched_address": address,
                        "entity_name": match["entity_name"],
                        "source": match["source"],
                        "match_type": "address"
                    })
        
        return matches
    
    async def _store_sanctions_screening(self, screening: Dict[str, Any]):
        """Store sanctions screening results"""
        async with self.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO sanctions_screenings (
                        entity_name, address, entity_type, is_sanctioned,
                        matches, risk_score, screening_data, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    screening["entity_name"],
                    screening["address"],
                    screening["entity_type"],
                    screening["is_sanctioned"],
                    json.dumps(screening["matches"]),
                    screening["risk_score"],
                    json.dumps(screening),
                    datetime.utcnow()
                ))
                await conn.commit()

class ComplianceReportingEngine:
    """Automated Compliance Reporting"""
    
    def __init__(self, redis_client: redis.Redis, db_pool):
        self.redis = redis_client
        self.db_pool = db_pool
    
    async def generate_sar_report(self, period_start: datetime, period_end: datetime) -> Dict[str, Any]:
        """Generate Suspicious Activity Report"""
        async with self.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get suspicious transactions
                await cur.execute("""
                    SELECT ct.*, aa.risk_score, aa.patterns_detected
                    FROM compliance_transactions ct
                    JOIN aml_analyses aa ON ct.transaction_id = aa.transaction_id
                    WHERE ct.created_at BETWEEN %s AND %s
                    AND aa.risk_score >= 60
                    ORDER BY aa.risk_score DESC
                """, (period_start, period_end))
                
                suspicious_transactions = await cur.fetchall()
                
                report = {
                    "report_id": f"SAR_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                    "report_type": "Suspicious Activity Report",
                    "period_start": period_start,
                    "period_end": period_end,
                    "total_suspicious_transactions": len(suspicious_transactions),
                    "transactions": suspicious_transactions,
                    "generated_at": datetime.utcnow()
                }
                
                await self._store_compliance_report(report)
                return report
    
    async def generate_ctr_report(self, period_start: datetime, period_end: datetime) -> Dict[str, Any]:
        """Generate Currency Transaction Report"""
        async with self.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get large transactions (>$10,000)
                await cur.execute("""
                    SELECT *
                    FROM compliance_transactions
                    WHERE created_at BETWEEN %s AND %s
                    AND amount > 10000
                    ORDER BY amount DESC
                """, (period_start, period_end))
                
                large_transactions = await cur.fetchall()
                
                report = {
                    "report_id": f"CTR_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                    "report_type": "Currency Transaction Report",
                    "period_start": period_start,
                    "period_end": period_end,
                    "total_large_transactions": len(large_transactions),
                    "transactions": large_transactions,
                    "generated_at": datetime.utcnow()
                }
                
                await self._store_compliance_report(report)
                return report
    
    async def _store_compliance_report(self, report: Dict[str, Any]):
        """Store compliance report"""
        async with self.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO compliance_reports (
                        report_id, report_type, period_start, period_end,
                        report_data, generated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    report["report_id"],
                    report["report_type"],
                    report["period_start"],
                    report["period_end"],
                    json.dumps(report),
                    report["generated_at"]
                ))
                await conn.commit()

class ComplianceService:
    """Main Compliance & AML Service"""
    
    def __init__(self):
        self.redis_client = None
        self.db_pool = None
        self.aml_engine = None
        self.kyt_engine = None
        self.sanctions_engine = None
        self.reporting_engine = None
        
    async def initialize(self):
        """Initialize all compliance engines"""
        try:
            # Initialize Redis
            self.redis_client = redis.Redis(
                host='localhost',
                port=6379,
                decode_responses=True,
                health_check_interval=30
            )
            
            # Initialize Database Pool
            self.db_pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                host="localhost",
                database="ailydian_compliance",
                user="postgres",
                password="password"
            )
            
            # Initialize engines
            self.aml_engine = AMLEngine(self.redis_client, self.db_pool)
            self.kyt_engine = KYTEngine(self.redis_client, self.db_pool)
            self.sanctions_engine = SanctionsEngine(self.redis_client, self.db_pool)
            self.reporting_engine = ComplianceReportingEngine(self.redis_client, self.db_pool)
            
            # Initialize sanctions data
            await self.sanctions_engine.initialize_sanctions_data()
            
            await self._create_database_schema()
            logger.info("Compliance service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize compliance service: {e}")
            raise
    
    async def _create_database_schema(self):
        """Create database schema for compliance service"""
        schema_sql = """
        -- Compliance Transactions
        CREATE TABLE IF NOT EXISTS compliance_transactions (
            transaction_id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            from_address VARCHAR(255) NOT NULL,
            to_address VARCHAR(255) NOT NULL,
            amount DECIMAL(20, 8) NOT NULL,
            currency VARCHAR(10) NOT NULL,
            transaction_type VARCHAR(50) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending_review',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- AML Analyses
        CREATE TABLE IF NOT EXISTS aml_analyses (
            id SERIAL PRIMARY KEY,
            transaction_id VARCHAR(255) NOT NULL,
            risk_score DECIMAL(5, 2) NOT NULL,
            flags TEXT[] DEFAULT '{}',
            patterns_detected TEXT[] DEFAULT '{}',
            recommended_action VARCHAR(50) NOT NULL,
            analysis_data JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (transaction_id) REFERENCES compliance_transactions(transaction_id)
        );

        -- KYT Analyses
        CREATE TABLE IF NOT EXISTS kyt_analyses (
            id SERIAL PRIMARY KEY,
            address VARCHAR(255) NOT NULL,
            blockchain VARCHAR(50) NOT NULL,
            risk_score DECIMAL(5, 2) NOT NULL,
            risk_categories TEXT[] DEFAULT '{}',
            analysis_data JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Sanctions Lists
        CREATE TABLE IF NOT EXISTS sanctions_lists (
            id SERIAL PRIMARY KEY,
            entity_name VARCHAR(500) NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            source VARCHAR(50) NOT NULL,
            addresses TEXT[] DEFAULT '{}',
            metadata JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Sanctions Screenings
        CREATE TABLE IF NOT EXISTS sanctions_screenings (
            id SERIAL PRIMARY KEY,
            entity_name VARCHAR(500),
            address VARCHAR(255),
            entity_type VARCHAR(50) NOT NULL,
            is_sanctioned BOOLEAN NOT NULL,
            matches JSONB DEFAULT '[]',
            risk_score DECIMAL(5, 2) NOT NULL,
            screening_data JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Risky Addresses
        CREATE TABLE IF NOT EXISTS risky_addresses (
            id SERIAL PRIMARY KEY,
            address VARCHAR(255) UNIQUE NOT NULL,
            risk_category VARCHAR(100) NOT NULL,
            risk_score DECIMAL(5, 2) NOT NULL,
            description TEXT,
            source VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Compliance Alerts
        CREATE TABLE IF NOT EXISTS compliance_alerts (
            alert_id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            transaction_id VARCHAR(255),
            alert_type VARCHAR(50) NOT NULL,
            risk_score DECIMAL(5, 2) NOT NULL,
            description TEXT NOT NULL,
            recommended_action VARCHAR(50) NOT NULL,
            status VARCHAR(50) DEFAULT 'open',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Compliance Reports
        CREATE TABLE IF NOT EXISTS compliance_reports (
            report_id VARCHAR(255) PRIMARY KEY,
            report_type VARCHAR(100) NOT NULL,
            period_start TIMESTAMP NOT NULL,
            period_end TIMESTAMP NOT NULL,
            report_data JSONB DEFAULT '{}',
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_compliance_tx_user_id ON compliance_transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_compliance_tx_created_at ON compliance_transactions(created_at);
        CREATE INDEX IF NOT EXISTS idx_aml_analyses_tx_id ON aml_analyses(transaction_id);
        CREATE INDEX IF NOT EXISTS idx_kyt_analyses_address ON kyt_analyses(address);
        CREATE INDEX IF NOT EXISTS idx_sanctions_entity_name ON sanctions_lists(entity_name);
        CREATE INDEX IF NOT EXISTS idx_risky_addresses_addr ON risky_addresses(address);
        CREATE INDEX IF NOT EXISTS idx_compliance_alerts_user_id ON compliance_alerts(user_id);

        -- Enable pg_trgm extension for fuzzy matching
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
        """
        
        async with self.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute(schema_sql)
                await conn.commit()

# Initialize FastAPI app
app = FastAPI(
    title="AILYDIAN Compliance & AML Service",
    description="Comprehensive transaction monitoring and regulatory compliance",
    version="1.0.0"
)

# Global service instance
compliance_service = ComplianceService()

@app.on_event("startup")
async def startup_event():
    await compliance_service.initialize()

# API Endpoints
@app.post("/api/v1/screen-transaction")
async def screen_transaction(
    request: TransactionScreeningRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Screen transaction for AML/KYT compliance"""
    try:
        # AML Analysis
        aml_results = await compliance_service.aml_engine.analyze_transaction(request)
        
        # KYT Analysis (for blockchain addresses)
        kyt_results = await compliance_service.kyt_engine.analyze_address(
            KYTAnalysisRequest(address=request.to_address, blockchain="ethereum")
        )
        
        # Combined risk assessment
        combined_risk_score = max(aml_results["risk_score"], kyt_results["risk_score"])
        
        # Determine final action
        if combined_risk_score >= 80:
            final_action = ComplianceAction.BLOCK
        elif combined_risk_score >= 60:
            final_action = ComplianceAction.ESCALATE
        elif combined_risk_score >= 40:
            final_action = ComplianceAction.FLAG
        else:
            final_action = ComplianceAction.MONITOR
        
        # Store transaction
        background_tasks.add_task(
            store_compliance_transaction,
            request,
            final_action,
            combined_risk_score
        )
        
        return {
            "transaction_id": request.transaction_id,
            "screening_status": "completed",
            "overall_risk_score": combined_risk_score,
            "recommended_action": final_action,
            "aml_analysis": aml_results,
            "kyt_analysis": kyt_results,
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Transaction screening failed: {e}")
        raise HTTPException(status_code=500, detail=f"Screening failed: {e}")

@app.post("/api/v1/kyt-analysis")
async def kyt_analysis(request: KYTAnalysisRequest) -> Dict[str, Any]:
    """Perform Know Your Transaction analysis"""
    try:
        results = await compliance_service.kyt_engine.analyze_address(request)
        return {
            "analysis_status": "completed",
            "results": results,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"KYT analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"KYT analysis failed: {e}")

@app.post("/api/v1/sanctions-check")
async def sanctions_check(request: SanctionsCheckRequest) -> Dict[str, Any]:
    """Check entity against sanctions lists"""
    try:
        results = await compliance_service.sanctions_engine.screen_entity(request)
        return {
            "screening_status": "completed",
            "results": results,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Sanctions check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Sanctions check failed: {e}")

@app.get("/api/v1/compliance-alerts")
async def get_compliance_alerts(
    user_id: Optional[str] = Query(None),
    alert_type: Optional[AlertType] = Query(None),
    limit: int = Query(50, le=100)
) -> Dict[str, Any]:
    """Get compliance alerts"""
    try:
        async with compliance_service.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = "SELECT * FROM compliance_alerts WHERE 1=1"
                params = []
                
                if user_id:
                    query += " AND user_id = %s"
                    params.append(user_id)
                
                if alert_type:
                    query += " AND alert_type = %s"
                    params.append(alert_type)
                
                query += " ORDER BY created_at DESC LIMIT %s"
                params.append(limit)
                
                await cur.execute(query, params)
                alerts = await cur.fetchall()
                
                return {
                    "alerts": alerts,
                    "total_count": len(alerts),
                    "timestamp": datetime.utcnow()
                }
                
    except Exception as e:
        logger.error(f"Failed to fetch compliance alerts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch alerts: {e}")

@app.post("/api/v1/generate-report")
async def generate_compliance_report(
    report_type: str = Query(..., regex="^(SAR|CTR)$"),
    period_start: datetime = Query(...),
    period_end: datetime = Query(...)
) -> Dict[str, Any]:
    """Generate compliance report"""
    try:
        if report_type == "SAR":
            report = await compliance_service.reporting_engine.generate_sar_report(
                period_start, period_end
            )
        elif report_type == "CTR":
            report = await compliance_service.reporting_engine.generate_ctr_report(
                period_start, period_end
            )
        
        return {
            "report_generation_status": "completed",
            "report": report,
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")

@app.get("/api/v1/risk-statistics")
async def get_risk_statistics(
    period_days: int = Query(30, ge=1, le=365)
) -> Dict[str, Any]:
    """Get risk statistics"""
    try:
        period_start = datetime.utcnow() - timedelta(days=period_days)
        
        async with compliance_service.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Transaction statistics
                await cur.execute("""
                    SELECT 
                        COUNT(*) as total_transactions,
                        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_transactions,
                        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_transactions,
                        COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_transactions
                    FROM compliance_transactions 
                    WHERE created_at > %s
                """, (period_start,))
                tx_stats = await cur.fetchone()
                
                # Risk distribution
                await cur.execute("""
                    SELECT 
                        CASE 
                            WHEN risk_score >= 80 THEN 'critical'
                            WHEN risk_score >= 60 THEN 'high'
                            WHEN risk_score >= 40 THEN 'medium'
                            WHEN risk_score >= 20 THEN 'low'
                            ELSE 'very_low'
                        END as risk_level,
                        COUNT(*) as count
                    FROM aml_analyses 
                    WHERE created_at > %s
                    GROUP BY risk_level
                """, (period_start,))
                risk_distribution = dict(await cur.fetchall())
                
                return {
                    "period_days": period_days,
                    "transaction_statistics": tx_stats,
                    "risk_distribution": risk_distribution,
                    "timestamp": datetime.utcnow()
                }
                
    except Exception as e:
        logger.error(f"Failed to fetch risk statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch statistics: {e}")

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis connection
        await compliance_service.redis_client.ping()
        
        # Check database connection
        async with compliance_service.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1")
        
        return {
            "status": "healthy",
            "services": {
                "redis": "connected",
                "database": "connected",
                "aml_engine": "operational",
                "kyt_engine": "operational",
                "sanctions_engine": "operational"
            },
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow()
        }

async def store_compliance_transaction(
    request: TransactionScreeningRequest,
    action: ComplianceAction,
    risk_score: float
):
    """Store compliance transaction (background task)"""
    try:
        async with compliance_service.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO compliance_transactions (
                        transaction_id, user_id, from_address, to_address,
                        amount, currency, transaction_type, metadata, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    request.transaction_id,
                    request.user_id,
                    request.from_address,
                    request.to_address,
                    request.amount,
                    request.currency,
                    request.transaction_type,
                    json.dumps(request.metadata),
                    datetime.utcnow()
                ))
                await conn.commit()
                
    except Exception as e:
        logger.error(f"Failed to store compliance transaction: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8015)
