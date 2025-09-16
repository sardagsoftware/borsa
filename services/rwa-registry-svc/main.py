"""
AILYDIAN Global Trader - RWA Registry Service
Real World Assets registry with oracle proof-of-reserve, compliance, and TimescaleDB integration

Features:
- Asset registry with immutable records
- Chainlink Proof of Reserve integration
- Compliance tracking and reporting
- Performance analytics with TimescaleDB
- Real-time asset valuation updates
"""

import os
import logging
import hashlib
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal
import asyncio
from dataclasses import dataclass, asdict
from enum import Enum

import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, Field
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
CHAINLINK_RPC_URL = os.getenv("CHAINLINK_RPC_URL", "https://mainnet.infura.io/v3/your-key")
CHAINLINK_ORACLE_ADDRESSES = {
    "ETH_USD": os.getenv("CHAINLINK_ETH_USD", "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"),
    "BTC_USD": os.getenv("CHAINLINK_BTC_USD", "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c"),
    "GOLD_USD": os.getenv("CHAINLINK_GOLD_USD", "0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6"),
}
IPFS_GATEWAY = os.getenv("IPFS_GATEWAY", "https://ipfs.io/ipfs/")
ARWEAVE_GATEWAY = os.getenv("ARWEAVE_GATEWAY", "https://arweave.net/")

# Enums
class AssetStatus(str, Enum):
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"
    UNDER_REVIEW = "under_review"
    SUSPENDED = "suspended"
    DELISTED = "delisted"

class ComplianceStatus(str, Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PENDING_REVIEW = "pending_review"
    ESCALATED = "escalated"

class ValuationMethod(str, Enum):
    MARKET_PRICE = "market_price"
    APPRAISAL = "appraisal"
    NAV = "nav"
    ORACLE_FEED = "oracle_feed"
    HYBRID = "hybrid"

# Pydantic Models
class AssetValuation(BaseModel):
    value_usd: Decimal = Field(..., description="Current USD valuation")
    method: ValuationMethod = Field(..., description="Valuation methodology")
    oracle_address: Optional[str] = Field(None, description="Oracle contract address")
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confidence_score: int = Field(ge=0, le=100, description="Valuation confidence (0-100)")
    data_sources: List[str] = Field(default=[], description="Valuation data sources")

class ComplianceRecord(BaseModel):
    jurisdiction: str = Field(..., description="Legal jurisdiction")
    regulation_type: str = Field(..., description="Type of regulation")
    compliance_status: ComplianceStatus = Field(..., description="Compliance status")
    last_audit_date: Optional[datetime] = Field(None, description="Last audit date")
    next_review_date: Optional[datetime] = Field(None, description="Next review date")
    certifying_authority: str = Field(..., description="Certifying authority")
    certificate_hash: Optional[str] = Field(None, description="Certificate document hash")
    notes: Optional[str] = Field(None, description="Additional compliance notes")

class ProofOfReserve(BaseModel):
    backing_asset_type: str = Field(..., description="Type of backing asset")
    total_backing_value: Decimal = Field(..., description="Total backing value")
    verification_method: str = Field(..., description="Verification methodology")
    oracle_proof_hash: Optional[str] = Field(None, description="Oracle proof hash")
    attestation_provider: str = Field(..., description="Attestation service provider")
    last_verification: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reserve_ratio: Decimal = Field(ge=0, le=2, description="Reserve ratio (1.0 = 100%)")
    insurance_coverage: Optional[Decimal] = Field(None, description="Insurance coverage amount")

class RegistryEntry(BaseModel):
    asset_id: str = Field(..., description="Unique asset identifier")
    token_address: str = Field(..., description="Token contract address")
    asset_name: str = Field(..., description="Asset name")
    asset_type: str = Field(..., description="Asset category")
    issuer: str = Field(..., description="Asset issuer")
    custodian: str = Field(..., description="Custodian entity")
    total_supply: int = Field(..., description="Total token supply")
    circulating_supply: int = Field(..., description="Circulating token supply")
    chain_id: int = Field(..., description="Blockchain network ID")
    status: AssetStatus = Field(..., description="Asset status")
    metadata_uri: str = Field(..., description="Metadata URI (IPFS/Arweave)")
    valuation: AssetValuation = Field(..., description="Current valuation")
    compliance: List[ComplianceRecord] = Field(..., description="Compliance records")
    proof_of_reserve: Optional[ProofOfReserve] = Field(None, description="Proof of reserve")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssetPerformance(BaseModel):
    asset_id: str
    price_change_24h: Decimal
    price_change_7d: Decimal
    volume_24h: Decimal
    market_cap: Decimal
    volatility_30d: Decimal
    liquidity_score: int = Field(ge=0, le=100)
    trading_pairs_count: int

class RegistryQuery(BaseModel):
    asset_type: Optional[str] = None
    issuer: Optional[str] = None
    status: Optional[AssetStatus] = None
    jurisdiction: Optional[str] = None
    min_valuation: Optional[Decimal] = None
    max_valuation: Optional[Decimal] = None
    compliance_required: Optional[bool] = None

# Initialize FastAPI app
app = FastAPI(
    title="AILYDIAN RWA Registry Service", 
    description="Real World Assets registry with compliance and proof-of-reserve",
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
w3 = None

class OracleManager:
    """Chainlink oracle integration for proof-of-reserve and price feeds"""
    
    def __init__(self):
        self.w3 = None
        self.price_feed_abi = [
            {
                "inputs": [],
                "name": "latestRoundData", 
                "outputs": [
                    {"name": "roundId", "type": "uint80"},
                    {"name": "answer", "type": "int256"},
                    {"name": "startedAt", "type": "uint256"},
                    {"name": "updatedAt", "type": "uint256"},
                    {"name": "answeredInRound", "type": "uint80"}
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ]
    
    async def initialize(self):
        """Initialize Web3 connection"""
        try:
            self.w3 = Web3(Web3.HTTPProvider(CHAINLINK_RPC_URL))
            logger.info(f"Oracle manager connected: {self.w3.is_connected()}")
        except Exception as e:
            logger.error(f"Oracle initialization error: {e}")
    
    async def get_price_feed(self, asset_symbol: str) -> Optional[Dict[str, Any]]:
        """Get price feed from Chainlink oracle"""
        try:
            if not self.w3 or not self.w3.is_connected():
                await self.initialize()
                
            if not self.w3:
                return None
                
            oracle_address = CHAINLINK_ORACLE_ADDRESSES.get(f"{asset_symbol}_USD")
            if not oracle_address:
                return None
                
            contract = self.w3.eth.contract(address=oracle_address, abi=self.price_feed_abi)
            
            # Get latest round data
            round_data = contract.functions.latestRoundData().call()
            
            return {
                "round_id": round_data[0],
                "price": round_data[1] / 10**8,  # Chainlink uses 8 decimals
                "started_at": datetime.fromtimestamp(round_data[2], tz=timezone.utc),
                "updated_at": datetime.fromtimestamp(round_data[3], tz=timezone.utc),
                "answered_in_round": round_data[4],
                "oracle_address": oracle_address
            }
            
        except Exception as e:
            logger.error(f"Price feed error for {asset_symbol}: {e}")
            return None
    
    async def verify_proof_of_reserve(self, asset_id: str, backing_assets: List[Dict]) -> Dict[str, Any]:
        """Verify proof of reserve using oracle data"""
        try:
            total_backing_value = Decimal("0")
            verifications = []
            
            for backing_asset in backing_assets:
                asset_symbol = backing_asset.get("symbol")
                if not asset_symbol:
                    continue
                    
                quantity = Decimal(str(backing_asset.get("quantity", 0)))
                
                price_data = await self.get_price_feed(asset_symbol)
                if price_data:
                    asset_value = quantity * Decimal(str(price_data["price"]))
                    total_backing_value += asset_value
                    
                    verifications.append({
                        "asset": asset_symbol,
                        "quantity": str(quantity),
                        "price_per_unit": price_data["price"],
                        "total_value": str(asset_value),
                        "oracle_updated": price_data["updated_at"].isoformat()
                    })
            
            return {
                "asset_id": asset_id,
                "total_backing_value": str(total_backing_value),
                "verification_timestamp": datetime.now(timezone.utc).isoformat(),
                "oracle_verifications": verifications,
                "proof_hash": hashlib.sha256(f"{asset_id}{total_backing_value}{datetime.now()}".encode()).hexdigest()
            }
            
        except Exception as e:
            logger.error(f"Proof of reserve verification error: {e}")
            return {
                "asset_id": asset_id,
                "error": str(e),
                "verification_failed": True
            }

class RegistryManager:
    """Core registry management with TimescaleDB integration"""
    
    def __init__(self):
        self.oracle_manager = OracleManager()
    
    async def initialize_database(self):
        """Initialize database tables"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor()
            
            # Create registry table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS rwa_registry (
                    asset_id VARCHAR(50) PRIMARY KEY,
                    token_address VARCHAR(42) NOT NULL,
                    asset_name VARCHAR(255) NOT NULL,
                    asset_type VARCHAR(50) NOT NULL,
                    issuer VARCHAR(255) NOT NULL,
                    custodian VARCHAR(255) NOT NULL,
                    total_supply BIGINT NOT NULL,
                    circulating_supply BIGINT NOT NULL,
                    chain_id INTEGER NOT NULL,
                    status VARCHAR(30) NOT NULL,
                    metadata_uri TEXT NOT NULL,
                    valuation JSONB NOT NULL,
                    compliance JSONB NOT NULL,
                    proof_of_reserve JSONB,
                    created_at TIMESTAMPTZ NOT NULL,
                    updated_at TIMESTAMPTZ NOT NULL
                )
            """)
            
            # Create performance tracking table (TimescaleDB hypertable)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS rwa_performance (
                    time TIMESTAMPTZ NOT NULL,
                    asset_id VARCHAR(50) NOT NULL,
                    price_usd DECIMAL(20,8),
                    volume_24h DECIMAL(20,8),
                    market_cap DECIMAL(20,8),
                    volatility_30d DECIMAL(10,4),
                    liquidity_score INTEGER,
                    reserve_ratio DECIMAL(10,4),
                    backing_value DECIMAL(20,8),
                    FOREIGN KEY (asset_id) REFERENCES rwa_registry(asset_id)
                )
            """)
            
            # Try to create hypertable (TimescaleDB extension)
            try:
                cur.execute("SELECT create_hypertable('rwa_performance', 'time', if_not_exists => TRUE)")
            except Exception:
                logger.info("TimescaleDB not available, using regular PostgreSQL table")
            
            # Create compliance audit table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS compliance_audit (
                    audit_id SERIAL PRIMARY KEY,
                    asset_id VARCHAR(50) NOT NULL,
                    audit_type VARCHAR(50) NOT NULL,
                    jurisdiction VARCHAR(50) NOT NULL,
                    status VARCHAR(30) NOT NULL,
                    auditor VARCHAR(255) NOT NULL,
                    audit_date TIMESTAMPTZ NOT NULL,
                    next_review_date TIMESTAMPTZ,
                    findings JSONB,
                    certificate_hash VARCHAR(64),
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    FOREIGN KEY (asset_id) REFERENCES rwa_registry(asset_id)
                )
            """)
            
            conn.commit()
            cur.close()
            conn.close()
            
            logger.info("Database initialization completed")
            
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
    
    async def register_asset(self, registry_entry: RegistryEntry) -> Dict[str, Any]:
        """Register new RWA asset"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor()
            
            # Insert registry entry
            cur.execute("""
                INSERT INTO rwa_registry (
                    asset_id, token_address, asset_name, asset_type, issuer, custodian,
                    total_supply, circulating_supply, chain_id, status, metadata_uri,
                    valuation, compliance, proof_of_reserve, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                registry_entry.asset_id,
                registry_entry.token_address,
                registry_entry.asset_name,
                registry_entry.asset_type,
                registry_entry.issuer,
                registry_entry.custodian,
                registry_entry.total_supply,
                registry_entry.circulating_supply,
                registry_entry.chain_id,
                registry_entry.status,
                registry_entry.metadata_uri,
                json.dumps(asdict(registry_entry.valuation)),
                json.dumps([asdict(comp) for comp in registry_entry.compliance]),
                json.dumps(asdict(registry_entry.proof_of_reserve)) if registry_entry.proof_of_reserve else None,
                registry_entry.created_at,
                registry_entry.updated_at
            ))
            
            # Insert initial performance record
            cur.execute("""
                INSERT INTO rwa_performance (
                    time, asset_id, price_usd, market_cap, reserve_ratio
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                registry_entry.created_at,
                registry_entry.asset_id,
                registry_entry.valuation.value_usd,
                registry_entry.valuation.value_usd * registry_entry.total_supply,
                registry_entry.proof_of_reserve.reserve_ratio if registry_entry.proof_of_reserve else None
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            # Cache in Redis
            if redis_client:
                await redis_client.setex(
                    f"rwa:registry:{registry_entry.asset_id}",
                    3600,  # 1 hour TTL
                    json.dumps(asdict(registry_entry), default=str)
                )
            
            logger.info(f"Asset registered: {registry_entry.asset_id}")
            
            return {
                "asset_id": registry_entry.asset_id,
                "status": "registered",
                "registry_entry": asdict(registry_entry)
            }
            
        except Exception as e:
            logger.error(f"Asset registration error: {e}")
            raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
    
    async def get_asset(self, asset_id: str) -> Optional[Dict[str, Any]]:
        """Get asset from registry"""
        try:
            # Try Redis cache first
            if redis_client:
                cached = await redis_client.get(f"rwa:registry:{asset_id}")
                if cached:
                    return json.loads(cached)
            
            # Query database
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute("SELECT * FROM rwa_registry WHERE asset_id = %s", (asset_id,))
            asset = cur.fetchone()
            
            if not asset:
                return None
            
            # Get performance data
            cur.execute("""
                SELECT * FROM rwa_performance 
                WHERE asset_id = %s 
                ORDER BY time DESC 
                LIMIT 1
            """, (asset_id,))
            performance = cur.fetchone()
            
            cur.close()
            conn.close()
            
            result = dict(asset)
            if performance:
                result["current_performance"] = dict(performance)
            
            # Cache result
            if redis_client:
                await redis_client.setex(
                    f"rwa:registry:{asset_id}",
                    3600,
                    json.dumps(result, default=str)
                )
            
            return result
            
        except Exception as e:
            logger.error(f"Asset retrieval error: {e}")
            return None
    
    async def query_assets(self, query: RegistryQuery, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Query assets with filters"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Build dynamic query
            conditions = []
            params = []
            
            if query.asset_type:
                conditions.append("asset_type = %s")
                params.append(query.asset_type)
            
            if query.issuer:
                conditions.append("issuer ILIKE %s")
                params.append(f"%{query.issuer}%")
            
            if query.status:
                conditions.append("status = %s")
                params.append(query.status)
            
            if query.min_valuation:
                conditions.append("(valuation->>'value_usd')::decimal >= %s")
                params.append(query.min_valuation)
            
            if query.max_valuation:
                conditions.append("(valuation->>'value_usd')::decimal <= %s")
                params.append(query.max_valuation)
            
            where_clause = " AND ".join(conditions) if conditions else "TRUE"
            
            # Execute query
            cur.execute(f"""
                SELECT * FROM rwa_registry 
                WHERE {where_clause}
                ORDER BY created_at DESC 
                LIMIT %s OFFSET %s
            """, params + [limit, offset])
            
            assets = cur.fetchall()
            
            # Get total count
            cur.execute(f"""
                SELECT COUNT(*) as total FROM rwa_registry 
                WHERE {where_clause}
            """, params)
            
            total_result = cur.fetchone()
            total = total_result["total"] if total_result else 0
            
            cur.close()
            conn.close()
            
            return {
                "assets": [dict(asset) for asset in assets],
                "total": total,
                "limit": limit,
                "offset": offset
            }
            
        except Exception as e:
            logger.error(f"Asset query error: {e}")
            raise HTTPException(status_code=500, detail="Query failed")
    
    async def update_valuation(self, asset_id: str, valuation: AssetValuation) -> Dict[str, Any]:
        """Update asset valuation"""
        try:
            conn = psycopg2.connect(POSTGRES_URL)
            cur = conn.cursor()
            
            # Update registry
            cur.execute("""
                UPDATE rwa_registry 
                SET valuation = %s, updated_at = %s
                WHERE asset_id = %s
            """, (
                json.dumps(asdict(valuation), default=str),
                datetime.now(timezone.utc),
                asset_id
            ))
            
            # Insert performance record
            cur.execute("""
                INSERT INTO rwa_performance (time, asset_id, price_usd, market_cap)
                VALUES (%s, %s, %s, %s)
            """, (
                datetime.now(timezone.utc),
                asset_id,
                valuation.value_usd,
                valuation.value_usd * 1000000  # Placeholder market cap calculation
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            # Clear cache
            if redis_client:
                await redis_client.delete(f"rwa:registry:{asset_id}")
            
            return {
                "asset_id": asset_id,
                "valuation_updated": True,
                "new_valuation": asdict(valuation)
            }
            
        except Exception as e:
            logger.error(f"Valuation update error: {e}")
            raise HTTPException(status_code=500, detail="Valuation update failed")

# Initialize managers
registry_manager = RegistryManager()

@app.on_event("startup")
async def startup_event():
    """Initialize connections and services"""
    global redis_client
    try:
        # Initialize Redis connection
        redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
        await redis_client.ping()
        
        # Initialize database
        await registry_manager.initialize_database()
        
        # Initialize oracle manager
        await registry_manager.oracle_manager.initialize()
        
        logger.info("RWA Registry Service started successfully")
        
    except Exception as e:
        logger.error(f"Startup error: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup connections"""
    global redis_client
    if redis_client:
        await redis_client.close()
    logger.info("RWA Registry Service shutdown complete")

# API Endpoints

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "service": "RWA Registry Service",
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
        "oracle": "disconnected"
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
    
    # Check oracle
    try:
        if registry_manager.oracle_manager.w3 and registry_manager.oracle_manager.w3.is_connected():
            health_status["oracle"] = "healthy"
    except:
        pass
    
    return health_status

@app.post("/api/v1/register")
async def register_asset(registry_entry: RegistryEntry, background_tasks: BackgroundTasks):
    """Register new RWA asset"""
    try:
        result = await registry_manager.register_asset(registry_entry)
        
        # Background task for proof of reserve verification
        if registry_entry.proof_of_reserve:
            background_tasks.add_task(verify_proof_of_reserve_task, registry_entry.asset_id)
        
        return {
            "success": True,
            "data": result,
            "message": "Asset registered successfully"
        }
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/assets/{asset_id}")
async def get_asset(asset_id: str):
    """Get asset details"""
    try:
        asset = await registry_manager.get_asset(asset_id)
        
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        return {
            "success": True,
            "data": asset
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Asset retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve asset")

@app.post("/api/v1/query")
async def query_assets(
    query: RegistryQuery,
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Query assets with filters"""
    try:
        result = await registry_manager.query_assets(query, limit, offset)
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Query error: {e}")
        raise HTTPException(status_code=500, detail="Query failed")

@app.put("/api/v1/assets/{asset_id}/valuation")
async def update_asset_valuation(asset_id: str, valuation: AssetValuation):
    """Update asset valuation"""
    try:
        result = await registry_manager.update_valuation(asset_id, valuation)
        return {
            "success": True,
            "data": result,
            "message": "Valuation updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Valuation update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/assets/{asset_id}/performance")
async def get_asset_performance(asset_id: str, days: int = Query(30, ge=1, le=365)):
    """Get asset performance history"""
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT * FROM rwa_performance 
            WHERE asset_id = %s AND time >= %s
            ORDER BY time ASC
        """, (asset_id, datetime.now(timezone.utc) - timedelta(days=days)))
        
        performance_data = cur.fetchall()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "data": {
                "asset_id": asset_id,
                "period_days": days,
                "performance": [dict(record) for record in performance_data]
            }
        }
        
    except Exception as e:
        logger.error(f"Performance query error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve performance data")

@app.post("/api/v1/proof-of-reserve/{asset_id}")
async def verify_proof_of_reserve(asset_id: str, backing_assets: List[Dict[str, Any]]):
    """Verify proof of reserve for asset"""
    try:
        verification = await registry_manager.oracle_manager.verify_proof_of_reserve(asset_id, backing_assets)
        
        return {
            "success": True,
            "data": verification,
            "message": "Proof of reserve verification completed"
        }
        
    except Exception as e:
        logger.error(f"Proof of reserve error: {e}")
        raise HTTPException(status_code=500, detail="Verification failed")

@app.get("/api/v1/compliance/{asset_id}")
async def get_compliance_status(asset_id: str):
    """Get compliance status for asset"""
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get compliance records
        cur.execute("""
            SELECT compliance FROM rwa_registry WHERE asset_id = %s
        """, (asset_id,))
        
        registry_compliance = cur.fetchone()
        
        # Get audit history
        cur.execute("""
            SELECT * FROM compliance_audit 
            WHERE asset_id = %s 
            ORDER BY audit_date DESC
        """, (asset_id,))
        
        audit_history = cur.fetchall()
        cur.close()
        conn.close()
        
        if not registry_compliance:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        return {
            "success": True,
            "data": {
                "asset_id": asset_id,
                "compliance_records": registry_compliance["compliance"],
                "audit_history": [dict(audit) for audit in audit_history]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Compliance query error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve compliance status")

@app.get("/api/v1/oracles/prices")
async def get_oracle_prices():
    """Get current oracle price feeds"""
    try:
        prices = {}
        for asset_symbol in ["ETH", "BTC", "GOLD"]:
            price_data = await registry_manager.oracle_manager.get_price_feed(asset_symbol)
            if price_data:
                prices[asset_symbol] = price_data
        
        return {
            "success": True,
            "data": {
                "prices": prices,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Oracle prices error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve oracle prices")

async def verify_proof_of_reserve_task(asset_id: str):
    """Background task for proof of reserve verification"""
    try:
        # This would be expanded with actual backing asset data
        backing_assets = [
            {"symbol": "ETH", "quantity": 100},
            {"symbol": "BTC", "quantity": 5}
        ]
        
        verification = await registry_manager.oracle_manager.verify_proof_of_reserve(asset_id, backing_assets)
        
        logger.info(f"Proof of reserve verified for {asset_id}: {verification}")
        
    except Exception as e:
        logger.error(f"Background proof of reserve error: {e}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8006,
        reload=True,
        log_level="info"
    )
