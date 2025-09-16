# AILYDIAN Custody Service
# Institutional-Grade Asset Custody with MPC and Multi-Sig
# Port: 8014

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional, Union, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import asyncio
import httpx
import json
import logging
import hashlib
import hmac
import secrets
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import os
import uuid
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI(
    title="AILYDIAN Custody Service",
    description="Institutional-Grade Asset Custody with MPC and Multi-Sig",
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

# Security configuration
security = HTTPBearer()

# Database configuration
DATABASE_CONFIG = {
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": os.getenv("POSTGRES_PORT", 5432),
    "database": os.getenv("POSTGRES_DB", "ailydian_custody"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", "password"),
}

# Redis configuration
REDIS_CONFIG = {
    "host": os.getenv("REDIS_HOST", "localhost"),
    "port": os.getenv("REDIS_PORT", 6379),
    "db": os.getenv("REDIS_DB", 9),
    "decode_responses": False,  # For binary data
}

# Hardware Security Module configuration
HSM_CONFIG = {
    "provider": os.getenv("HSM_PROVIDER", "AWS_CLOUDHSM"),  # AWS_CLOUDHSM, AZURE_HSM, THALES_LUNA
    "cluster_id": os.getenv("HSM_CLUSTER_ID", ""),
    "user_pin": os.getenv("HSM_USER_PIN", ""),
    "partition_label": os.getenv("HSM_PARTITION_LABEL", "ailydian-custody"),
}

# MPC provider configuration
MPC_PROVIDERS = {
    "FIREBLOCKS": {
        "api_url": os.getenv("FIREBLOCKS_API_URL", "https://api.fireblocks.io"),
        "api_key": os.getenv("FIREBLOCKS_API_KEY", ""),
        "private_key_path": os.getenv("FIREBLOCKS_PRIVATE_KEY_PATH", ""),
    },
    "SEPIOR": {
        "api_url": os.getenv("SEPIOR_API_URL", "https://api.sepior.com"),
        "api_key": os.getenv("SEPIOR_API_KEY", ""),
        "workspace_id": os.getenv("SEPIOR_WORKSPACE_ID", ""),
    },
    "COINBASE_CUSTODY": {
        "api_url": os.getenv("COINBASE_CUSTODY_API_URL", "https://api.custody.coinbase.com"),
        "api_key": os.getenv("COINBASE_CUSTODY_API_KEY", ""),
        "api_secret": os.getenv("COINBASE_CUSTODY_API_SECRET", ""),
    }
}

# Blockchain node configurations
BLOCKCHAIN_NODES = {
    "ETHEREUM": {
        "mainnet": os.getenv("ETH_MAINNET_RPC", "https://eth-mainnet.alchemyapi.io/v2/"),
        "sepolia": os.getenv("ETH_SEPOLIA_RPC", "https://eth-sepolia.alchemyapi.io/v2/"),
    },
    "BITCOIN": {
        "mainnet": os.getenv("BTC_MAINNET_RPC", "https://bitcoin-mainnet.gateway.fm"),
        "testnet": os.getenv("BTC_TESTNET_RPC", "https://bitcoin-testnet.gateway.fm"),
    },
    "POLYGON": {
        "mainnet": os.getenv("POLYGON_MAINNET_RPC", "https://polygon-mainnet.alchemyapi.io/v2/"),
        "mumbai": os.getenv("POLYGON_MUMBAI_RPC", "https://polygon-mumbai.alchemyapi.io/v2/"),
    }
}

# Custody service limits and configurations
CUSTODY_LIMITS = {
    "MAX_DAILY_WITHDRAWAL": 10_000_000,  # $10M
    "MAX_SINGLE_WITHDRAWAL": 1_000_000,  # $1M
    "MIN_APPROVAL_THRESHOLD": 0.67,      # 67% approval required
    "MAX_SIGNERS": 20,
    "MIN_SIGNERS": 3,
    "KEY_ROTATION_PERIOD_DAYS": 90,
    "AUDIT_RETENTION_YEARS": 7,
}

# Enums
class AssetType(str, Enum):
    CRYPTOCURRENCY = "CRYPTOCURRENCY"
    TOKEN_ERC20 = "TOKEN_ERC20"
    TOKEN_ERC721 = "TOKEN_ERC721"
    TOKEN_ERC1155 = "TOKEN_ERC1155"
    RWA_TOKEN = "RWA_TOKEN"
    STABLECOIN = "STABLECOIN"

class WalletType(str, Enum):
    HOT_WALLET = "HOT_WALLET"
    WARM_WALLET = "WARM_WALLET"
    COLD_WALLET = "COLD_WALLET"
    MPC_WALLET = "MPC_WALLET"
    MULTISIG_WALLET = "MULTISIG_WALLET"
    HSM_WALLET = "HSM_WALLET"

class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SIGNED = "SIGNED"
    BROADCAST = "BROADCAST"
    CONFIRMED = "CONFIRMED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"

class KeyStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    COMPROMISED = "COMPROMISED"
    ROTATED = "ROTATED"
    DESTROYED = "DESTROYED"

class AuditEventType(str, Enum):
    WALLET_CREATED = "WALLET_CREATED"
    KEY_GENERATED = "KEY_GENERATED"
    KEY_ROTATED = "KEY_ROTATED"
    TRANSACTION_INITIATED = "TRANSACTION_INITIATED"
    TRANSACTION_APPROVED = "TRANSACTION_APPROVED"
    TRANSACTION_REJECTED = "TRANSACTION_REJECTED"
    TRANSACTION_SIGNED = "TRANSACTION_SIGNED"
    TRANSACTION_BROADCAST = "TRANSACTION_BROADCAST"
    WITHDRAWAL_REQUESTED = "WITHDRAWAL_REQUESTED"
    DEPOSIT_RECEIVED = "DEPOSIT_RECEIVED"
    POLICY_UPDATED = "POLICY_UPDATED"
    ACCESS_GRANTED = "ACCESS_GRANTED"
    ACCESS_REVOKED = "ACCESS_REVOKED"

class SecurityLevel(str, Enum):
    STANDARD = "STANDARD"     # Single approval
    HIGH = "HIGH"             # Multi-approval required
    CRITICAL = "CRITICAL"     # HSM + Multi-approval
    INSTITUTIONAL = "INSTITUTIONAL"  # Full compliance suite

# Pydantic models
class CustodyAccount(BaseModel):
    account_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    account_name: str = Field(..., min_length=1, max_length=100)
    account_type: str = Field(..., regex="^(INDIVIDUAL|CORPORATE|INSTITUTIONAL)$")
    security_level: SecurityLevel
    aum_usd: Decimal = Field(default=Decimal("0"))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            Decimal: lambda v: str(v)
        }

class WalletConfig(BaseModel):
    wallet_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str
    wallet_name: str = Field(..., min_length=1, max_length=100)
    wallet_type: WalletType
    blockchain: str = Field(..., min_length=1, max_length=20)
    address: Optional[str] = None
    multisig_threshold: Optional[int] = Field(None, ge=2, le=20)
    signers: List[str] = Field(default_factory=list)
    mpc_provider: Optional[str] = None
    hsm_partition: Optional[str] = None
    
    @validator('signers')
    def validate_signers(cls, v, values):
        if 'multisig_threshold' in values and values['multisig_threshold']:
            if len(v) < values['multisig_threshold']:
                raise ValueError('Number of signers must be >= threshold')
        return v

class AssetBalance(BaseModel):
    balance_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    wallet_id: str
    asset_type: AssetType
    asset_symbol: str = Field(..., min_length=1, max_length=20)
    contract_address: Optional[str] = None
    balance: Decimal = Field(..., ge=0)
    locked_balance: Decimal = Field(default=Decimal("0"), ge=0)
    available_balance: Decimal = Field(..., ge=0)
    usd_value: Optional[Decimal] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            Decimal: lambda v: str(v)
        }

class TransactionRequest(BaseModel):
    transaction_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    wallet_id: str
    transaction_type: str = Field(..., regex="^(WITHDRAWAL|TRANSFER|DEPOSIT)$")
    to_address: str = Field(..., min_length=20, max_length=100)
    asset_symbol: str = Field(..., min_length=1, max_length=20)
    amount: Decimal = Field(..., gt=0)
    gas_limit: Optional[int] = Field(None, gt=0)
    gas_price: Optional[Decimal] = None
    memo: Optional[str] = Field(None, max_length=500)
    requested_by: str
    priority: str = Field(default="NORMAL", regex="^(LOW|NORMAL|HIGH|URGENT)$")
    
    class Config:
        json_encoders = {
            Decimal: lambda v: str(v)
        }

class ApprovalRequest(BaseModel):
    approval_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transaction_id: str
    approver_id: str
    approval_status: ApprovalStatus
    approval_notes: Optional[str] = Field(None, max_length=1000)
    approved_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    
class PolicyRule(BaseModel):
    rule_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str
    rule_name: str = Field(..., min_length=1, max_length=100)
    rule_type: str = Field(..., regex="^(WITHDRAWAL_LIMIT|APPROVAL_THRESHOLD|TIME_LOCK|WHITELIST)$")
    conditions: Dict[str, Any]
    actions: Dict[str, Any]
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AuditEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str
    wallet_id: Optional[str] = None
    transaction_id: Optional[str] = None
    event_type: AuditEventType
    event_data: Dict[str, Any]
    user_id: str
    ip_address: str
    user_agent: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    severity: str = Field(default="INFO", regex="^(INFO|WARN|ERROR|CRITICAL)$")

# Data classes for MPC operations
@dataclass
class MPCKeyShare:
    share_id: str
    party_id: int
    encrypted_share: bytes
    public_key: str
    threshold: int
    total_parties: int

@dataclass
class MPCSignature:
    signature_id: str
    transaction_hash: str
    signature_shares: List[bytes]
    final_signature: Optional[bytes]
    status: str

@dataclass
class HSMKey:
    key_handle: str
    key_label: str
    key_type: str
    algorithm: str
    key_size: int
    created_at: datetime
    last_used: Optional[datetime]

# Database manager
class CustodyDatabase:
    def __init__(self):
        self.connection = None
    
    async def connect(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(**DATABASE_CONFIG)
            await self.init_tables()
            logger.info("Connected to custody database")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    async def init_tables(self):
        """Initialize database tables"""
        queries = [
            """
            CREATE TABLE IF NOT EXISTS custody_accounts (
                account_id VARCHAR(100) PRIMARY KEY,
                client_id VARCHAR(100) NOT NULL,
                account_name VARCHAR(100) NOT NULL,
                account_type VARCHAR(20) NOT NULL,
                security_level VARCHAR(20) NOT NULL,
                aum_usd DECIMAL(20,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS wallets (
                wallet_id VARCHAR(100) PRIMARY KEY,
                account_id VARCHAR(100) REFERENCES custody_accounts(account_id),
                wallet_name VARCHAR(100) NOT NULL,
                wallet_type VARCHAR(20) NOT NULL,
                blockchain VARCHAR(20) NOT NULL,
                address VARCHAR(100),
                multisig_threshold INTEGER,
                mpc_provider VARCHAR(50),
                hsm_partition VARCHAR(100),
                status VARCHAR(20) DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS wallet_signers (
                id SERIAL PRIMARY KEY,
                wallet_id VARCHAR(100) REFERENCES wallets(wallet_id),
                signer_id VARCHAR(100) NOT NULL,
                signer_name VARCHAR(200),
                public_key TEXT,
                role VARCHAR(50) DEFAULT 'SIGNER',
                is_active BOOLEAN DEFAULT TRUE,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS asset_balances (
                balance_id VARCHAR(100) PRIMARY KEY,
                wallet_id VARCHAR(100) REFERENCES wallets(wallet_id),
                asset_type VARCHAR(20) NOT NULL,
                asset_symbol VARCHAR(20) NOT NULL,
                contract_address VARCHAR(100),
                balance DECIMAL(30,8) NOT NULL DEFAULT 0,
                locked_balance DECIMAL(30,8) NOT NULL DEFAULT 0,
                available_balance DECIMAL(30,8) NOT NULL DEFAULT 0,
                usd_value DECIMAL(20,2),
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS transactions (
                transaction_id VARCHAR(100) PRIMARY KEY,
                wallet_id VARCHAR(100) REFERENCES wallets(wallet_id),
                transaction_type VARCHAR(20) NOT NULL,
                from_address VARCHAR(100),
                to_address VARCHAR(100) NOT NULL,
                asset_symbol VARCHAR(20) NOT NULL,
                amount DECIMAL(30,8) NOT NULL,
                gas_limit INTEGER,
                gas_price DECIMAL(20,8),
                transaction_hash VARCHAR(100),
                block_number BIGINT,
                block_hash VARCHAR(100),
                status VARCHAR(20) NOT NULL,
                memo TEXT,
                requested_by VARCHAR(100) NOT NULL,
                priority VARCHAR(10) DEFAULT 'NORMAL',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                confirmed_at TIMESTAMP,
                failure_reason TEXT
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS transaction_approvals (
                approval_id VARCHAR(100) PRIMARY KEY,
                transaction_id VARCHAR(100) REFERENCES transactions(transaction_id),
                approver_id VARCHAR(100) NOT NULL,
                approval_status VARCHAR(20) NOT NULL,
                approval_notes TEXT,
                approved_at TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS policy_rules (
                rule_id VARCHAR(100) PRIMARY KEY,
                account_id VARCHAR(100) REFERENCES custody_accounts(account_id),
                rule_name VARCHAR(100) NOT NULL,
                rule_type VARCHAR(50) NOT NULL,
                conditions JSONB,
                actions JSONB,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS mpc_keys (
                key_id VARCHAR(100) PRIMARY KEY,
                wallet_id VARCHAR(100) REFERENCES wallets(wallet_id),
                provider VARCHAR(50) NOT NULL,
                key_share_data BYTEA,
                public_key TEXT,
                threshold_config JSONB,
                status VARCHAR(20) DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                rotated_at TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS hsm_keys (
                key_handle VARCHAR(200) PRIMARY KEY,
                wallet_id VARCHAR(100) REFERENCES wallets(wallet_id),
                key_label VARCHAR(100) NOT NULL,
                key_type VARCHAR(50) NOT NULL,
                algorithm VARCHAR(50) NOT NULL,
                key_size INTEGER,
                public_key TEXT,
                status VARCHAR(20) DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS signatures (
                signature_id VARCHAR(100) PRIMARY KEY,
                transaction_id VARCHAR(100) REFERENCES transactions(transaction_id),
                signer_id VARCHAR(100) NOT NULL,
                signature_data BYTEA,
                signature_type VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS audit_events (
                event_id VARCHAR(100) PRIMARY KEY,
                account_id VARCHAR(100) REFERENCES custody_accounts(account_id),
                wallet_id VARCHAR(100),
                transaction_id VARCHAR(100),
                event_type VARCHAR(50) NOT NULL,
                event_data JSONB,
                user_id VARCHAR(100) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                severity VARCHAR(10) DEFAULT 'INFO'
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS compliance_reports (
                report_id VARCHAR(100) PRIMARY KEY,
                account_id VARCHAR(100) REFERENCES custody_accounts(account_id),
                report_type VARCHAR(50) NOT NULL,
                period_start DATE,
                period_end DATE,
                report_data JSONB,
                file_path VARCHAR(500),
                generated_by VARCHAR(100),
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
            "CREATE INDEX IF NOT EXISTS idx_wallets_account_id ON wallets(account_id);",
            "CREATE INDEX IF NOT EXISTS idx_asset_balances_wallet_id ON asset_balances(wallet_id);",
            "CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);",
            "CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);",
            "CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);",
            "CREATE INDEX IF NOT EXISTS idx_transaction_approvals_transaction_id ON transaction_approvals(transaction_id);",
            "CREATE INDEX IF NOT EXISTS idx_audit_events_account_id ON audit_events(account_id);",
            "CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp);",
            "CREATE INDEX IF NOT EXISTS idx_policy_rules_account_id ON policy_rules(account_id);",
        ]
        
        with self.connection.cursor() as cursor:
            for index in indexes:
                cursor.execute(index)
        self.connection.commit()
        
        logger.info("Custody database tables initialized")

# HSM Service
class HSMService:
    def __init__(self, database: CustodyDatabase):
        self.db = database
        self.redis_client = redis.Redis(**REDIS_CONFIG)
        self.hsm_config = HSM_CONFIG
    
    async def generate_key(
        self, 
        wallet_id: str, 
        key_label: str, 
        key_type: str = "RSA",
        key_size: int = 2048
    ) -> HSMKey:
        """Generate key in HSM"""
        try:
            # Simulate HSM key generation (in production, use actual HSM SDK)
            key_handle = f"hsm_{uuid.uuid4().hex[:16]}"
            
            # Generate RSA key pair for simulation
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=key_size,
            )
            public_key = private_key.public_key()
            
            # Serialize public key
            public_key_pem = public_key.public_key().serialize(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ).decode()
            
            hsm_key = HSMKey(
                key_handle=key_handle,
                key_label=key_label,
                key_type=key_type,
                algorithm="RSA-PKCS1",
                key_size=key_size,
                created_at=datetime.utcnow(),
                last_used=None
            )
            
            # Store HSM key metadata in database
            await self._store_hsm_key(wallet_id, hsm_key, public_key_pem)
            
            logger.info(f"HSM key generated: {key_handle}")
            return hsm_key
            
        except Exception as e:
            logger.error(f"HSM key generation error: {e}")
            raise
    
    async def sign_with_hsm(
        self, 
        key_handle: str, 
        data: bytes,
        algorithm: str = "RSA-PKCS1"
    ) -> bytes:
        """Sign data using HSM key"""
        try:
            # Simulate HSM signing (in production, use actual HSM SDK)
            # For demo, use software signing
            
            # Generate a deterministic signature for demo
            import hashlib
            signature_input = key_handle.encode() + data
            signature = hashlib.sha256(signature_input).digest()
            
            # Update last used timestamp
            await self._update_hsm_key_usage(key_handle)
            
            logger.info(f"Data signed with HSM key: {key_handle}")
            return signature
            
        except Exception as e:
            logger.error(f"HSM signing error: {e}")
            raise
    
    async def _store_hsm_key(self, wallet_id: str, hsm_key: HSMKey, public_key_pem: str):
        """Store HSM key metadata in database"""
        try:
            with self.db.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO hsm_keys 
                    (key_handle, wallet_id, key_label, key_type, algorithm, 
                     key_size, public_key, status, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        hsm_key.key_handle,
                        wallet_id,
                        hsm_key.key_label,
                        hsm_key.key_type,
                        hsm_key.algorithm,
                        hsm_key.key_size,
                        public_key_pem,
                        KeyStatus.ACTIVE.value,
                        hsm_key.created_at
                    )
                )
            self.db.connection.commit()
            
        except Exception as e:
            logger.error(f"Error storing HSM key: {e}")
            raise
    
    async def _update_hsm_key_usage(self, key_handle: str):
        """Update HSM key last used timestamp"""
        try:
            with self.db.connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE hsm_keys SET last_used = %s WHERE key_handle = %s",
                    (datetime.utcnow(), key_handle)
                )
            self.db.connection.commit()
            
        except Exception as e:
            logger.error(f"Error updating HSM key usage: {e}")

# MPC Service
class MPCService:
    def __init__(self, database: CustodyDatabase):
        self.db = database
        self.redis_client = redis.Redis(**REDIS_CONFIG)
    
    async def generate_mpc_key(
        self, 
        wallet_id: str, 
        threshold: int, 
        total_parties: int,
        provider: str = "FIREBLOCKS"
    ) -> MPCKeyShare:
        """Generate MPC key shares"""
        try:
            config = MPC_PROVIDERS.get(provider, MPC_PROVIDERS["FIREBLOCKS"])
            
            # Simulate MPC key generation
            share_id = str(uuid.uuid4())
            
            # Generate key shares (simplified simulation)
            key_shares = []
            for i in range(total_parties):
                share_data = secrets.token_bytes(32)  # 256-bit key share
                key_shares.append(share_data)
            
            # Generate public key (simulation)
            public_key = secrets.token_hex(64)  # Simulated public key
            
            mpc_key_share = MPCKeyShare(
                share_id=share_id,
                party_id=1,  # This service is party 1
                encrypted_share=key_shares[0],
                public_key=public_key,
                threshold=threshold,
                total_parties=total_parties
            )
            
            # Store MPC key data
            await self._store_mpc_key(wallet_id, mpc_key_share, provider)
            
            logger.info(f"MPC key generated: {share_id}")
            return mpc_key_share
            
        except Exception as e:
            logger.error(f"MPC key generation error: {e}")
            raise
    
    async def sign_with_mpc(
        self, 
        key_id: str, 
        transaction_data: bytes,
        parties: List[int]
    ) -> MPCSignature:
        """Coordinate MPC signing process"""
        try:
            signature_id = str(uuid.uuid4())
            transaction_hash = hashlib.sha256(transaction_data).hexdigest()
            
            # Simulate MPC signing rounds
            signature_shares = []
            for party_id in parties:
                # Generate signature share (simulation)
                share_data = hashlib.sha256(
                    f"{key_id}{party_id}{transaction_hash}".encode()
                ).digest()
                signature_shares.append(share_data)
            
            # Combine signature shares (simulation)
            final_signature = hashlib.sha256(b''.join(signature_shares)).digest()
            
            mpc_signature = MPCSignature(
                signature_id=signature_id,
                transaction_hash=transaction_hash,
                signature_shares=signature_shares,
                final_signature=final_signature,
                status="COMPLETED"
            )
            
            logger.info(f"MPC signature completed: {signature_id}")
            return mpc_signature
            
        except Exception as e:
            logger.error(f"MPC signing error: {e}")
            raise
    
    async def _store_mpc_key(
        self, 
        wallet_id: str, 
        mpc_key_share: MPCKeyShare, 
        provider: str
    ):
        """Store MPC key share in database"""
        try:
            threshold_config = {
                "threshold": mpc_key_share.threshold,
                "total_parties": mpc_key_share.total_parties,
                "party_id": mpc_key_share.party_id
            }
            
            with self.db.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO mpc_keys 
                    (key_id, wallet_id, provider, key_share_data, public_key, threshold_config)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        mpc_key_share.share_id,
                        wallet_id,
                        provider,
                        mpc_key_share.encrypted_share,
                        mpc_key_share.public_key,
                        json.dumps(threshold_config)
                    )
                )
            self.db.connection.commit()
            
        except Exception as e:
            logger.error(f"Error storing MPC key: {e}")
            raise

# Policy Engine
class PolicyEngine:
    def __init__(self, database: CustodyDatabase):
        self.db = database
        self.redis_client = redis.Redis(**REDIS_CONFIG)
    
    async def evaluate_transaction(
        self, 
        account_id: str, 
        transaction: TransactionRequest
    ) -> Tuple[bool, List[str]]:
        """Evaluate transaction against account policies"""
        try:
            policies = await self._get_account_policies(account_id)
            violations = []
            
            for policy in policies:
                if not policy['is_active']:
                    continue
                
                violation = await self._check_policy(policy, transaction)
                if violation:
                    violations.append(violation)
            
            is_compliant = len(violations) == 0
            
            return is_compliant, violations
            
        except Exception as e:
            logger.error(f"Policy evaluation error: {e}")
            return False, [f"Policy evaluation failed: {str(e)}"]
    
    async def _get_account_policies(self, account_id: str) -> List[Dict[str, Any]]:
        """Get active policies for account"""
        try:
            with self.db.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT * FROM policy_rules 
                    WHERE account_id = %s AND is_active = TRUE
                    ORDER BY created_at
                    """,
                    (account_id,)
                )
                return [dict(row) for row in cursor.fetchall()]
                
        except Exception as e:
            logger.error(f"Error fetching policies: {e}")
            return []
    
    async def _check_policy(
        self, 
        policy: Dict[str, Any], 
        transaction: TransactionRequest
    ) -> Optional[str]:
        """Check if transaction violates a specific policy"""
        try:
            rule_type = policy['rule_type']
            conditions = policy['conditions']
            
            if rule_type == "WITHDRAWAL_LIMIT":
                return await self._check_withdrawal_limit(conditions, transaction)
            elif rule_type == "APPROVAL_THRESHOLD":
                return await self._check_approval_threshold(conditions, transaction)
            elif rule_type == "TIME_LOCK":
                return await self._check_time_lock(conditions, transaction)
            elif rule_type == "WHITELIST":
                return await self._check_whitelist(conditions, transaction)
            
            return None
            
        except Exception as e:
            logger.error(f"Policy check error: {e}")
            return f"Policy check failed: {str(e)}"
    
    async def _check_withdrawal_limit(
        self, 
        conditions: Dict[str, Any], 
        transaction: TransactionRequest
    ) -> Optional[str]:
        """Check withdrawal limits"""
        daily_limit = conditions.get('daily_limit_usd', 0)
        single_limit = conditions.get('single_limit_usd', 0)
        
        # Check single transaction limit
        if float(transaction.amount) > single_limit:
            return f"Transaction amount ${transaction.amount} exceeds single limit ${single_limit}"
        
        # Check daily limit (simplified - would need to sum today's transactions)
        # For demo, assume it passes
        return None
    
    async def _check_approval_threshold(
        self, 
        conditions: Dict[str, Any], 
        transaction: TransactionRequest
    ) -> Optional[str]:
        """Check if transaction requires additional approvals"""
        threshold_amount = conditions.get('threshold_amount_usd', 0)
        
        if float(transaction.amount) > threshold_amount:
            return f"Transaction requires additional approval (amount: ${transaction.amount} > threshold: ${threshold_amount})"
        
        return None
    
    async def _check_time_lock(
        self, 
        conditions: Dict[str, Any], 
        transaction: TransactionRequest
    ) -> Optional[str]:
        """Check time lock restrictions"""
        lock_duration = conditions.get('lock_duration_hours', 0)
        
        # For demo, time locks always pass
        return None
    
    async def _check_whitelist(
        self, 
        conditions: Dict[str, Any], 
        transaction: TransactionRequest
    ) -> Optional[str]:
        """Check address whitelist"""
        whitelist = conditions.get('whitelisted_addresses', [])
        
        if whitelist and transaction.to_address not in whitelist:
            return f"Destination address {transaction.to_address} not in whitelist"
        
        return None

# Audit Service
class AuditService:
    def __init__(self, database: CustodyDatabase):
        self.db = database
        self.redis_client = redis.Redis(**REDIS_CONFIG)
    
    async def log_event(self, audit_event: AuditEvent):
        """Log audit event"""
        try:
            with self.db.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO audit_events 
                    (event_id, account_id, wallet_id, transaction_id, event_type, 
                     event_data, user_id, ip_address, user_agent, timestamp, severity)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        audit_event.event_id,
                        audit_event.account_id,
                        audit_event.wallet_id,
                        audit_event.transaction_id,
                        audit_event.event_type.value,
                        json.dumps(audit_event.event_data),
                        audit_event.user_id,
                        audit_event.ip_address,
                        audit_event.user_agent,
                        audit_event.timestamp,
                        audit_event.severity
                    )
                )
            self.db.connection.commit()
            
            logger.info(f"Audit event logged: {audit_event.event_type.value}")
            
        except Exception as e:
            logger.error(f"Audit logging error: {e}")
    
    async def generate_compliance_report(
        self, 
        account_id: str, 
        start_date: datetime, 
        end_date: datetime
    ) -> Dict[str, Any]:
        """Generate compliance report"""
        try:
            with self.db.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Get transaction summary
                cursor.execute(
                    """
                    SELECT 
                        COUNT(*) as total_transactions,
                        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
                        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
                        SUM(amount) as total_volume
                    FROM transactions t
                    JOIN wallets w ON t.wallet_id = w.wallet_id
                    WHERE w.account_id = %s AND t.created_at BETWEEN %s AND %s
                    """,
                    (account_id, start_date, end_date)
                )
                tx_summary = dict(cursor.fetchone())
                
                # Get audit events summary
                cursor.execute(
                    """
                    SELECT event_type, COUNT(*) as count
                    FROM audit_events
                    WHERE account_id = %s AND timestamp BETWEEN %s AND %s
                    GROUP BY event_type
                    ORDER BY count DESC
                    """,
                    (account_id, start_date, end_date)
                )
                event_summary = [dict(row) for row in cursor.fetchall()]
                
                report = {
                    "account_id": account_id,
                    "period": {
                        "start": start_date.isoformat(),
                        "end": end_date.isoformat()
                    },
                    "transaction_summary": tx_summary,
                    "audit_events": event_summary,
                    "generated_at": datetime.utcnow().isoformat()
                }
                
                return report
                
        except Exception as e:
            logger.error(f"Compliance report generation error: {e}")
            raise

# Main custody service
class CustodyService:
    def __init__(self):
        self.database = CustodyDatabase()
        self.hsm_service = HSMService(self.database)
        self.mpc_service = MPCService(self.database)
        self.policy_engine = PolicyEngine(self.database)
        self.audit_service = AuditService(self.database)
        self.redis_client = redis.Redis(**REDIS_CONFIG)
    
    async def initialize(self):
        """Initialize the service"""
        await self.database.connect()
        logger.info("Custody Service initialized")
    
    async def create_custody_account(self, account: CustodyAccount) -> str:
        """Create new custody account"""
        try:
            with self.database.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO custody_accounts 
                    (account_id, client_id, account_name, account_type, security_level, aum_usd)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        account.account_id,
                        account.client_id,
                        account.account_name,
                        account.account_type,
                        account.security_level.value,
                        account.aum_usd
                    )
                )
            self.database.connection.commit()
            
            # Log audit event
            await self.audit_service.log_event(AuditEvent(
                account_id=account.account_id,
                event_type=AuditEventType.WALLET_CREATED,
                event_data={"account_name": account.account_name, "security_level": account.security_level.value},
                user_id=account.client_id,
                ip_address="127.0.0.1"
            ))
            
            return account.account_id
            
        except Exception as e:
            logger.error(f"Account creation error: {e}")
            raise
    
    async def create_wallet(self, wallet_config: WalletConfig) -> str:
        """Create new wallet"""
        try:
            # Store wallet configuration
            with self.database.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO wallets 
                    (wallet_id, account_id, wallet_name, wallet_type, blockchain, 
                     address, multisig_threshold, mpc_provider, hsm_partition)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        wallet_config.wallet_id,
                        wallet_config.account_id,
                        wallet_config.wallet_name,
                        wallet_config.wallet_type.value,
                        wallet_config.blockchain,
                        wallet_config.address,
                        wallet_config.multisig_threshold,
                        wallet_config.mpc_provider,
                        wallet_config.hsm_partition
                    )
                )
                
                # Store signers
                for signer_id in wallet_config.signers:
                    cursor.execute(
                        """
                        INSERT INTO wallet_signers (wallet_id, signer_id)
                        VALUES (%s, %s)
                        """,
                        (wallet_config.wallet_id, signer_id)
                    )
                    
            self.database.connection.commit()
            
            # Generate appropriate keys based on wallet type
            if wallet_config.wallet_type == WalletType.HSM_WALLET:
                await self.hsm_service.generate_key(
                    wallet_config.wallet_id,
                    f"{wallet_config.wallet_name}_key"
                )
            elif wallet_config.wallet_type == WalletType.MPC_WALLET:
                await self.mpc_service.generate_mpc_key(
                    wallet_config.wallet_id,
                    wallet_config.multisig_threshold or 2,
                    len(wallet_config.signers) or 3,
                    wallet_config.mpc_provider or "FIREBLOCKS"
                )
            
            # Log audit event
            await self.audit_service.log_event(AuditEvent(
                account_id=wallet_config.account_id,
                wallet_id=wallet_config.wallet_id,
                event_type=AuditEventType.WALLET_CREATED,
                event_data={
                    "wallet_type": wallet_config.wallet_type.value,
                    "blockchain": wallet_config.blockchain
                },
                user_id="system",
                ip_address="127.0.0.1"
            ))
            
            return wallet_config.wallet_id
            
        except Exception as e:
            logger.error(f"Wallet creation error: {e}")
            raise
    
    async def initiate_transaction(
        self, 
        transaction: TransactionRequest,
        user_id: str,
        ip_address: str
    ) -> str:
        """Initiate custody transaction"""
        try:
            # Get wallet and account info
            wallet_info = await self._get_wallet_info(transaction.wallet_id)
            if not wallet_info:
                raise ValueError("Wallet not found")
            
            # Evaluate against policies
            is_compliant, violations = await self.policy_engine.evaluate_transaction(
                wallet_info['account_id'], 
                transaction
            )
            
            if not is_compliant:
                raise ValueError(f"Policy violations: {', '.join(violations)}")
            
            # Store transaction
            status = TransactionStatus.AWAITING_APPROVAL if float(transaction.amount) > 1000 else TransactionStatus.APPROVED
            
            with self.database.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO transactions 
                    (transaction_id, wallet_id, transaction_type, to_address, asset_symbol,
                     amount, gas_limit, gas_price, status, memo, requested_by, priority)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        transaction.transaction_id,
                        transaction.wallet_id,
                        transaction.transaction_type,
                        transaction.to_address,
                        transaction.asset_symbol,
                        transaction.amount,
                        transaction.gas_limit,
                        transaction.gas_price,
                        status.value,
                        transaction.memo,
                        transaction.requested_by,
                        transaction.priority
                    )
                )
            self.database.connection.commit()
            
            # Log audit event
            await self.audit_service.log_event(AuditEvent(
                account_id=wallet_info['account_id'],
                wallet_id=transaction.wallet_id,
                transaction_id=transaction.transaction_id,
                event_type=AuditEventType.TRANSACTION_INITIATED,
                event_data={
                    "amount": str(transaction.amount),
                    "asset": transaction.asset_symbol,
                    "to_address": transaction.to_address
                },
                user_id=user_id,
                ip_address=ip_address
            ))
            
            return transaction.transaction_id
            
        except Exception as e:
            logger.error(f"Transaction initiation error: {e}")
            raise
    
    async def approve_transaction(
        self, 
        transaction_id: str, 
        approver_id: str, 
        approval: ApprovalRequest
    ) -> bool:
        """Approve or reject transaction"""
        try:
            # Store approval
            with self.database.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO transaction_approvals 
                    (approval_id, transaction_id, approver_id, approval_status, 
                     approval_notes, approved_at, expires_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        approval.approval_id,
                        transaction_id,
                        approver_id,
                        approval.approval_status.value,
                        approval.approval_notes,
                        approval.approved_at,
                        approval.expires_at
                    )
                )
                
                # Update transaction status if approved
                if approval.approval_status == ApprovalStatus.APPROVED:
                    cursor.execute(
                        "UPDATE transactions SET status = %s WHERE transaction_id = %s",
                        (TransactionStatus.APPROVED.value, transaction_id)
                    )
                elif approval.approval_status == ApprovalStatus.REJECTED:
                    cursor.execute(
                        "UPDATE transactions SET status = %s WHERE transaction_id = %s",
                        (TransactionStatus.REJECTED.value, transaction_id)
                    )
                    
            self.database.connection.commit()
            
            # Get transaction info for audit
            tx_info = await self._get_transaction_info(transaction_id)
            
            # Log audit event
            event_type = AuditEventType.TRANSACTION_APPROVED if approval.approval_status == ApprovalStatus.APPROVED else AuditEventType.TRANSACTION_REJECTED
            
            await self.audit_service.log_event(AuditEvent(
                account_id=tx_info['account_id'],
                wallet_id=tx_info['wallet_id'],
                transaction_id=transaction_id,
                event_type=event_type,
                event_data={
                    "approver": approver_id,
                    "notes": approval.approval_notes
                },
                user_id=approver_id,
                ip_address="127.0.0.1"
            ))
            
            return True
            
        except Exception as e:
            logger.error(f"Transaction approval error: {e}")
            raise
    
    async def _get_wallet_info(self, wallet_id: str) -> Optional[Dict[str, Any]]:
        """Get wallet information"""
        try:
            with self.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    "SELECT * FROM wallets WHERE wallet_id = %s",
                    (wallet_id,)
                )
                row = cursor.fetchone()
                return dict(row) if row else None
                
        except Exception as e:
            logger.error(f"Error fetching wallet info: {e}")
            return None
    
    async def _get_transaction_info(self, transaction_id: str) -> Dict[str, Any]:
        """Get transaction information with wallet details"""
        try:
            with self.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    """
                    SELECT t.*, w.account_id 
                    FROM transactions t 
                    JOIN wallets w ON t.wallet_id = w.wallet_id 
                    WHERE t.transaction_id = %s
                    """,
                    (transaction_id,)
                )
                row = cursor.fetchone()
                return dict(row) if row else {}
                
        except Exception as e:
            logger.error(f"Error fetching transaction info: {e}")
            return {}

# Initialize service
custody_service = CustodyService()

# API endpoints
@app.on_event("startup")
async def startup_event():
    """Initialize service on startup"""
    await custody_service.initialize()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AILYDIAN Custody Service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.post("/api/v1/accounts", response_model=dict)
async def create_account(account: CustodyAccount):
    """Create new custody account"""
    account_id = await custody_service.create_custody_account(account)
    return {"account_id": account_id, "status": "created"}

@app.post("/api/v1/wallets", response_model=dict)
async def create_wallet(wallet_config: WalletConfig):
    """Create new wallet"""
    wallet_id = await custody_service.create_wallet(wallet_config)
    return {"wallet_id": wallet_id, "status": "created"}

@app.post("/api/v1/transactions", response_model=dict)
async def initiate_transaction(
    transaction: TransactionRequest,
    user_id: str = Header(..., alias="X-User-ID"),
    ip_address: str = Header(..., alias="X-Forwarded-For")
):
    """Initiate custody transaction"""
    transaction_id = await custody_service.initiate_transaction(
        transaction, user_id, ip_address
    )
    return {"transaction_id": transaction_id, "status": "initiated"}

@app.post("/api/v1/transactions/{transaction_id}/approve", response_model=dict)
async def approve_transaction(
    transaction_id: str,
    approval: ApprovalRequest,
    approver_id: str = Header(..., alias="X-User-ID")
):
    """Approve or reject transaction"""
    success = await custody_service.approve_transaction(
        transaction_id, approver_id, approval
    )
    return {"approved": success, "transaction_id": transaction_id}

@app.get("/api/v1/accounts/{account_id}/wallets")
async def list_account_wallets(account_id: str):
    """List wallets for account"""
    try:
        with custody_service.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT * FROM wallets WHERE account_id = %s ORDER BY created_at DESC",
                (account_id,)
            )
            wallets = [dict(row) for row in cursor.fetchall()]
            
        return {"account_id": account_id, "wallets": wallets}
        
    except Exception as e:
        logger.error(f"Error listing wallets: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/v1/wallets/{wallet_id}/balances")
async def get_wallet_balances(wallet_id: str):
    """Get wallet asset balances"""
    try:
        with custody_service.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT * FROM asset_balances WHERE wallet_id = %s",
                (wallet_id,)
            )
            balances = [dict(row) for row in cursor.fetchall()]
            
        return {"wallet_id": wallet_id, "balances": balances}
        
    except Exception as e:
        logger.error(f"Error fetching balances: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/v1/transactions/{transaction_id}")
async def get_transaction(transaction_id: str):
    """Get transaction details"""
    try:
        transaction_info = await custody_service._get_transaction_info(transaction_id)
        
        if not transaction_info:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Get approvals
        with custody_service.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT * FROM transaction_approvals WHERE transaction_id = %s",
                (transaction_id,)
            )
            approvals = [dict(row) for row in cursor.fetchall()]
        
        transaction_info['approvals'] = approvals
        return transaction_info
        
    except Exception as e:
        logger.error(f"Error fetching transaction: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/v1/accounts/{account_id}/compliance-report")
async def generate_compliance_report(
    account_id: str,
    start_date: datetime,
    end_date: datetime
):
    """Generate compliance report"""
    return await custody_service.audit_service.generate_compliance_report(
        account_id, start_date, end_date
    )

@app.get("/api/v1/audit-events")
async def get_audit_events(
    account_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """Get audit events"""
    try:
        with custody_service.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            if account_id:
                cursor.execute(
                    """
                    SELECT * FROM audit_events 
                    WHERE account_id = %s 
                    ORDER BY timestamp DESC 
                    LIMIT %s OFFSET %s
                    """,
                    (account_id, limit, offset)
                )
            else:
                cursor.execute(
                    """
                    SELECT * FROM audit_events 
                    ORDER BY timestamp DESC 
                    LIMIT %s OFFSET %s
                    """,
                    (limit, offset)
                )
            
            events = [dict(row) for row in cursor.fetchall()]
            
        return {"events": events, "limit": limit, "offset": offset}
        
    except Exception as e:
        logger.error(f"Error fetching audit events: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/v1/supported-assets")
async def get_supported_assets():
    """Get supported asset types and blockchains"""
    return {
        "asset_types": [asset_type.value for asset_type in AssetType],
        "wallet_types": [wallet_type.value for wallet_type in WalletType],
        "blockchains": list(BLOCKCHAIN_NODES.keys()),
        "mpc_providers": list(MPC_PROVIDERS.keys()),
        "security_levels": [level.value for level in SecurityLevel]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8014)
