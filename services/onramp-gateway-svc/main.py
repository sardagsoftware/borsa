# AILYDIAN Onramp Gateway Service
# Fiat-to-Crypto Conversion with KYC Integration
# Port: 8013

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator, EmailStr
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta, date
from dataclasses import dataclass
from enum import Enum
import asyncio
import httpx
import json
import logging
import hashlib
import hmac
import base64
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import os
import uuid
from cryptography.fernet import Fernet
import aiofiles
import re
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI(
    title="AILYDIAN Onramp Gateway Service",
    description="Fiat-to-Crypto Conversion with KYC Integration",
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
    "database": os.getenv("POSTGRES_DB", "ailydian_onramp"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", "password"),
}

# Redis configuration
REDIS_CONFIG = {
    "host": os.getenv("REDIS_HOST", "localhost"),
    "port": os.getenv("REDIS_PORT", 6379),
    "db": os.getenv("REDIS_DB", 8),
    "decode_responses": True,
}

# Encryption configuration
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key())
cipher_suite = Fernet(ENCRYPTION_KEY)

# KYC provider configuration
KYC_PROVIDERS = {
    "JUMIO": {
        "api_url": os.getenv("JUMIO_API_URL", "https://api.jumio.com"),
        "api_token": os.getenv("JUMIO_API_TOKEN", ""),
        "secret": os.getenv("JUMIO_SECRET", ""),
    },
    "ONFIDO": {
        "api_url": os.getenv("ONFIDO_API_URL", "https://api.onfido.com"),
        "api_token": os.getenv("ONFIDO_API_TOKEN", ""),
    },
    "SUMSUB": {
        "api_url": os.getenv("SUMSUB_API_URL", "https://api.sumsub.com"),
        "app_token": os.getenv("SUMSUB_APP_TOKEN", ""),
        "secret": os.getenv("SUMSUB_SECRET", ""),
    }
}

# Payment processor configuration
PAYMENT_PROCESSORS = {
    "STRIPE": {
        "api_url": "https://api.stripe.com",
        "secret_key": os.getenv("STRIPE_SECRET_KEY", ""),
        "publishable_key": os.getenv("STRIPE_PUBLISHABLE_KEY", ""),
    },
    "PLAID": {
        "api_url": "https://production.plaid.com",
        "client_id": os.getenv("PLAID_CLIENT_ID", ""),
        "secret": os.getenv("PLAID_SECRET", ""),
    },
    "ADYEN": {
        "api_url": "https://checkout-test.adyen.com",
        "api_key": os.getenv("ADYEN_API_KEY", ""),
        "merchant_account": os.getenv("ADYEN_MERCHANT_ACCOUNT", ""),
    }
}

# Crypto exchange integration
CRYPTO_EXCHANGES = {
    "BINANCE": {
        "api_url": "https://api.binance.com",
        "api_key": os.getenv("BINANCE_API_KEY", ""),
        "secret": os.getenv("BINANCE_SECRET", ""),
    },
    "COINBASE": {
        "api_url": "https://api.coinbase.com",
        "api_key": os.getenv("COINBASE_API_KEY", ""),
        "secret": os.getenv("COINBASE_SECRET", ""),
    },
    "KRAKEN": {
        "api_url": "https://api.kraken.com",
        "api_key": os.getenv("KRAKEN_API_KEY", ""),
        "secret": os.getenv("KRAKEN_SECRET", ""),
    }
}

# Transaction limits and fees
ONRAMP_LIMITS = {
    "KYC_LEVEL_1": {"daily": 1000, "monthly": 5000, "fee_rate": 0.025},    # 2.5%
    "KYC_LEVEL_2": {"daily": 10000, "monthly": 50000, "fee_rate": 0.02},   # 2.0%
    "KYC_LEVEL_3": {"daily": 50000, "monthly": 250000, "fee_rate": 0.015}, # 1.5%
    "INSTITUTIONAL": {"daily": 1000000, "monthly": 10000000, "fee_rate": 0.01}, # 1.0%
}

# Supported jurisdictions and their requirements
JURISDICTIONS = {
    "US": {
        "kyc_requirements": ["IDENTITY", "ADDRESS", "SSN", "BANK_ACCOUNT"],
        "aml_required": True,
        "max_daily": 50000,
        "restricted_states": ["NY", "TX", "WA"],
    },
    "EU": {
        "kyc_requirements": ["IDENTITY", "ADDRESS", "BANK_ACCOUNT"],
        "aml_required": True,
        "max_daily": 30000,
        "restricted_countries": [],
    },
    "UK": {
        "kyc_requirements": ["IDENTITY", "ADDRESS", "BANK_ACCOUNT"],
        "aml_required": True,
        "max_daily": 25000,
        "restricted_areas": [],
    },
    "APAC": {
        "kyc_requirements": ["IDENTITY", "ADDRESS"],
        "aml_required": True,
        "max_daily": 20000,
        "restricted_countries": ["CN", "KP"],
    }
}

# Enums
class KycLevel(str, Enum):
    LEVEL_0 = "LEVEL_0"  # No verification
    LEVEL_1 = "LEVEL_1"  # Basic identity
    LEVEL_2 = "LEVEL_2"  # Enhanced verification
    LEVEL_3 = "LEVEL_3"  # Full verification
    INSTITUTIONAL = "INSTITUTIONAL"  # Institutional KYC

class KycStatus(str, Enum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    PROCESSING = "PROCESSING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    NEEDS_REVIEW = "NEEDS_REVIEW"

class DocumentType(str, Enum):
    PASSPORT = "PASSPORT"
    DRIVERS_LICENSE = "DRIVERS_LICENSE"
    NATIONAL_ID = "NATIONAL_ID"
    RESIDENCE_PERMIT = "RESIDENCE_PERMIT"
    UTILITY_BILL = "UTILITY_BILL"
    BANK_STATEMENT = "BANK_STATEMENT"
    PAYSLIP = "PAYSLIP"
    TAX_RETURN = "TAX_RETURN"

class PaymentMethodType(str, Enum):
    BANK_TRANSFER = "BANK_TRANSFER"
    DEBIT_CARD = "DEBIT_CARD"
    CREDIT_CARD = "CREDIT_CARD"
    ACH = "ACH"
    SEPA = "SEPA"
    FASTER_PAYMENTS = "FASTER_PAYMENTS"
    WIRE_TRANSFER = "WIRE_TRANSFER"

class OnrampStatus(str, Enum):
    PENDING = "PENDING"
    PAYMENT_PROCESSING = "PAYMENT_PROCESSING"
    PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED"
    CRYPTO_PURCHASING = "CRYPTO_PURCHASING"
    CRYPTO_TRANSFERRING = "CRYPTO_TRANSFERRING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"

class Currency(str, Enum):
    # Fiat currencies
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    JPY = "JPY"
    CHF = "CHF"
    CAD = "CAD"
    AUD = "AUD"
    
    # Cryptocurrencies
    BTC = "BTC"
    ETH = "ETH"
    USDC = "USDC"
    USDT = "USDT"
    DAI = "DAI"
    WETH = "WETH"
    MATIC = "MATIC"
    AVAX = "AVAX"

# Pydantic models
class PersonalInfo(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    middle_name: Optional[str] = Field(None, max_length=50)
    date_of_birth: date
    nationality: str = Field(..., min_length=2, max_length=3)
    place_of_birth: Optional[str] = Field(None, max_length=100)
    gender: Optional[str] = Field(None, regex="^(M|F|O)$")
    
    @validator('date_of_birth')
    def validate_age(cls, v):
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError('Must be at least 18 years old')
        if age > 120:
            raise ValueError('Invalid date of birth')
        return v

class Address(BaseModel):
    street_address: str = Field(..., min_length=5, max_length=200)
    city: str = Field(..., min_length=2, max_length=100)
    state_province: Optional[str] = Field(None, max_length=100)
    postal_code: str = Field(..., min_length=3, max_length=20)
    country: str = Field(..., min_length=2, max_length=3)
    
class ContactInfo(BaseModel):
    email: EmailStr
    phone_number: str = Field(..., regex=r'^\+[1-9]\d{1,14}$')
    preferred_language: Optional[str] = Field("en", max_length=5)

class Document(BaseModel):
    document_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_type: DocumentType
    document_number: str = Field(..., min_length=5, max_length=50)
    issuing_country: str = Field(..., min_length=2, max_length=3)
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    file_path: Optional[str] = None
    verification_status: KycStatus = KycStatus.PENDING
    
class KycSubmission(BaseModel):
    submission_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    kyc_level: KycLevel
    personal_info: PersonalInfo
    address: Address
    contact_info: ContactInfo
    documents: List[Document]
    provider: str = "JUMIO"
    status: KycStatus = KycStatus.PENDING
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    risk_score: Optional[float] = Field(None, ge=0.0, le=100.0)

class PaymentMethod(BaseModel):
    method_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    method_type: PaymentMethodType
    provider: str  # STRIPE, PLAID, ADYEN
    account_name: str
    account_details: Dict[str, Any]  # Encrypted account details
    currency: str
    country: str
    is_verified: bool = False
    verification_date: Optional[datetime] = None
    daily_limit: Decimal = Field(default=Decimal("1000"))
    monthly_limit: Decimal = Field(default=Decimal("5000"))
    
    class Config:
        json_encoders = {
            Decimal: lambda v: str(v)
        }

class OnrampQuote(BaseModel):
    quote_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fiat_amount: Decimal = Field(..., gt=0)
    fiat_currency: Currency
    crypto_amount: Decimal = Field(..., gt=0)
    crypto_currency: Currency
    exchange_rate: Decimal = Field(..., gt=0)
    fee_amount: Decimal = Field(..., ge=0)
    total_amount: Decimal = Field(..., gt=0)  # fiat_amount + fee_amount
    quote_expires_at: datetime
    estimated_completion: timedelta
    
    class Config:
        json_encoders = {
            Decimal: lambda v: str(v)
        }

class OnrampRequest(BaseModel):
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    quote_id: str
    payment_method_id: str
    destination_address: str = Field(..., min_length=20, max_length=100)
    destination_network: str = Field(default="ethereum")
    
    @validator('destination_address')
    def validate_eth_address(cls, v):
        if not re.match(r'^0x[a-fA-F0-9]{40}$', v):
            raise ValueError('Invalid Ethereum address format')
        return v.lower()

class OnrampTransaction(BaseModel):
    transaction_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    request_id: str
    user_id: str
    status: OnrampStatus
    fiat_amount: Decimal
    fiat_currency: Currency
    crypto_amount: Decimal
    crypto_currency: Currency
    fee_amount: Decimal
    exchange_rate: Decimal
    payment_method_id: str
    payment_processor_id: Optional[str] = None
    crypto_transaction_hash: Optional[str] = None
    destination_address: str
    destination_network: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    failure_reason: Optional[str] = None
    
    class Config:
        json_encoders = {
            Decimal: lambda v: str(v)
        }

class ComplianceCheck(BaseModel):
    check_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    transaction_id: Optional[str] = None
    aml_score: float = Field(..., ge=0.0, le=100.0)
    sanctions_check: bool
    pep_check: bool
    enhanced_monitoring: bool = False
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    compliance_notes: Optional[str] = None
    checked_at: datetime = Field(default_factory=datetime.utcnow)

# Data classes for external integrations
@dataclass
class JumioVerification:
    scan_reference: str
    status: str
    verification_status: str
    identity_verification: Dict[str, Any]
    document_verification: Dict[str, Any]

@dataclass
class StripePaymentIntent:
    payment_intent_id: str
    client_secret: str
    amount: int
    currency: str
    status: str

@dataclass
class ExchangeOrder:
    order_id: str
    symbol: str
    side: str  # BUY/SELL
    quantity: Decimal
    price: Decimal
    status: str

# Database manager
class OnrampDatabase:
    def __init__(self):
        self.connection = None
    
    async def connect(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(**DATABASE_CONFIG)
            await self.init_tables()
            logger.info("Connected to onramp database")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    async def init_tables(self):
        """Initialize database tables"""
        queries = [
            """
            CREATE TABLE IF NOT EXISTS users (
                user_id VARCHAR(100) PRIMARY KEY,
                email VARCHAR(200) UNIQUE NOT NULL,
                phone_number VARCHAR(20),
                kyc_level VARCHAR(20) DEFAULT 'LEVEL_0',
                kyc_status VARCHAR(20) DEFAULT 'PENDING',
                risk_score DECIMAL(5,2),
                jurisdiction VARCHAR(5),
                registration_ip VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login_at TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS kyc_submissions (
                submission_id VARCHAR(100) PRIMARY KEY,
                user_id VARCHAR(100) REFERENCES users(user_id),
                kyc_level VARCHAR(20) NOT NULL,
                status VARCHAR(20) NOT NULL,
                provider VARCHAR(50),
                provider_reference VARCHAR(200),
                personal_info JSONB,
                address_info JSONB,
                contact_info JSONB,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP,
                approved_at TIMESTAMP,
                rejection_reason TEXT,
                risk_score DECIMAL(5,2)
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS kyc_documents (
                document_id VARCHAR(100) PRIMARY KEY,
                submission_id VARCHAR(100) REFERENCES kyc_submissions(submission_id),
                document_type VARCHAR(50) NOT NULL,
                document_number VARCHAR(100),
                issuing_country VARCHAR(5),
                issue_date DATE,
                expiry_date DATE,
                file_path VARCHAR(500),
                file_hash VARCHAR(128),
                verification_status VARCHAR(20) DEFAULT 'PENDING',
                ocr_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS payment_methods (
                method_id VARCHAR(100) PRIMARY KEY,
                user_id VARCHAR(100) REFERENCES users(user_id),
                method_type VARCHAR(50) NOT NULL,
                provider VARCHAR(50) NOT NULL,
                account_name VARCHAR(200),
                encrypted_details BYTEA,
                currency VARCHAR(3) NOT NULL,
                country VARCHAR(3) NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                verification_date TIMESTAMP,
                daily_limit DECIMAL(15,2),
                monthly_limit DECIMAL(15,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS onramp_quotes (
                quote_id VARCHAR(100) PRIMARY KEY,
                user_id VARCHAR(100) REFERENCES users(user_id),
                fiat_amount DECIMAL(15,2) NOT NULL,
                fiat_currency VARCHAR(5) NOT NULL,
                crypto_amount DECIMAL(25,8) NOT NULL,
                crypto_currency VARCHAR(10) NOT NULL,
                exchange_rate DECIMAL(25,8) NOT NULL,
                fee_amount DECIMAL(15,2) NOT NULL,
                total_amount DECIMAL(15,2) NOT NULL,
                quote_expires_at TIMESTAMP NOT NULL,
                estimated_completion_minutes INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS onramp_transactions (
                transaction_id VARCHAR(100) PRIMARY KEY,
                request_id VARCHAR(100),
                user_id VARCHAR(100) REFERENCES users(user_id),
                quote_id VARCHAR(100) REFERENCES onramp_quotes(quote_id),
                status VARCHAR(30) NOT NULL,
                fiat_amount DECIMAL(15,2) NOT NULL,
                fiat_currency VARCHAR(5) NOT NULL,
                crypto_amount DECIMAL(25,8) NOT NULL,
                crypto_currency VARCHAR(10) NOT NULL,
                fee_amount DECIMAL(15,2) NOT NULL,
                exchange_rate DECIMAL(25,8) NOT NULL,
                payment_method_id VARCHAR(100) REFERENCES payment_methods(method_id),
                payment_processor_id VARCHAR(200),
                crypto_transaction_hash VARCHAR(100),
                destination_address VARCHAR(100) NOT NULL,
                destination_network VARCHAR(50) DEFAULT 'ethereum',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                failure_reason TEXT
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS compliance_checks (
                check_id VARCHAR(100) PRIMARY KEY,
                user_id VARCHAR(100) REFERENCES users(user_id),
                transaction_id VARCHAR(100),
                aml_score DECIMAL(5,2),
                sanctions_check BOOLEAN,
                pep_check BOOLEAN,
                enhanced_monitoring BOOLEAN DEFAULT FALSE,
                risk_level VARCHAR(10),
                compliance_notes TEXT,
                provider VARCHAR(50),
                provider_reference VARCHAR(200),
                checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS exchange_rates (
                id SERIAL PRIMARY KEY,
                from_currency VARCHAR(10),
                to_currency VARCHAR(10),
                rate DECIMAL(25,8),
                provider VARCHAR(50),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(from_currency, to_currency, provider, DATE(timestamp))
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS transaction_history (
                id SERIAL PRIMARY KEY,
                transaction_id VARCHAR(100) REFERENCES onramp_transactions(transaction_id),
                status VARCHAR(30),
                description TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS webhooks (
                id SERIAL PRIMARY KEY,
                provider VARCHAR(50),
                event_type VARCHAR(100),
                event_id VARCHAR(200),
                payload JSONB,
                processed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS user_sessions (
                session_id VARCHAR(100) PRIMARY KEY,
                user_id VARCHAR(100) REFERENCES users(user_id),
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT TRUE
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
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
            "CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON kyc_submissions(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON kyc_submissions(status);",
            "CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_onramp_transactions_user_id ON onramp_transactions(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_onramp_transactions_status ON onramp_transactions(status);",
            "CREATE INDEX IF NOT EXISTS idx_onramp_transactions_created_at ON onramp_transactions(created_at);",
            "CREATE INDEX IF NOT EXISTS idx_compliance_checks_user_id ON compliance_checks(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_transaction_history_transaction_id ON transaction_history(transaction_id);",
        ]
        
        with self.connection.cursor() as cursor:
            for index in indexes:
                cursor.execute(index)
        self.connection.commit()
        
        logger.info("Onramp database tables initialized")

# KYC service integration
class KycService:
    def __init__(self, database: OnrampDatabase):
        self.db = database
        self.redis_client = redis.Redis(**REDIS_CONFIG)
    
    async def submit_kyc(self, submission: KycSubmission, files: List[UploadFile]) -> str:
        """Submit KYC for verification"""
        try:
            # Store documents
            document_paths = await self._store_documents(submission.submission_id, files)
            
            # Update document file paths
            for i, doc in enumerate(submission.documents):
                if i < len(document_paths):
                    doc.file_path = document_paths[i]
            
            # Submit to KYC provider
            provider_reference = await self._submit_to_provider(submission)
            
            # Store in database
            await self._store_kyc_submission(submission, provider_reference)
            
            return submission.submission_id
            
        except Exception as e:
            logger.error(f"KYC submission error: {e}")
            raise
    
    async def _store_documents(self, submission_id: str, files: List[UploadFile]) -> List[str]:
        """Store uploaded documents"""
        document_paths = []
        base_path = Path(f"documents/{submission_id}")
        base_path.mkdir(parents=True, exist_ok=True)
        
        for i, file in enumerate(files):
            # Generate secure filename
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
            secure_filename = f"doc_{i}_{uuid.uuid4().hex[:8]}.{file_extension}"
            file_path = base_path / secure_filename
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            document_paths.append(str(file_path))
        
        return document_paths
    
    async def _submit_to_provider(self, submission: KycSubmission) -> str:
        """Submit to KYC provider (Jumio)"""
        try:
            config = KYC_PROVIDERS["JUMIO"]
            
            async with httpx.AsyncClient() as client:
                # Create Jumio scan
                headers = {
                    "Authorization": f"Basic {base64.b64encode(f'{config["api_token"]}:{config["secret"]}'.encode()).decode()}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "customerInternalReference": submission.user_id,
                    "reportingCriteria": "STANDARD",
                    "callbackUrl": f"{os.getenv('CALLBACK_BASE_URL', 'https://api.ailydian.com')}/api/v1/kyc/callback",
                    "userReference": submission.submission_id,
                    "workflowId": self._get_workflow_id(submission.kyc_level)
                }
                
                response = await client.post(
                    f"{config['api_url']}/api/v4/initiate",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 201:
                    result = response.json()
                    return result.get("scanReference", "")
                else:
                    logger.error(f"Jumio API error: {response.text}")
                    raise Exception("KYC provider error")
                    
        except Exception as e:
            logger.error(f"KYC provider submission error: {e}")
            raise
    
    def _get_workflow_id(self, kyc_level: KycLevel) -> int:
        """Get Jumio workflow ID based on KYC level"""
        workflow_map = {
            KycLevel.LEVEL_1: 100,  # Basic ID verification
            KycLevel.LEVEL_2: 200,  # ID + Address verification
            KycLevel.LEVEL_3: 300,  # Full verification
            KycLevel.INSTITUTIONAL: 400,  # Institutional KYC
        }
        return workflow_map.get(kyc_level, 100)
    
    async def _store_kyc_submission(self, submission: KycSubmission, provider_reference: str):
        """Store KYC submission in database"""
        try:
            with self.db.connection.cursor() as cursor:
                # Store KYC submission
                cursor.execute(
                    """
                    INSERT INTO kyc_submissions 
                    (submission_id, user_id, kyc_level, status, provider, provider_reference,
                     personal_info, address_info, contact_info, submitted_at, risk_score)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        submission.submission_id,
                        submission.user_id,
                        submission.kyc_level.value,
                        submission.status.value,
                        submission.provider,
                        provider_reference,
                        json.dumps(submission.personal_info.dict()),
                        json.dumps(submission.address.dict()),
                        json.dumps(submission.contact_info.dict()),
                        submission.submitted_at,
                        submission.risk_score
                    )
                )
                
                # Store documents
                for doc in submission.documents:
                    cursor.execute(
                        """
                        INSERT INTO kyc_documents
                        (document_id, submission_id, document_type, document_number,
                         issuing_country, issue_date, expiry_date, file_path, verification_status)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            doc.document_id,
                            submission.submission_id,
                            doc.document_type.value,
                            doc.document_number,
                            doc.issuing_country,
                            doc.issue_date,
                            doc.expiry_date,
                            doc.file_path,
                            doc.verification_status.value
                        )
                    )
                
            self.db.connection.commit()
            logger.info(f"KYC submission stored: {submission.submission_id}")
            
        except Exception as e:
            logger.error(f"Error storing KYC submission: {e}")
            raise

# Payment processing service
class PaymentProcessorService:
    def __init__(self, database: OnrampDatabase):
        self.db = database
        self.redis_client = redis.Redis(**REDIS_CONFIG)
    
    async def create_payment_intent(self, transaction: OnrampTransaction) -> StripePaymentIntent:
        """Create Stripe payment intent"""
        try:
            config = PAYMENT_PROCESSORS["STRIPE"]
            
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {config['secret_key']}",
                    "Content-Type": "application/x-www-form-urlencoded"
                }
                
                data = {
                    "amount": int(transaction.fiat_amount * 100),  # Convert to cents
                    "currency": transaction.fiat_currency.value.lower(),
                    "metadata[transaction_id]": transaction.transaction_id,
                    "metadata[user_id]": transaction.user_id,
                    "description": f"Onramp: {transaction.crypto_amount} {transaction.crypto_currency.value}"
                }
                
                response = await client.post(
                    f"{config['api_url']}/v1/payment_intents",
                    headers=headers,
                    data=data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return StripePaymentIntent(
                        payment_intent_id=result["id"],
                        client_secret=result["client_secret"],
                        amount=result["amount"],
                        currency=result["currency"],
                        status=result["status"]
                    )
                else:
                    logger.error(f"Stripe API error: {response.text}")
                    raise Exception("Payment processor error")
                    
        except Exception as e:
            logger.error(f"Payment intent creation error: {e}")
            raise

# Crypto exchange service
class CryptoExchangeService:
    def __init__(self, database: OnrampDatabase):
        self.db = database
        self.redis_client = redis.Redis(**REDIS_CONFIG)
    
    async def get_crypto_price(self, symbol: str) -> Decimal:
        """Get current crypto price from exchange"""
        try:
            # Check cache first
            cache_key = f"price:{symbol}:USD"
            cached_price = self.redis_client.get(cache_key)
            
            if cached_price:
                return Decimal(cached_price)
            
            # Fetch from Binance API
            config = CRYPTO_EXCHANGES["BINANCE"]
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{config['api_url']}/api/v3/ticker/price",
                    params={"symbol": f"{symbol}USDT"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    price = Decimal(result["price"])
                    
                    # Cache for 1 minute
                    self.redis_client.setex(cache_key, 60, str(price))
                    
                    return price
                else:
                    logger.error(f"Binance API error: {response.text}")
                    raise Exception("Exchange API error")
                    
        except Exception as e:
            logger.error(f"Crypto price fetch error: {e}")
            # Return fallback prices
            fallback_prices = {
                "BTC": Decimal("45000"),
                "ETH": Decimal("3000"),
                "USDC": Decimal("1.00"),
                "USDT": Decimal("1.00"),
            }
            return fallback_prices.get(symbol, Decimal("1.00"))
    
    async def execute_crypto_purchase(self, transaction: OnrampTransaction) -> str:
        """Execute crypto purchase on exchange"""
        try:
            # For demo purposes, simulate crypto purchase
            # In production, integrate with actual exchange APIs
            
            # Generate mock transaction hash
            import hashlib
            tx_data = f"{transaction.transaction_id}{transaction.crypto_amount}{datetime.utcnow().isoformat()}"
            tx_hash = hashlib.sha256(tx_data.encode()).hexdigest()
            
            # Store exchange rate
            await self._store_exchange_rate(
                transaction.fiat_currency.value,
                transaction.crypto_currency.value,
                transaction.exchange_rate
            )
            
            return tx_hash
            
        except Exception as e:
            logger.error(f"Crypto purchase error: {e}")
            raise
    
    async def _store_exchange_rate(self, from_currency: str, to_currency: str, rate: Decimal):
        """Store exchange rate in database"""
        try:
            with self.db.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO exchange_rates (from_currency, to_currency, rate, provider)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (from_currency, to_currency, provider, DATE(timestamp))
                    DO UPDATE SET rate = EXCLUDED.rate, timestamp = CURRENT_TIMESTAMP
                    """,
                    (from_currency, to_currency, rate, "BINANCE")
                )
            self.db.connection.commit()
            
        except Exception as e:
            logger.error(f"Error storing exchange rate: {e}")

# Main onramp service
class OnrampService:
    def __init__(self):
        self.database = OnrampDatabase()
        self.kyc_service = KycService(self.database)
        self.payment_service = PaymentProcessorService(self.database)
        self.exchange_service = CryptoExchangeService(self.database)
        self.redis_client = redis.Redis(**REDIS_CONFIG)
    
    async def initialize(self):
        """Initialize the service"""
        await self.database.connect()
        logger.info("Onramp Gateway Service initialized")
    
    async def create_quote(
        self,
        user_id: str,
        fiat_amount: Decimal,
        fiat_currency: Currency,
        crypto_currency: Currency
    ) -> OnrampQuote:
        """Create onramp quote"""
        try:
            # Get current crypto price
            crypto_price = await self.exchange_service.get_crypto_price(crypto_currency.value)
            
            # Calculate quote
            fee_rate = await self._get_fee_rate(user_id)
            fee_amount = fiat_amount * fee_rate
            total_amount = fiat_amount + fee_amount
            
            # Calculate crypto amount
            exchange_rate = Decimal("1") / crypto_price  # How much crypto per USD
            crypto_amount = fiat_amount / crypto_price
            
            # Quote expires in 5 minutes
            quote_expires_at = datetime.utcnow() + timedelta(minutes=5)
            
            # Estimated completion time
            estimated_completion = timedelta(minutes=15)  # 15 minutes average
            
            quote = OnrampQuote(
                fiat_amount=fiat_amount,
                fiat_currency=fiat_currency,
                crypto_amount=crypto_amount,
                crypto_currency=crypto_currency,
                exchange_rate=crypto_price,
                fee_amount=fee_amount,
                total_amount=total_amount,
                quote_expires_at=quote_expires_at,
                estimated_completion=estimated_completion
            )
            
            # Store quote in database
            await self._store_quote(user_id, quote)
            
            return quote
            
        except Exception as e:
            logger.error(f"Quote creation error: {e}")
            raise
    
    async def create_onramp_transaction(self, request: OnrampRequest) -> OnrampTransaction:
        """Create onramp transaction"""
        try:
            # Validate quote
            quote = await self._get_quote(request.quote_id)
            if not quote or quote.quote_expires_at < datetime.utcnow():
                raise ValueError("Quote expired or invalid")
            
            # Check user KYC status and limits
            await self._validate_user_limits(request.user_id, quote.fiat_amount)
            
            # Create transaction
            transaction = OnrampTransaction(
                request_id=request.request_id,
                user_id=request.user_id,
                status=OnrampStatus.PENDING,
                fiat_amount=quote.fiat_amount,
                fiat_currency=quote.fiat_currency,
                crypto_amount=quote.crypto_amount,
                crypto_currency=quote.crypto_currency,
                fee_amount=quote.fee_amount,
                exchange_rate=quote.exchange_rate,
                payment_method_id=request.payment_method_id,
                destination_address=request.destination_address,
                destination_network=request.destination_network
            )
            
            # Store transaction
            await self._store_transaction(transaction)
            
            # Create payment intent
            payment_intent = await self.payment_service.create_payment_intent(transaction)
            
            # Update transaction with payment processor ID
            await self._update_transaction_payment_id(
                transaction.transaction_id,
                payment_intent.payment_intent_id
            )
            
            # Start processing asynchronously
            asyncio.create_task(self._process_onramp_transaction(transaction.transaction_id))
            
            return transaction
            
        except Exception as e:
            logger.error(f"Onramp transaction creation error: {e}")
            raise
    
    async def _process_onramp_transaction(self, transaction_id: str):
        """Process onramp transaction through all stages"""
        try:
            # Update status to payment processing
            await self._update_transaction_status(
                transaction_id,
                OnrampStatus.PAYMENT_PROCESSING,
                "Processing payment"
            )
            
            # Simulate payment confirmation (in production, wait for webhook)
            await asyncio.sleep(5)
            
            await self._update_transaction_status(
                transaction_id,
                OnrampStatus.PAYMENT_CONFIRMED,
                "Payment confirmed"
            )
            
            # Execute crypto purchase
            transaction = await self._get_transaction(transaction_id)
            
            await self._update_transaction_status(
                transaction_id,
                OnrampStatus.CRYPTO_PURCHASING,
                "Purchasing cryptocurrency"
            )
            
            tx_hash = await self.exchange_service.execute_crypto_purchase(transaction)
            
            await self._update_transaction_status(
                transaction_id,
                OnrampStatus.CRYPTO_TRANSFERRING,
                "Transferring cryptocurrency to wallet"
            )
            
            # Simulate crypto transfer
            await asyncio.sleep(3)
            
            # Update transaction with crypto tx hash
            await self._update_transaction_crypto_hash(transaction_id, tx_hash)
            
            await self._update_transaction_status(
                transaction_id,
                OnrampStatus.COMPLETED,
                "Transaction completed successfully"
            )
            
        except Exception as e:
            logger.error(f"Onramp processing error: {e}")
            await self._update_transaction_status(
                transaction_id,
                OnrampStatus.FAILED,
                f"Transaction failed: {str(e)}"
            )
    
    async def _get_fee_rate(self, user_id: str) -> Decimal:
        """Get fee rate based on user KYC level"""
        try:
            with self.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    "SELECT kyc_level FROM users WHERE user_id = %s",
                    (user_id,)
                )
                row = cursor.fetchone()
                
                if row:
                    kyc_level = row['kyc_level']
                    limits = ONRAMP_LIMITS.get(kyc_level, ONRAMP_LIMITS["KYC_LEVEL_1"])
                    return Decimal(str(limits["fee_rate"]))
                
                return Decimal("0.025")  # Default 2.5%
                
        except Exception as e:
            logger.error(f"Error getting fee rate: {e}")
            return Decimal("0.025")
    
    async def _validate_user_limits(self, user_id: str, amount: Decimal):
        """Validate user transaction limits"""
        try:
            with self.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Get user KYC level
                cursor.execute(
                    "SELECT kyc_level, kyc_status FROM users WHERE user_id = %s",
                    (user_id,)
                )
                user_row = cursor.fetchone()
                
                if not user_row or user_row['kyc_status'] != 'APPROVED':
                    raise ValueError("User KYC not approved")
                
                kyc_level = user_row['kyc_level']
                limits = ONRAMP_LIMITS.get(kyc_level, ONRAMP_LIMITS["KYC_LEVEL_1"])
                
                # Check single transaction limit
                if amount > limits["daily"]:
                    raise ValueError(f"Amount exceeds daily limit of ${limits['daily']}")
                
                # Check daily limit
                today = datetime.utcnow().date()
                cursor.execute(
                    """
                    SELECT COALESCE(SUM(fiat_amount), 0) as daily_total
                    FROM onramp_transactions 
                    WHERE user_id = %s 
                    AND DATE(created_at) = %s 
                    AND status NOT IN ('FAILED', 'CANCELLED')
                    """,
                    (user_id, today)
                )
                daily_row = cursor.fetchone()
                
                daily_total = daily_row['daily_total'] + amount
                if daily_total > limits["daily"]:
                    raise ValueError(f"Daily limit exceeded: ${daily_total} > ${limits['daily']}")
                
        except Exception as e:
            logger.error(f"Limit validation error: {e}")
            raise
    
    async def _store_quote(self, user_id: str, quote: OnrampQuote):
        """Store quote in database"""
        try:
            with self.database.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO onramp_quotes
                    (quote_id, user_id, fiat_amount, fiat_currency, crypto_amount, 
                     crypto_currency, exchange_rate, fee_amount, total_amount, 
                     quote_expires_at, estimated_completion_minutes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        quote.quote_id,
                        user_id,
                        quote.fiat_amount,
                        quote.fiat_currency.value,
                        quote.crypto_amount,
                        quote.crypto_currency.value,
                        quote.exchange_rate,
                        quote.fee_amount,
                        quote.total_amount,
                        quote.quote_expires_at,
                        int(quote.estimated_completion.total_seconds() / 60)
                    )
                )
            self.database.connection.commit()
            
        except Exception as e:
            logger.error(f"Error storing quote: {e}")
            raise
    
    async def _get_quote(self, quote_id: str) -> Optional[OnrampQuote]:
        """Get quote from database"""
        try:
            with self.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    "SELECT * FROM onramp_quotes WHERE quote_id = %s",
                    (quote_id,)
                )
                row = cursor.fetchone()
                
                if row:
                    return OnrampQuote(
                        quote_id=row['quote_id'],
                        fiat_amount=row['fiat_amount'],
                        fiat_currency=Currency(row['fiat_currency']),
                        crypto_amount=row['crypto_amount'],
                        crypto_currency=Currency(row['crypto_currency']),
                        exchange_rate=row['exchange_rate'],
                        fee_amount=row['fee_amount'],
                        total_amount=row['total_amount'],
                        quote_expires_at=row['quote_expires_at'],
                        estimated_completion=timedelta(minutes=row['estimated_completion_minutes'])
                    )
                
                return None
                
        except Exception as e:
            logger.error(f"Error getting quote: {e}")
            return None
    
    async def _store_transaction(self, transaction: OnrampTransaction):
        """Store transaction in database"""
        try:
            with self.database.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO onramp_transactions
                    (transaction_id, request_id, user_id, status, fiat_amount, fiat_currency,
                     crypto_amount, crypto_currency, fee_amount, exchange_rate,
                     payment_method_id, destination_address, destination_network, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        transaction.transaction_id,
                        transaction.request_id,
                        transaction.user_id,
                        transaction.status.value,
                        transaction.fiat_amount,
                        transaction.fiat_currency.value,
                        transaction.crypto_amount,
                        transaction.crypto_currency.value,
                        transaction.fee_amount,
                        transaction.exchange_rate,
                        transaction.payment_method_id,
                        transaction.destination_address,
                        transaction.destination_network,
                        transaction.created_at
                    )
                )
            self.database.connection.commit()
            
            # Add to transaction history
            await self._add_transaction_history(
                transaction.transaction_id,
                transaction.status,
                "Transaction created"
            )
            
        except Exception as e:
            logger.error(f"Error storing transaction: {e}")
            raise
    
    async def _get_transaction(self, transaction_id: str) -> Optional[OnrampTransaction]:
        """Get transaction from database"""
        try:
            with self.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    "SELECT * FROM onramp_transactions WHERE transaction_id = %s",
                    (transaction_id,)
                )
                row = cursor.fetchone()
                
                if row:
                    return OnrampTransaction(**dict(row))
                
                return None
                
        except Exception as e:
            logger.error(f"Error getting transaction: {e}")
            return None
    
    async def _update_transaction_status(
        self,
        transaction_id: str,
        status: OnrampStatus,
        description: str
    ):
        """Update transaction status"""
        try:
            with self.database.connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE onramp_transactions 
                    SET status = %s, updated_at = %s
                    WHERE transaction_id = %s
                    """,
                    (status.value, datetime.utcnow(), transaction_id)
                )
                
                if status == OnrampStatus.COMPLETED:
                    cursor.execute(
                        """
                        UPDATE onramp_transactions 
                        SET completed_at = %s
                        WHERE transaction_id = %s
                        """,
                        (datetime.utcnow(), transaction_id)
                    )
                    
            self.database.connection.commit()
            
            # Add to transaction history
            await self._add_transaction_history(transaction_id, status, description)
            
        except Exception as e:
            logger.error(f"Error updating transaction status: {e}")
    
    async def _update_transaction_payment_id(self, transaction_id: str, payment_processor_id: str):
        """Update transaction with payment processor ID"""
        try:
            with self.database.connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE onramp_transactions 
                    SET payment_processor_id = %s
                    WHERE transaction_id = %s
                    """,
                    (payment_processor_id, transaction_id)
                )
            self.database.connection.commit()
            
        except Exception as e:
            logger.error(f"Error updating payment ID: {e}")
    
    async def _update_transaction_crypto_hash(self, transaction_id: str, crypto_hash: str):
        """Update transaction with crypto transaction hash"""
        try:
            with self.database.connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE onramp_transactions 
                    SET crypto_transaction_hash = %s
                    WHERE transaction_id = %s
                    """,
                    (crypto_hash, transaction_id)
                )
            self.database.connection.commit()
            
        except Exception as e:
            logger.error(f"Error updating crypto hash: {e}")
    
    async def _add_transaction_history(
        self,
        transaction_id: str,
        status: OnrampStatus,
        description: str
    ):
        """Add entry to transaction history"""
        try:
            with self.database.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO transaction_history (transaction_id, status, description)
                    VALUES (%s, %s, %s)
                    """,
                    (transaction_id, status.value, description)
                )
            self.database.connection.commit()
            
        except Exception as e:
            logger.error(f"Error adding transaction history: {e}")

# Initialize service
onramp_service = OnrampService()

# API endpoints
@app.on_event("startup")
async def startup_event():
    """Initialize service on startup"""
    await onramp_service.initialize()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AILYDIAN Onramp Gateway Service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.post("/api/v1/kyc/submit", response_model=dict)
async def submit_kyc(
    submission: KycSubmission,
    files: List[UploadFile] = File(...)
):
    """Submit KYC for verification"""
    submission_id = await onramp_service.kyc_service.submit_kyc(submission, files)
    return {"submission_id": submission_id, "status": "submitted"}

@app.post("/api/v1/quotes", response_model=OnrampQuote)
async def create_quote(
    user_id: str,
    fiat_amount: Decimal,
    fiat_currency: Currency,
    crypto_currency: Currency
):
    """Create onramp quote"""
    return await onramp_service.create_quote(
        user_id, fiat_amount, fiat_currency, crypto_currency
    )

@app.post("/api/v1/onramp", response_model=OnrampTransaction)
async def create_onramp_transaction(request: OnrampRequest):
    """Create onramp transaction"""
    return await onramp_service.create_onramp_transaction(request)

@app.get("/api/v1/transactions/{transaction_id}", response_model=OnrampTransaction)
async def get_transaction(transaction_id: str):
    """Get onramp transaction details"""
    transaction = await onramp_service._get_transaction(transaction_id)
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return transaction

@app.get("/api/v1/transactions/{transaction_id}/history")
async def get_transaction_history(transaction_id: str):
    """Get transaction history"""
    try:
        with onramp_service.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                SELECT status, description, timestamp
                FROM transaction_history
                WHERE transaction_id = %s
                ORDER BY timestamp DESC
                """,
                (transaction_id,)
            )
            rows = cursor.fetchall()
            
            return {
                "transaction_id": transaction_id,
                "history": [dict(row) for row in rows]
            }
            
    except Exception as e:
        logger.error(f"Error getting transaction history: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/v1/supported-currencies")
async def get_supported_currencies():
    """Get supported fiat and crypto currencies"""
    return {
        "fiat_currencies": [
            {"code": "USD", "name": "US Dollar", "symbol": "$"},
            {"code": "EUR", "name": "Euro", "symbol": "€"},
            {"code": "GBP", "name": "British Pound", "symbol": "£"},
            {"code": "JPY", "name": "Japanese Yen", "symbol": "¥"},
            {"code": "CHF", "name": "Swiss Franc", "symbol": "CHF"},
            {"code": "CAD", "name": "Canadian Dollar", "symbol": "C$"},
            {"code": "AUD", "name": "Australian Dollar", "symbol": "A$"},
        ],
        "crypto_currencies": [
            {"code": "BTC", "name": "Bitcoin", "network": "bitcoin"},
            {"code": "ETH", "name": "Ethereum", "network": "ethereum"},
            {"code": "USDC", "name": "USD Coin", "network": "ethereum"},
            {"code": "USDT", "name": "Tether", "network": "ethereum"},
            {"code": "DAI", "name": "Dai", "network": "ethereum"},
            {"code": "WETH", "name": "Wrapped ETH", "network": "ethereum"},
            {"code": "MATIC", "name": "Polygon", "network": "polygon"},
            {"code": "AVAX", "name": "Avalanche", "network": "avalanche"},
        ]
    }

@app.get("/api/v1/kyc/requirements/{jurisdiction}")
async def get_kyc_requirements(jurisdiction: str):
    """Get KYC requirements for jurisdiction"""
    requirements = JURISDICTIONS.get(jurisdiction.upper())
    
    if not requirements:
        raise HTTPException(status_code=404, detail="Jurisdiction not supported")
    
    return {
        "jurisdiction": jurisdiction.upper(),
        "requirements": requirements
    }

@app.get("/api/v1/limits/{user_id}")
async def get_user_limits(user_id: str):
    """Get user transaction limits"""
    try:
        with onramp_service.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT kyc_level FROM users WHERE user_id = %s",
                (user_id,)
            )
            row = cursor.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail="User not found")
            
            kyc_level = row['kyc_level']
            limits = ONRAMP_LIMITS.get(kyc_level, ONRAMP_LIMITS["KYC_LEVEL_1"])
            
            return {
                "kyc_level": kyc_level,
                "daily_limit": limits["daily"],
                "monthly_limit": limits["monthly"],
                "fee_rate": limits["fee_rate"]
            }
            
    except Exception as e:
        logger.error(f"Error getting user limits: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/v1/webhooks/kyc")
async def kyc_webhook(payload: dict):
    """Handle KYC provider webhooks"""
    try:
        # Store webhook for processing
        with onramp_service.database.connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO webhooks (provider, event_type, event_id, payload)
                VALUES (%s, %s, %s, %s)
                """,
                ("JUMIO", payload.get("eventType"), payload.get("scanReference"), json.dumps(payload))
            )
        onramp_service.database.connection.commit()
        
        # Process webhook asynchronously
        asyncio.create_task(process_kyc_webhook(payload))
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"KYC webhook error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing error")

async def process_kyc_webhook(payload: dict):
    """Process KYC webhook asynchronously"""
    try:
        scan_reference = payload.get("scanReference")
        verification_status = payload.get("verificationStatus")
        
        if scan_reference and verification_status:
            # Update KYC submission status
            with onramp_service.database.connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE kyc_submissions 
                    SET status = %s, reviewed_at = %s
                    WHERE provider_reference = %s
                    """,
                    (
                        "APPROVED" if verification_status == "APPROVED_VERIFIED" else "REJECTED",
                        datetime.utcnow(),
                        scan_reference
                    )
                )
            onramp_service.database.connection.commit()
            
            logger.info(f"KYC webhook processed: {scan_reference} -> {verification_status}")
        
    except Exception as e:
        logger.error(f"KYC webhook processing error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8013)
