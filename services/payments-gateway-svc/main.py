# AILYDIAN Payments Gateway Service
# Traditional Banking Integration with SWIFT/SEPA/ACH Support
# Port: 8012

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator, EmailStr
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta
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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI(
    title="AILYDIAN Payments Gateway Service",
    description="Traditional Banking Integration with SWIFT/SEPA/ACH Support",
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
    "database": os.getenv("POSTGRES_DB", "ailydian_payments"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", "password"),
}

# Redis configuration
REDIS_CONFIG = {
    "host": os.getenv("REDIS_HOST", "localhost"),
    "port": os.getenv("REDIS_PORT", 6379),
    "db": os.getenv("REDIS_DB", 7),
    "decode_responses": True,
}

# Encryption configuration
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key())
cipher_suite = Fernet(ENCRYPTION_KEY)

# Banking API configuration
BANKING_APIS = {
    "SWIFT": {
        "base_url": os.getenv("SWIFT_API_URL", "https://api.swift.com"),
        "api_key": os.getenv("SWIFT_API_KEY", ""),
        "institution_id": os.getenv("SWIFT_INSTITUTION_ID", ""),
    },
    "SEPA": {
        "base_url": os.getenv("SEPA_API_URL", "https://api.sepa.eu"),
        "api_key": os.getenv("SEPA_API_KEY", ""),
        "institution_id": os.getenv("SEPA_INSTITUTION_ID", ""),
    },
    "ACH": {
        "base_url": os.getenv("ACH_API_URL", "https://api.nacha.org"),
        "api_key": os.getenv("ACH_API_KEY", ""),
        "routing_number": os.getenv("ACH_ROUTING_NUMBER", ""),
    }
}

# Transaction limits and fees
TRANSACTION_LIMITS = {
    "SWIFT": {"daily": 1_000_000, "single": 100_000, "fee_rate": 0.001},
    "SEPA": {"daily": 500_000, "single": 50_000, "fee_rate": 0.0005},
    "ACH": {"daily": 250_000, "single": 25_000, "fee_rate": 0.0002},
}

# Enums
class PaymentMethod(str, Enum):
    SWIFT = "SWIFT"
    SEPA = "SEPA"
    ACH = "ACH"
    WIRE = "WIRE"
    FASTER_PAYMENTS = "FASTER_PAYMENTS"
    REAL_TIME_GROSS = "REAL_TIME_GROSS"

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SENT = "SENT"
    RECEIVED = "RECEIVED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"

class Currency(str, Enum):
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    JPY = "JPY"
    CHF = "CHF"
    CAD = "CAD"
    AUD = "AUD"
    CNY = "CNY"
    KRW = "KRW"
    TRY = "TRY"

class AccountType(str, Enum):
    CHECKING = "CHECKING"
    SAVINGS = "SAVINGS"
    BUSINESS = "BUSINESS"
    ESCROW = "ESCROW"

class ComplianceStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    UNDER_REVIEW = "UNDER_REVIEW"

# Pydantic models
class BankAccount(BaseModel):
    account_id: str
    account_number: str
    routing_number: Optional[str] = None
    iban: Optional[str] = None
    swift_code: Optional[str] = None
    bank_name: str
    account_holder_name: str
    account_type: AccountType
    currency: Currency
    country_code: str
    is_verified: bool = False
    verification_date: Optional[datetime] = None

class PaymentRequest(BaseModel):
    payment_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_account_id: str
    to_account_id: str
    amount: Decimal = Field(..., gt=0, max_digits=20, decimal_places=2)
    currency: Currency
    payment_method: PaymentMethod
    reference: Optional[str] = None
    memo: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    priority: str = Field(default="NORMAL")  # HIGH, NORMAL, LOW
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

class PaymentResponse(BaseModel):
    payment_id: str
    status: PaymentStatus
    transaction_id: Optional[str] = None
    created_at: datetime
    estimated_completion: Optional[datetime] = None
    fee_amount: Decimal
    exchange_rate: Optional[Decimal] = None
    compliance_status: ComplianceStatus
    
    class Config:
        json_encoders = {
            Decimal: lambda v: str(v)
        }

class TransactionHistory(BaseModel):
    payment_id: str
    status: PaymentStatus
    timestamp: datetime
    description: str
    reference_number: Optional[str] = None

class PaymentInquiry(BaseModel):
    payment_id: str
    current_status: PaymentStatus
    transaction_history: List[TransactionHistory]
    estimated_completion: Optional[datetime] = None
    last_updated: datetime

class ComplianceCheck(BaseModel):
    check_id: str
    payment_id: str
    aml_score: float = Field(..., ge=0.0, le=100.0)
    sanctions_check: bool
    pep_check: bool
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    compliance_notes: Optional[str] = None
    checked_at: datetime

# Data classes for internal use
@dataclass
class SwiftMessage:
    message_type: str
    sender_bic: str
    receiver_bic: str
    amount: Decimal
    currency: str
    value_date: datetime
    reference: str
    details: str

@dataclass
class SepaInstruction:
    instruction_id: str
    end_to_end_id: str
    amount: Decimal
    currency: str
    debtor_iban: str
    creditor_iban: str
    remittance_info: str
    execution_date: datetime

@dataclass
class AchEntry:
    entry_class_code: str  # PPD, CCD, CTX, etc.
    company_id: str
    company_name: str
    effective_date: datetime
    originating_dfi: str
    receiving_dfi: str
    dfi_account_number: str
    amount: Decimal
    transaction_code: str
    addenda_record: Optional[str] = None

# Database manager
class PaymentsDatabase:
    def __init__(self):
        self.connection = None
    
    async def connect(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(**DATABASE_CONFIG)
            await self.init_tables()
            logger.info("Connected to payments database")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    async def init_tables(self):
        """Initialize database tables"""
        queries = [
            """
            CREATE TABLE IF NOT EXISTS bank_accounts (
                account_id VARCHAR(100) PRIMARY KEY,
                user_id VARCHAR(100) NOT NULL,
                account_number VARCHAR(50) NOT NULL,
                routing_number VARCHAR(20),
                iban VARCHAR(34),
                swift_code VARCHAR(11),
                bank_name VARCHAR(200) NOT NULL,
                account_holder_name VARCHAR(200) NOT NULL,
                account_type VARCHAR(20) NOT NULL,
                currency VARCHAR(3) NOT NULL,
                country_code VARCHAR(2) NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                verification_date TIMESTAMP,
                encrypted_data BYTEA,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS payments (
                payment_id VARCHAR(100) PRIMARY KEY,
                from_account_id VARCHAR(100) REFERENCES bank_accounts(account_id),
                to_account_id VARCHAR(100) REFERENCES bank_accounts(account_id),
                amount DECIMAL(20,2) NOT NULL,
                currency VARCHAR(3) NOT NULL,
                payment_method VARCHAR(30) NOT NULL,
                status VARCHAR(20) NOT NULL,
                transaction_id VARCHAR(200),
                reference VARCHAR(500),
                memo TEXT,
                scheduled_date TIMESTAMP,
                priority VARCHAR(10) DEFAULT 'NORMAL',
                fee_amount DECIMAL(10,2),
                exchange_rate DECIMAL(15,8),
                compliance_status VARCHAR(20) DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS payment_history (
                id SERIAL PRIMARY KEY,
                payment_id VARCHAR(100) REFERENCES payments(payment_id),
                status VARCHAR(20) NOT NULL,
                description TEXT,
                reference_number VARCHAR(200),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS compliance_checks (
                check_id VARCHAR(100) PRIMARY KEY,
                payment_id VARCHAR(100) REFERENCES payments(payment_id),
                aml_score DECIMAL(5,2),
                sanctions_check BOOLEAN,
                pep_check BOOLEAN,
                risk_level VARCHAR(10),
                compliance_notes TEXT,
                checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS swift_messages (
                id SERIAL PRIMARY KEY,
                payment_id VARCHAR(100) REFERENCES payments(payment_id),
                message_type VARCHAR(10),
                sender_bic VARCHAR(11),
                receiver_bic VARCHAR(11),
                swift_reference VARCHAR(16),
                message_text TEXT,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20)
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS sepa_instructions (
                id SERIAL PRIMARY KEY,
                payment_id VARCHAR(100) REFERENCES payments(payment_id),
                instruction_id VARCHAR(50),
                end_to_end_id VARCHAR(50),
                debtor_iban VARCHAR(34),
                creditor_iban VARCHAR(34),
                execution_date TIMESTAMP,
                status VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS ach_batches (
                id SERIAL PRIMARY KEY,
                batch_id VARCHAR(50) UNIQUE,
                company_id VARCHAR(20),
                company_name VARCHAR(100),
                effective_date DATE,
                batch_total DECIMAL(15,2),
                entry_count INTEGER,
                status VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS ach_entries (
                id SERIAL PRIMARY KEY,
                batch_id VARCHAR(50) REFERENCES ach_batches(batch_id),
                payment_id VARCHAR(100) REFERENCES payments(payment_id),
                entry_class_code VARCHAR(3),
                transaction_code VARCHAR(2),
                receiving_dfi VARCHAR(9),
                dfi_account_number VARCHAR(17),
                amount DECIMAL(12,2),
                individual_name VARCHAR(22),
                trace_number VARCHAR(15),
                addenda_record TEXT
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS exchange_rates (
                id SERIAL PRIMARY KEY,
                from_currency VARCHAR(3),
                to_currency VARCHAR(3),
                rate DECIMAL(15,8),
                provider VARCHAR(50),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(from_currency, to_currency, provider, timestamp)
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS payment_notifications (
                id SERIAL PRIMARY KEY,
                payment_id VARCHAR(100) REFERENCES payments(payment_id),
                notification_type VARCHAR(50),
                recipient VARCHAR(200),
                content TEXT,
                sent_at TIMESTAMP,
                delivery_status VARCHAR(20)
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
            "CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);",
            "CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);",
            "CREATE INDEX IF NOT EXISTS idx_payment_history_payment_id ON payment_history(payment_id);",
            "CREATE INDEX IF NOT EXISTS idx_compliance_checks_payment_id ON compliance_checks(payment_id);",
            "CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);",
        ]
        
        with self.connection.cursor() as cursor:
            for index in indexes:
                cursor.execute(index)
        self.connection.commit()
        
        logger.info("Payments database tables initialized")

# SWIFT client
class SwiftClient:
    def __init__(self):
        self.config = BANKING_APIS["SWIFT"]
        self.session = None
    
    async def __aenter__(self):
        self.session = httpx.AsyncClient(
            base_url=self.config["base_url"],
            headers={"Authorization": f"Bearer {self.config['api_key']}"},
            timeout=60.0
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.aclose()
    
    async def send_mt103(self, message: SwiftMessage) -> Dict[str, Any]:
        """Send SWIFT MT103 (Single Customer Credit Transfer)"""
        try:
            payload = {
                "messageType": "MT103",
                "senderBIC": message.sender_bic,
                "receiverBIC": message.receiver_bic,
                "transactionReference": message.reference,
                "valueDate": message.value_date.strftime("%y%m%d"),
                "currency": message.currency,
                "amount": str(message.amount),
                "orderingCustomer": message.details,
                "beneficiaryCustomer": message.details,
                "remittanceInformation": message.details
            }
            
            response = await self.session.post("/v1/messages", json=payload)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"SWIFT MT103 send error: {e}")
            raise
    
    async def query_transaction(self, reference: str) -> Dict[str, Any]:
        """Query SWIFT transaction status"""
        try:
            response = await self.session.get(f"/v1/transactions/{reference}")
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"SWIFT query error: {e}")
            raise

# SEPA client
class SepaClient:
    def __init__(self):
        self.config = BANKING_APIS["SEPA"]
        self.session = None
    
    async def __aenter__(self):
        self.session = httpx.AsyncClient(
            base_url=self.config["base_url"],
            headers={"Authorization": f"Bearer {self.config['api_key']}"},
            timeout=60.0
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.aclose()
    
    async def send_credit_transfer(self, instruction: SepaInstruction) -> Dict[str, Any]:
        """Send SEPA Credit Transfer"""
        try:
            payload = {
                "messageId": str(uuid.uuid4()),
                "paymentInformationId": instruction.instruction_id,
                "requestedExecutionDate": instruction.execution_date.strftime("%Y-%m-%d"),
                "debtor": {
                    "iban": instruction.debtor_iban
                },
                "transactions": [{
                    "instructionId": instruction.instruction_id,
                    "endToEndId": instruction.end_to_end_id,
                    "amount": {
                        "currency": instruction.currency,
                        "value": str(instruction.amount)
                    },
                    "creditor": {
                        "iban": instruction.creditor_iban
                    },
                    "remittanceInformation": instruction.remittance_info
                }]
            }
            
            response = await self.session.post("/v1/credit-transfers", json=payload)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"SEPA credit transfer error: {e}")
            raise

# ACH client
class AchClient:
    def __init__(self):
        self.config = BANKING_APIS["ACH"]
        self.session = None
    
    async def __aenter__(self):
        self.session = httpx.AsyncClient(
            base_url=self.config["base_url"],
            headers={"Authorization": f"Bearer {self.config['api_key']}"},
            timeout=60.0
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.aclose()
    
    async def create_batch(self, entries: List[AchEntry]) -> Dict[str, Any]:
        """Create ACH batch file"""
        try:
            batch_id = f"BATCH{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
            
            payload = {
                "batchHeader": {
                    "serviceClassCode": "220",  # Credits only
                    "companyName": entries[0].company_name,
                    "companyId": entries[0].company_id,
                    "batchId": batch_id,
                    "effectiveEntryDate": entries[0].effective_date.strftime("%y%m%d"),
                    "originatingDfi": entries[0].originating_dfi
                },
                "entries": [
                    {
                        "transactionCode": entry.transaction_code,
                        "receivingDfi": entry.receiving_dfi,
                        "dfiAccountNumber": entry.dfi_account_number,
                        "amount": str(entry.amount),
                        "individualName": entry.company_name,
                        "traceNumber": f"{entry.originating_dfi}{batch_id}",
                        "addendaRecord": entry.addenda_record
                    }
                    for entry in entries
                ]
            }
            
            response = await self.session.post("/v1/batches", json=payload)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"ACH batch creation error: {e}")
            raise

# Compliance engine
class ComplianceEngine:
    def __init__(self, database: PaymentsDatabase):
        self.db = database
        self.redis_client = redis.Redis(**REDIS_CONFIG)
    
    async def check_aml_compliance(self, payment: PaymentRequest) -> ComplianceCheck:
        """Perform AML compliance check"""
        try:
            check_id = str(uuid.uuid4())
            
            # Simulate AML scoring (in real implementation, use external AML service)
            aml_score = self._calculate_aml_score(payment)
            sanctions_check = await self._check_sanctions(payment)
            pep_check = await self._check_pep(payment)
            
            # Determine risk level
            if aml_score >= 80 or not sanctions_check or not pep_check:
                risk_level = "CRITICAL"
            elif aml_score >= 60:
                risk_level = "HIGH"
            elif aml_score >= 40:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"
            
            compliance = ComplianceCheck(
                check_id=check_id,
                payment_id=payment.payment_id,
                aml_score=aml_score,
                sanctions_check=sanctions_check,
                pep_check=pep_check,
                risk_level=risk_level,
                compliance_notes=f"AML check completed for payment {payment.payment_id}",
                checked_at=datetime.utcnow()
            )
            
            # Store in database
            await self._store_compliance_check(compliance)
            
            return compliance
            
        except Exception as e:
            logger.error(f"AML compliance check error: {e}")
            raise
    
    def _calculate_aml_score(self, payment: PaymentRequest) -> float:
        """Calculate AML risk score"""
        score = 0.0
        
        # Amount-based scoring
        amount = float(payment.amount)
        if amount > 100_000:
            score += 30
        elif amount > 50_000:
            score += 20
        elif amount > 10_000:
            score += 10
        
        # Method-based scoring
        if payment.payment_method == PaymentMethod.SWIFT:
            score += 15  # International transfers have higher risk
        
        # Random variation (in real implementation, use ML model)
        import random
        score += random.uniform(0, 25)
        
        return min(100.0, score)
    
    async def _check_sanctions(self, payment: PaymentRequest) -> bool:
        """Check against sanctions lists"""
        # In real implementation, check against OFAC, EU, UN sanctions lists
        # For demo, randomly pass/fail
        import random
        return random.random() > 0.05  # 95% pass rate
    
    async def _check_pep(self, payment: PaymentRequest) -> bool:
        """Check for Politically Exposed Persons"""
        # In real implementation, check against PEP databases
        # For demo, randomly pass/fail
        import random
        return random.random() > 0.02  # 98% pass rate
    
    async def _store_compliance_check(self, compliance: ComplianceCheck):
        """Store compliance check in database"""
        try:
            with self.db.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO compliance_checks 
                    (check_id, payment_id, aml_score, sanctions_check, pep_check, 
                     risk_level, compliance_notes, checked_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        compliance.check_id,
                        compliance.payment_id,
                        compliance.aml_score,
                        compliance.sanctions_check,
                        compliance.pep_check,
                        compliance.risk_level,
                        compliance.compliance_notes,
                        compliance.checked_at
                    )
                )
            self.db.connection.commit()
            
        except Exception as e:
            logger.error(f"Error storing compliance check: {e}")

# Main payments service
class PaymentsService:
    def __init__(self):
        self.database = PaymentsDatabase()
        self.compliance = ComplianceEngine(self.database)
        self.redis_client = redis.Redis(**REDIS_CONFIG)
    
    async def initialize(self):
        """Initialize the service"""
        await self.database.connect()
        logger.info("Payments Gateway Service initialized")
    
    async def create_payment(self, payment: PaymentRequest) -> PaymentResponse:
        """Create a new payment"""
        try:
            # Perform compliance check
            compliance_check = await self.compliance.check_aml_compliance(payment)
            
            if compliance_check.risk_level == "CRITICAL":
                compliance_status = ComplianceStatus.REJECTED
            elif compliance_check.risk_level == "HIGH":
                compliance_status = ComplianceStatus.UNDER_REVIEW
            else:
                compliance_status = ComplianceStatus.APPROVED
            
            # Calculate fee
            fee_amount = self._calculate_fee(payment)
            
            # Get exchange rate if needed
            exchange_rate = None
            if payment.currency != Currency.USD:
                exchange_rate = await self._get_exchange_rate(payment.currency, Currency.USD)
            
            # Store payment in database
            await self._store_payment(payment, fee_amount, exchange_rate, compliance_status)
            
            # Determine status based on compliance
            if compliance_status == ComplianceStatus.REJECTED:
                status = PaymentStatus.REJECTED
                estimated_completion = None
            elif compliance_status == ComplianceStatus.UNDER_REVIEW:
                status = PaymentStatus.PENDING
                estimated_completion = datetime.utcnow() + timedelta(days=1)
            else:
                status = PaymentStatus.PROCESSING
                estimated_completion = self._estimate_completion_time(payment.payment_method)
                
                # Process payment asynchronously
                asyncio.create_task(self._process_payment(payment))
            
            return PaymentResponse(
                payment_id=payment.payment_id,
                status=status,
                transaction_id=None,
                created_at=datetime.utcnow(),
                estimated_completion=estimated_completion,
                fee_amount=fee_amount,
                exchange_rate=exchange_rate,
                compliance_status=compliance_status
            )
            
        except Exception as e:
            logger.error(f"Error creating payment: {e}")
            raise HTTPException(status_code=500, detail="Payment creation failed")
    
    async def _process_payment(self, payment: PaymentRequest):
        """Process payment through appropriate channel"""
        try:
            transaction_id = None
            
            if payment.payment_method == PaymentMethod.SWIFT:
                transaction_id = await self._process_swift_payment(payment)
            elif payment.payment_method == PaymentMethod.SEPA:
                transaction_id = await self._process_sepa_payment(payment)
            elif payment.payment_method == PaymentMethod.ACH:
                transaction_id = await self._process_ach_payment(payment)
            
            # Update payment status
            await self._update_payment_status(
                payment.payment_id,
                PaymentStatus.SENT,
                transaction_id
            )
            
        except Exception as e:
            logger.error(f"Error processing payment {payment.payment_id}: {e}")
            await self._update_payment_status(
                payment.payment_id,
                PaymentStatus.FAILED,
                None
            )
    
    async def _process_swift_payment(self, payment: PaymentRequest) -> str:
        """Process SWIFT payment"""
        async with SwiftClient() as swift:
            # Get account details
            from_account = await self._get_account(payment.from_account_id)
            to_account = await self._get_account(payment.to_account_id)
            
            message = SwiftMessage(
                message_type="MT103",
                sender_bic=from_account.swift_code,
                receiver_bic=to_account.swift_code,
                amount=payment.amount,
                currency=payment.currency.value,
                value_date=payment.scheduled_date or datetime.utcnow(),
                reference=payment.reference or payment.payment_id,
                details=payment.memo or f"Payment from {from_account.account_holder_name}"
            )
            
            result = await swift.send_mt103(message)
            return result.get("transactionId")
    
    async def _process_sepa_payment(self, payment: PaymentRequest) -> str:
        """Process SEPA payment"""
        async with SepaClient() as sepa:
            # Get account details
            from_account = await self._get_account(payment.from_account_id)
            to_account = await self._get_account(payment.to_account_id)
            
            instruction = SepaInstruction(
                instruction_id=payment.payment_id,
                end_to_end_id=payment.reference or payment.payment_id,
                amount=payment.amount,
                currency=payment.currency.value,
                debtor_iban=from_account.iban,
                creditor_iban=to_account.iban,
                remittance_info=payment.memo or f"Payment {payment.payment_id}",
                execution_date=payment.scheduled_date or datetime.utcnow()
            )
            
            result = await sepa.send_credit_transfer(instruction)
            return result.get("transactionId")
    
    async def _process_ach_payment(self, payment: PaymentRequest) -> str:
        """Process ACH payment"""
        async with AchClient() as ach:
            # Get account details
            from_account = await self._get_account(payment.from_account_id)
            to_account = await self._get_account(payment.to_account_id)
            
            entry = AchEntry(
                entry_class_code="PPD",  # Prearranged Payment and Deposit
                company_id=from_account.account_id[:10],
                company_name=from_account.account_holder_name[:16],
                effective_date=payment.scheduled_date or datetime.utcnow(),
                originating_dfi=from_account.routing_number[:9],
                receiving_dfi=to_account.routing_number[:9],
                dfi_account_number=to_account.account_number,
                amount=payment.amount,
                transaction_code="22",  # Credit
                addenda_record=payment.memo
            )
            
            result = await ach.create_batch([entry])
            return result.get("batchId")
    
    def _calculate_fee(self, payment: PaymentRequest) -> Decimal:
        """Calculate transaction fee"""
        limits = TRANSACTION_LIMITS.get(payment.payment_method.value, {"fee_rate": 0.001})
        fee_rate = Decimal(str(limits["fee_rate"]))
        
        # Base fee calculation
        fee = payment.amount * fee_rate
        
        # Minimum fee
        min_fee = Decimal("1.00")
        
        # Maximum fee
        max_fee = Decimal("100.00")
        
        return max(min_fee, min(fee, max_fee))
    
    async def _get_exchange_rate(self, from_currency: Currency, to_currency: Currency) -> Decimal:
        """Get current exchange rate"""
        # In real implementation, use external FX API
        # For demo, return mock rates
        mock_rates = {
            Currency.EUR: Decimal("1.09"),
            Currency.GBP: Decimal("1.27"),
            Currency.JPY: Decimal("0.0067"),
            Currency.CHF: Decimal("1.11"),
            Currency.CAD: Decimal("0.74"),
            Currency.AUD: Decimal("0.66"),
            Currency.CNY: Decimal("0.14"),
            Currency.KRW: Decimal("0.00076"),
            Currency.TRY: Decimal("0.030"),
        }
        
        return mock_rates.get(from_currency, Decimal("1.00"))
    
    def _estimate_completion_time(self, payment_method: PaymentMethod) -> datetime:
        """Estimate payment completion time"""
        now = datetime.utcnow()
        
        completion_times = {
            PaymentMethod.SWIFT: timedelta(days=1, hours=12),
            PaymentMethod.SEPA: timedelta(hours=2),
            PaymentMethod.ACH: timedelta(days=2),
            PaymentMethod.WIRE: timedelta(hours=4),
            PaymentMethod.FASTER_PAYMENTS: timedelta(minutes=15),
            PaymentMethod.REAL_TIME_GROSS: timedelta(minutes=5),
        }
        
        return now + completion_times.get(payment_method, timedelta(days=1))
    
    async def _store_payment(
        self,
        payment: PaymentRequest,
        fee_amount: Decimal,
        exchange_rate: Optional[Decimal],
        compliance_status: ComplianceStatus
    ):
        """Store payment in database"""
        try:
            with self.database.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO payments 
                    (payment_id, from_account_id, to_account_id, amount, currency,
                     payment_method, status, reference, memo, scheduled_date,
                     priority, fee_amount, exchange_rate, compliance_status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        payment.payment_id,
                        payment.from_account_id,
                        payment.to_account_id,
                        payment.amount,
                        payment.currency.value,
                        payment.payment_method.value,
                        PaymentStatus.PENDING.value,
                        payment.reference,
                        payment.memo,
                        payment.scheduled_date,
                        payment.priority,
                        fee_amount,
                        exchange_rate,
                        compliance_status.value
                    )
                )
            self.database.connection.commit()
            
            # Add to payment history
            await self._add_payment_history(
                payment.payment_id,
                PaymentStatus.PENDING,
                "Payment created and pending compliance approval"
            )
            
        except Exception as e:
            logger.error(f"Error storing payment: {e}")
            raise
    
    async def _update_payment_status(
        self,
        payment_id: str,
        status: PaymentStatus,
        transaction_id: Optional[str] = None
    ):
        """Update payment status"""
        try:
            with self.database.connection.cursor() as cursor:
                if transaction_id:
                    cursor.execute(
                        """
                        UPDATE payments 
                        SET status = %s, transaction_id = %s, updated_at = %s
                        WHERE payment_id = %s
                        """,
                        (status.value, transaction_id, datetime.utcnow(), payment_id)
                    )
                else:
                    cursor.execute(
                        """
                        UPDATE payments 
                        SET status = %s, updated_at = %s
                        WHERE payment_id = %s
                        """,
                        (status.value, datetime.utcnow(), payment_id)
                    )
            self.database.connection.commit()
            
            # Add to payment history
            await self._add_payment_history(
                payment_id,
                status,
                f"Payment status updated to {status.value}",
                transaction_id
            )
            
        except Exception as e:
            logger.error(f"Error updating payment status: {e}")
    
    async def _add_payment_history(
        self,
        payment_id: str,
        status: PaymentStatus,
        description: str,
        reference_number: Optional[str] = None
    ):
        """Add entry to payment history"""
        try:
            with self.database.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO payment_history 
                    (payment_id, status, description, reference_number)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (payment_id, status.value, description, reference_number)
                )
            self.database.connection.commit()
            
        except Exception as e:
            logger.error(f"Error adding payment history: {e}")
    
    async def _get_account(self, account_id: str) -> BankAccount:
        """Get bank account details"""
        try:
            with self.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    "SELECT * FROM bank_accounts WHERE account_id = %s",
                    (account_id,)
                )
                row = cursor.fetchone()
                
                if not row:
                    raise ValueError(f"Account not found: {account_id}")
                
                return BankAccount(**dict(row))
                
        except Exception as e:
            logger.error(f"Error fetching account: {e}")
            raise
    
    async def get_payment_inquiry(self, payment_id: str) -> PaymentInquiry:
        """Get payment status and history"""
        try:
            # Get current payment status
            with self.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    "SELECT status FROM payments WHERE payment_id = %s",
                    (payment_id,)
                )
                payment_row = cursor.fetchone()
                
                if not payment_row:
                    raise ValueError(f"Payment not found: {payment_id}")
                
                # Get payment history
                cursor.execute(
                    """
                    SELECT status, description, reference_number, timestamp
                    FROM payment_history 
                    WHERE payment_id = %s 
                    ORDER BY timestamp DESC
                    """,
                    (payment_id,)
                )
                history_rows = cursor.fetchall()
                
                history = [
                    TransactionHistory(
                        payment_id=payment_id,
                        status=PaymentStatus(row['status']),
                        timestamp=row['timestamp'],
                        description=row['description'],
                        reference_number=row['reference_number']
                    )
                    for row in history_rows
                ]
                
                return PaymentInquiry(
                    payment_id=payment_id,
                    current_status=PaymentStatus(payment_row['status']),
                    transaction_history=history,
                    estimated_completion=None,  # Calculate based on payment method
                    last_updated=history[0].timestamp if history else datetime.utcnow()
                )
                
        except Exception as e:
            logger.error(f"Error getting payment inquiry: {e}")
            raise

# Initialize service
payments_service = PaymentsService()

# API endpoints
@app.on_event("startup")
async def startup_event():
    """Initialize service on startup"""
    await payments_service.initialize()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AILYDIAN Payments Gateway Service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.post("/api/v1/payments", response_model=PaymentResponse)
async def create_payment(payment: PaymentRequest):
    """Create a new payment"""
    return await payments_service.create_payment(payment)

@app.get("/api/v1/payments/{payment_id}", response_model=PaymentInquiry)
async def get_payment(payment_id: str):
    """Get payment status and history"""
    return await payments_service.get_payment_inquiry(payment_id)

@app.get("/api/v1/payment-methods")
async def get_payment_methods():
    """Get available payment methods with limits"""
    return {
        "payment_methods": {
            method: {
                "daily_limit": limits["daily"],
                "single_limit": limits["single"],
                "fee_rate": limits["fee_rate"],
                "estimated_time": {
                    "SWIFT": "1-2 business days",
                    "SEPA": "2-4 hours",
                    "ACH": "1-3 business days"
                }.get(method, "1 business day")
            }
            for method, limits in TRANSACTION_LIMITS.items()
        }
    }

@app.get("/api/v1/currencies")
async def get_supported_currencies():
    """Get supported currencies with current exchange rates"""
    currencies = {}
    for currency in Currency:
        if currency != Currency.USD:
            rate = await payments_service._get_exchange_rate(currency, Currency.USD)
            currencies[currency.value] = {
                "name": currency.value,
                "exchange_rate_to_usd": str(rate)
            }
        else:
            currencies[currency.value] = {
                "name": currency.value,
                "exchange_rate_to_usd": "1.00"
            }
    
    return currencies

@app.post("/api/v1/accounts", response_model=dict)
async def add_bank_account(account: BankAccount):
    """Add a new bank account"""
    try:
        # Encrypt sensitive data
        encrypted_data = cipher_suite.encrypt(
            json.dumps({
                "account_number": account.account_number,
                "routing_number": account.routing_number,
                "iban": account.iban
            }).encode()
        )
        
        with payments_service.database.connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO bank_accounts 
                (account_id, user_id, account_number, routing_number, iban,
                 swift_code, bank_name, account_holder_name, account_type,
                 currency, country_code, encrypted_data)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    account.account_id,
                    "user_123",  # In real implementation, get from JWT token
                    account.account_number[-4:],  # Store only last 4 digits
                    account.routing_number,
                    account.iban,
                    account.swift_code,
                    account.bank_name,
                    account.account_holder_name,
                    account.account_type.value,
                    account.currency.value,
                    account.country_code,
                    encrypted_data
                )
            )
        payments_service.database.connection.commit()
        
        return {"message": "Bank account added successfully", "account_id": account.account_id}
        
    except Exception as e:
        logger.error(f"Error adding bank account: {e}")
        raise HTTPException(status_code=500, detail="Failed to add bank account")

@app.get("/api/v1/compliance/{payment_id}", response_model=ComplianceCheck)
async def get_compliance_status(payment_id: str):
    """Get compliance check status for a payment"""
    try:
        with payments_service.database.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT * FROM compliance_checks WHERE payment_id = %s ORDER BY checked_at DESC LIMIT 1",
                (payment_id,)
            )
            row = cursor.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail="Compliance check not found")
            
            return ComplianceCheck(**dict(row))
            
    except Exception as e:
        logger.error(f"Error getting compliance status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get compliance status")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8012)
