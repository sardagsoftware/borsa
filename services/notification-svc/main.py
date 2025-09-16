"""
AILYDIAN Global Trader Ultra Pro
Notification Service - Real-time multi-channel notification system
"""

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, BackgroundTasks, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, List, Dict, Any, Set, Union
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
import asyncio
import logging
import json
import uuid
import smtplib
import aiohttp
import redis
import psycopg2
from psycopg2.extras import RealDictCursor, execute_values
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from dataclasses import dataclass
from contextlib import asynccontextmanager
import websockets
from twilio.rest import Client as TwilioClient
import pusher
from jinja2 import Template
import threading
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Enums
class NotificationChannel(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    WEBSOCKET = "websocket"
    IN_APP = "in_app"
    SLACK = "slack"
    TELEGRAM = "telegram"

class NotificationType(str, Enum):
    ALERT = "alert"
    WARNING = "warning"
    INFO = "info"
    SUCCESS = "success"
    ERROR = "error"
    TRADE_EXECUTION = "trade_execution"
    RISK_ALERT = "risk_alert"
    COMPLIANCE_ALERT = "compliance_alert"
    SYSTEM_NOTIFICATION = "system_notification"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    RETRY = "retry"

# Pydantic Models
class NotificationPreferences(BaseModel):
    user_id: str
    email_enabled: bool = True
    sms_enabled: bool = True
    push_enabled: bool = True
    websocket_enabled: bool = True
    email_address: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    push_device_tokens: List[str] = []
    quiet_hours_start: Optional[str] = None  # HH:MM format
    quiet_hours_end: Optional[str] = None
    priority_threshold: Priority = Priority.MEDIUM
    notification_types: Dict[NotificationType, bool] = {}

class NotificationRequest(BaseModel):
    user_ids: List[str]
    notification_type: NotificationType
    priority: Priority
    title: str
    message: str
    channels: List[NotificationChannel] = [NotificationChannel.WEBSOCKET, NotificationChannel.IN_APP]
    template_data: Dict[str, Any] = {}
    expires_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}

class WebSocketMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: datetime
    user_id: str

class AlertEscalation(BaseModel):
    alert_id: str
    user_id: str
    current_priority: Priority
    escalation_level: int
    escalated_to: List[str]
    escalation_reason: str
    created_at: datetime

@dataclass
class NotificationTemplate:
    id: str
    name: str
    type: NotificationType
    subject_template: str
    body_template: str
    channels: List[NotificationChannel]
    variables: List[str]

class ConnectionManager:
    """WebSocket connection manager"""
    
    def __init__(self):
        # user_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str, metadata: Dict[str, Any] = None):
        """Connect user WebSocket"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        self.connection_metadata[websocket] = {
            "user_id": user_id,
            "connected_at": datetime.utcnow(),
            "metadata": metadata or {}
        }
        
        logger.info(f"WebSocket connected for user {user_id}")
        
    async def disconnect(self, websocket: WebSocket):
        """Disconnect WebSocket"""
        if websocket in self.connection_metadata:
            user_id = self.connection_metadata[websocket]["user_id"]
            
            if user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
            
            del self.connection_metadata[websocket]
            logger.info(f"WebSocket disconnected for user {user_id}")
    
    async def send_personal_message(self, user_id: str, message: Dict[str, Any]):
        """Send message to specific user"""
        if user_id in self.active_connections:
            disconnected_connections = []
            
            for websocket in self.active_connections[user_id].copy():
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send message to {user_id}: {e}")
                    disconnected_connections.append(websocket)
            
            # Clean up disconnected connections
            for websocket in disconnected_connections:
                await self.disconnect(websocket)
    
    async def broadcast_message(self, message: Dict[str, Any], user_ids: Optional[List[str]] = None):
        """Broadcast message to multiple users"""
        target_users = user_ids or list(self.active_connections.keys())
        
        for user_id in target_users:
            await self.send_personal_message(user_id, message)
    
    def get_connected_users(self) -> List[str]:
        """Get list of connected user IDs"""
        return list(self.active_connections.keys())
    
    def get_connection_count(self, user_id: str = None) -> int:
        """Get connection count"""
        if user_id:
            return len(self.active_connections.get(user_id, set()))
        return sum(len(connections) for connections in self.active_connections.values())

class EmailService:
    """Email notification service"""
    
    def __init__(self, smtp_host: str, smtp_port: int, username: str, password: str):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        body: str, 
        html_body: str = None
    ) -> bool:
        """Send email notification"""
        try:
            msg = MimeMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.username
            msg['To'] = to_email
            
            # Add plain text part
            text_part = MimeText(body, 'plain')
            msg.attach(text_part)
            
            # Add HTML part if provided
            if html_body:
                html_part = MimeText(html_body, 'html')
                msg.attach(html_part)
            
            # Send email
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            server.login(self.username, self.password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

class SMSService:
    """SMS notification service using Twilio"""
    
    def __init__(self, account_sid: str, auth_token: str, from_number: str):
        self.client = TwilioClient(account_sid, auth_token)
        self.from_number = from_number
        
    async def send_sms(self, to_number: str, message: str) -> bool:
        """Send SMS notification"""
        try:
            message = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            
            logger.info(f"SMS sent successfully to {to_number}, SID: {message.sid}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send SMS to {to_number}: {e}")
            return False

class PushNotificationService:
    """Push notification service using Pusher"""
    
    def __init__(self, app_id: str, key: str, secret: str, cluster: str):
        self.pusher_client = pusher.Pusher(
            app_id=app_id,
            key=key,
            secret=secret,
            cluster=cluster,
            ssl=True
        )
        
    async def send_push_notification(
        self, 
        channel: str, 
        event: str, 
        data: Dict[str, Any]
    ) -> bool:
        """Send push notification"""
        try:
            self.pusher_client.trigger(channel, event, data)
            logger.info(f"Push notification sent to channel {channel}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send push notification: {e}")
            return False

class TemplateEngine:
    """Notification template engine"""
    
    def __init__(self, redis_client: redis.Redis, db_pool):
        self.redis = redis_client
        self.db_pool = db_pool
        self.templates = {}
        
    async def load_templates(self):
        """Load notification templates from database"""
        async with self.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                await cur.execute("""
                    SELECT id, name, type, subject_template, body_template,
                           channels, variables
                    FROM notification_templates
                    WHERE is_active = true
                """)
                
                templates = await cur.fetchall()
                for template in templates:
                    self.templates[template["type"]] = NotificationTemplate(
                        id=template["id"],
                        name=template["name"],
                        type=template["type"],
                        subject_template=template["subject_template"],
                        body_template=template["body_template"],
                        channels=template["channels"],
                        variables=template["variables"]
                    )
                
                logger.info(f"Loaded {len(templates)} notification templates")
    
    def render_template(
        self, 
        notification_type: NotificationType, 
        template_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """Render notification template"""
        if notification_type not in self.templates:
            return {
                "subject": "AILYDIAN Notification",
                "body": f"Notification: {template_data.get('message', 'No message')}"
            }
        
        template = self.templates[notification_type]
        
        try:
            subject_template = Template(template.subject_template)
            body_template = Template(template.body_template)
            
            return {
                "subject": subject_template.render(**template_data),
                "body": body_template.render(**template_data)
            }
            
        except Exception as e:
            logger.error(f"Template rendering failed for {notification_type}: {e}")
            return {
                "subject": "AILYDIAN Notification",
                "body": f"Template error. Original message: {template_data.get('message', 'No message')}"
            }

class EscalationEngine:
    """Alert escalation and routing engine"""
    
    def __init__(self, redis_client: redis.Redis, db_pool, notification_service):
        self.redis = redis_client
        self.db_pool = db_pool
        self.notification_service = notification_service
        
        # Escalation rules
        self.escalation_rules = {
            Priority.EMERGENCY: {
                "initial_delay": 0,  # seconds
                "escalation_delays": [300, 600, 1800],  # 5min, 10min, 30min
                "escalation_channels": [NotificationChannel.SMS, NotificationChannel.EMAIL, NotificationChannel.SLACK]
            },
            Priority.CRITICAL: {
                "initial_delay": 60,
                "escalation_delays": [600, 1800, 3600],  # 10min, 30min, 1hr
                "escalation_channels": [NotificationChannel.EMAIL, NotificationChannel.SMS]
            },
            Priority.HIGH: {
                "initial_delay": 300,
                "escalation_delays": [1800, 3600],  # 30min, 1hr
                "escalation_channels": [NotificationChannel.EMAIL]
            }
        }
    
    async def process_escalation(self, alert_id: str, priority: Priority):
        """Process alert escalation"""
        if priority not in self.escalation_rules:
            return
            
        rules = self.escalation_rules[priority]
        
        # Schedule initial notification
        await asyncio.sleep(rules["initial_delay"])
        await self._send_escalated_notification(alert_id, priority, 0)
        
        # Schedule escalations
        for level, delay in enumerate(rules["escalation_delays"], 1):
            await asyncio.sleep(delay)
            await self._send_escalated_notification(alert_id, priority, level)
    
    async def _send_escalated_notification(self, alert_id: str, priority: Priority, level: int):
        """Send escalated notification"""
        async with self.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get alert details
                await cur.execute("""
                    SELECT * FROM notifications 
                    WHERE id = %s
                """, (alert_id,))
                alert = await cur.fetchone()
                
                if alert:
                    escalation_channels = self.escalation_rules[priority]["escalation_channels"]
                    
                    # Send escalated notification
                    escalation_request = NotificationRequest(
                        user_ids=[alert["user_id"]],
                        notification_type=NotificationType.RISK_ALERT,
                        priority=priority,
                        title=f"ESCALATED: {alert['title']}",
                        message=f"Alert escalation level {level}. Original: {alert['message']}",
                        channels=escalation_channels
                    )
                    
                    await self.notification_service.send_notification(escalation_request)
                    
                    # Log escalation
                    await self._log_escalation(alert_id, alert["user_id"], priority, level)
    
    async def _log_escalation(self, alert_id: str, user_id: str, priority: Priority, level: int):
        """Log escalation event"""
        async with self.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO notification_escalations (
                        alert_id, user_id, priority, escalation_level,
                        escalated_at
                    ) VALUES (%s, %s, %s, %s, %s)
                """, (alert_id, user_id, priority, level, datetime.utcnow()))
                await conn.commit()

class NotificationService:
    """Main notification service orchestrator"""
    
    def __init__(self):
        self.redis_client = None
        self.db_pool = None
        self.connection_manager = ConnectionManager()
        self.email_service = None
        self.sms_service = None
        self.push_service = None
        self.template_engine = None
        self.escalation_engine = None
        
    async def initialize(self):
        """Initialize notification service"""
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
                database="ailydian_notifications",
                user="postgres",
                password="password"
            )
            
            # Initialize services
            self.email_service = EmailService(
                smtp_host="smtp.gmail.com",
                smtp_port=587,
                username="notifications@ailydian.com",
                password="email_password"
            )
            
            self.sms_service = SMSService(
                account_sid="twilio_sid",
                auth_token="twilio_token",
                from_number="+1234567890"
            )
            
            self.push_service = PushNotificationService(
                app_id="pusher_app_id",
                key="pusher_key",
                secret="pusher_secret",
                cluster="us2"
            )
            
            self.template_engine = TemplateEngine(self.redis_client, self.db_pool)
            self.escalation_engine = EscalationEngine(self.redis_client, self.db_pool, self)
            
            # Load templates
            await self.template_engine.load_templates()
            
            await self._create_database_schema()
            logger.info("Notification service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize notification service: {e}")
            raise
    
    async def send_notification(self, request: NotificationRequest) -> Dict[str, Any]:
        """Send multi-channel notification"""
        notification_id = str(uuid.uuid4())
        results = {
            "notification_id": notification_id,
            "sent_channels": [],
            "failed_channels": [],
            "user_results": {}
        }
        
        try:
            for user_id in request.user_ids:
                user_results = {"sent": [], "failed": []}
                
                # Get user preferences
                preferences = await self._get_user_preferences(user_id)
                
                # Check quiet hours
                if self._is_quiet_hours(preferences):
                    if request.priority not in [Priority.CRITICAL, Priority.EMERGENCY]:
                        continue
                
                # Render template
                rendered = self.template_engine.render_template(
                    request.notification_type, 
                    {**request.template_data, "user_id": user_id, "title": request.title, "message": request.message}
                )
                
                # Send through enabled channels
                for channel in request.channels:
                    if await self._is_channel_enabled(user_id, channel, preferences):
                        success = await self._send_through_channel(
                            channel, user_id, rendered, request, preferences
                        )
                        
                        if success:
                            user_results["sent"].append(channel)
                        else:
                            user_results["failed"].append(channel)
                
                results["user_results"][user_id] = user_results
            
            # Store notification
            await self._store_notification(notification_id, request, results)
            
            # Start escalation if critical
            if request.priority in [Priority.CRITICAL, Priority.EMERGENCY]:
                asyncio.create_task(
                    self.escalation_engine.process_escalation(notification_id, request.priority)
                )
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
            raise HTTPException(status_code=500, detail=f"Notification failed: {e}")
    
    async def _send_through_channel(
        self, 
        channel: NotificationChannel, 
        user_id: str, 
        rendered: Dict[str, str], 
        request: NotificationRequest,
        preferences: NotificationPreferences
    ) -> bool:
        """Send notification through specific channel"""
        try:
            if channel == NotificationChannel.EMAIL:
                if preferences.email_address:
                    return await self.email_service.send_email(
                        preferences.email_address,
                        rendered["subject"],
                        rendered["body"]
                    )
                    
            elif channel == NotificationChannel.SMS:
                if preferences.phone_number:
                    return await self.sms_service.send_sms(
                        preferences.phone_number,
                        f"{rendered['subject']}: {rendered['body']}"
                    )
                    
            elif channel == NotificationChannel.WEBSOCKET:
                message = {
                    "type": "notification",
                    "data": {
                        "id": str(uuid.uuid4()),
                        "type": request.notification_type,
                        "priority": request.priority,
                        "title": request.title,
                        "message": request.message,
                        "timestamp": datetime.utcnow().isoformat(),
                        "metadata": request.metadata
                    }
                }
                await self.connection_manager.send_personal_message(user_id, message)
                return True
                
            elif channel == NotificationChannel.PUSH:
                return await self.push_service.send_push_notification(
                    f"user_{user_id}",
                    "notification",
                    {
                        "title": rendered["subject"],
                        "body": rendered["body"],
                        "priority": request.priority,
                        "type": request.notification_type
                    }
                )
                
            return False
            
        except Exception as e:
            logger.error(f"Failed to send through {channel}: {e}")
            return False
    
    async def _get_user_preferences(self, user_id: str) -> NotificationPreferences:
        """Get user notification preferences"""
        cached_prefs = await self.redis_client.get(f"user_prefs:{user_id}")
        if cached_prefs:
            return NotificationPreferences.parse_raw(cached_prefs)
        
        async with self.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                await cur.execute("""
                    SELECT * FROM notification_preferences 
                    WHERE user_id = %s
                """, (user_id,))
                
                prefs_data = await cur.fetchone()
                if prefs_data:
                    prefs = NotificationPreferences(**prefs_data)
                else:
                    # Default preferences
                    prefs = NotificationPreferences(user_id=user_id)
                
                # Cache preferences
                await self.redis_client.setex(
                    f"user_prefs:{user_id}", 
                    3600, 
                    prefs.json()
                )
                
                return prefs
    
    def _is_quiet_hours(self, preferences: NotificationPreferences) -> bool:
        """Check if current time is within quiet hours"""
        if not preferences.quiet_hours_start or not preferences.quiet_hours_end:
            return False
        
        now = datetime.utcnow().time()
        start = datetime.strptime(preferences.quiet_hours_start, "%H:%M").time()
        end = datetime.strptime(preferences.quiet_hours_end, "%H:%M").time()
        
        if start <= end:
            return start <= now <= end
        else:
            return now >= start or now <= end
    
    async def _is_channel_enabled(
        self, 
        user_id: str, 
        channel: NotificationChannel, 
        preferences: NotificationPreferences
    ) -> bool:
        """Check if channel is enabled for user"""
        channel_enabled_map = {
            NotificationChannel.EMAIL: preferences.email_enabled,
            NotificationChannel.SMS: preferences.sms_enabled,
            NotificationChannel.PUSH: preferences.push_enabled,
            NotificationChannel.WEBSOCKET: preferences.websocket_enabled,
            NotificationChannel.IN_APP: True  # Always enabled
        }
        
        return channel_enabled_map.get(channel, False)
    
    async def _store_notification(
        self, 
        notification_id: str, 
        request: NotificationRequest, 
        results: Dict[str, Any]
    ):
        """Store notification in database"""
        async with self.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO notifications (
                        id, user_ids, notification_type, priority, title, message,
                        channels, template_data, expires_at, metadata, results,
                        created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    notification_id,
                    json.dumps(request.user_ids),
                    request.notification_type,
                    request.priority,
                    request.title,
                    request.message,
                    json.dumps(request.channels),
                    json.dumps(request.template_data),
                    request.expires_at,
                    json.dumps(request.metadata),
                    json.dumps(results),
                    datetime.utcnow()
                ))
                await conn.commit()
    
    async def _create_database_schema(self):
        """Create database schema"""
        schema_sql = """
        -- Notification Preferences
        CREATE TABLE IF NOT EXISTS notification_preferences (
            user_id VARCHAR(255) PRIMARY KEY,
            email_enabled BOOLEAN DEFAULT true,
            sms_enabled BOOLEAN DEFAULT true,
            push_enabled BOOLEAN DEFAULT true,
            websocket_enabled BOOLEAN DEFAULT true,
            email_address VARCHAR(255),
            phone_number VARCHAR(20),
            push_device_tokens TEXT[] DEFAULT '{}',
            quiet_hours_start TIME,
            quiet_hours_end TIME,
            priority_threshold VARCHAR(20) DEFAULT 'medium',
            notification_types JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Notifications
        CREATE TABLE IF NOT EXISTS notifications (
            id VARCHAR(255) PRIMARY KEY,
            user_ids TEXT[] NOT NULL,
            notification_type VARCHAR(50) NOT NULL,
            priority VARCHAR(20) NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            channels TEXT[] NOT NULL,
            template_data JSONB DEFAULT '{}',
            expires_at TIMESTAMP,
            metadata JSONB DEFAULT '{}',
            results JSONB DEFAULT '{}',
            status VARCHAR(20) DEFAULT 'sent',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Notification Templates
        CREATE TABLE IF NOT EXISTS notification_templates (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            subject_template TEXT NOT NULL,
            body_template TEXT NOT NULL,
            channels TEXT[] NOT NULL,
            variables TEXT[] DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Notification Escalations
        CREATE TABLE IF NOT EXISTS notification_escalations (
            id SERIAL PRIMARY KEY,
            alert_id VARCHAR(255) NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            priority VARCHAR(20) NOT NULL,
            escalation_level INTEGER NOT NULL,
            escalated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Notification Delivery Log
        CREATE TABLE IF NOT EXISTS notification_delivery_log (
            id SERIAL PRIMARY KEY,
            notification_id VARCHAR(255) NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            channel VARCHAR(50) NOT NULL,
            status VARCHAR(20) NOT NULL,
            delivery_details JSONB DEFAULT '{}',
            delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (notification_id) REFERENCES notifications(id)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_notifications_user_ids ON notifications USING GIN(user_ids);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
        CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
        CREATE INDEX IF NOT EXISTS idx_delivery_log_notification_id ON notification_delivery_log(notification_id);
        """
        
        async with self.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute(schema_sql)
                await conn.commit()

# Initialize FastAPI app
app = FastAPI(
    title="AILYDIAN Notification Service",
    description="Real-time multi-channel notification system",
    version="1.0.0"
)

# Global service instance
notification_service = NotificationService()

@app.on_event("startup")
async def startup_event():
    await notification_service.initialize()

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await notification_service.connection_manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
            elif message_data.get("type") == "mark_read":
                # Handle notification read status
                await mark_notification_read(user_id, message_data.get("notification_id"))
            
    except WebSocketDisconnect:
        await notification_service.connection_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        await notification_service.connection_manager.disconnect(websocket)

# API Endpoints
@app.post("/api/v1/send-notification")
async def send_notification(
    request: NotificationRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Send multi-channel notification"""
    try:
        results = await notification_service.send_notification(request)
        return {
            "status": "success",
            "results": results,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Failed to send notification: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {e}")

@app.post("/api/v1/send-alert")
async def send_alert(
    user_ids: List[str],
    alert_type: str,
    priority: Priority,
    title: str,
    message: str,
    metadata: Dict[str, Any] = {}
) -> Dict[str, Any]:
    """Send alert notification"""
    try:
        channels = [NotificationChannel.WEBSOCKET, NotificationChannel.IN_APP]
        
        if priority in [Priority.HIGH, Priority.CRITICAL, Priority.EMERGENCY]:
            channels.extend([NotificationChannel.EMAIL, NotificationChannel.SMS])
        
        request = NotificationRequest(
            user_ids=user_ids,
            notification_type=NotificationType.ALERT,
            priority=priority,
            title=title,
            message=message,
            channels=channels,
            metadata=metadata
        )
        
        results = await notification_service.send_notification(request)
        return {
            "status": "success",
            "alert_sent": True,
            "results": results,
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Failed to send alert: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send alert: {e}")

@app.put("/api/v1/preferences/{user_id}")
async def update_notification_preferences(
    user_id: str,
    preferences: NotificationPreferences
) -> Dict[str, Any]:
    """Update user notification preferences"""
    try:
        async with notification_service.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO notification_preferences (
                        user_id, email_enabled, sms_enabled, push_enabled,
                        websocket_enabled, email_address, phone_number,
                        push_device_tokens, quiet_hours_start, quiet_hours_end,
                        priority_threshold, notification_types, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (user_id) DO UPDATE SET
                        email_enabled = EXCLUDED.email_enabled,
                        sms_enabled = EXCLUDED.sms_enabled,
                        push_enabled = EXCLUDED.push_enabled,
                        websocket_enabled = EXCLUDED.websocket_enabled,
                        email_address = EXCLUDED.email_address,
                        phone_number = EXCLUDED.phone_number,
                        push_device_tokens = EXCLUDED.push_device_tokens,
                        quiet_hours_start = EXCLUDED.quiet_hours_start,
                        quiet_hours_end = EXCLUDED.quiet_hours_end,
                        priority_threshold = EXCLUDED.priority_threshold,
                        notification_types = EXCLUDED.notification_types,
                        updated_at = EXCLUDED.updated_at
                """, (
                    user_id,
                    preferences.email_enabled,
                    preferences.sms_enabled,
                    preferences.push_enabled,
                    preferences.websocket_enabled,
                    preferences.email_address,
                    preferences.phone_number,
                    preferences.push_device_tokens,
                    preferences.quiet_hours_start,
                    preferences.quiet_hours_end,
                    preferences.priority_threshold,
                    json.dumps(preferences.notification_types),
                    datetime.utcnow()
                ))
                await conn.commit()
        
        # Clear cache
        await notification_service.redis_client.delete(f"user_prefs:{user_id}")
        
        return {
            "status": "success",
            "message": "Notification preferences updated",
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Failed to update preferences for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update preferences: {e}")

@app.get("/api/v1/preferences/{user_id}")
async def get_notification_preferences(user_id: str) -> Dict[str, Any]:
    """Get user notification preferences"""
    try:
        preferences = await notification_service._get_user_preferences(user_id)
        return {
            "status": "success",
            "preferences": preferences.dict(),
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Failed to get preferences for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get preferences: {e}")

@app.get("/api/v1/notifications/{user_id}")
async def get_user_notifications(
    user_id: str,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0)
) -> Dict[str, Any]:
    """Get user notifications"""
    try:
        async with notification_service.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                await cur.execute("""
                    SELECT * FROM notifications 
                    WHERE %s = ANY(user_ids)
                    ORDER BY created_at DESC
                    LIMIT %s OFFSET %s
                """, (user_id, limit, offset))
                
                notifications = await cur.fetchall()
                
                return {
                    "status": "success",
                    "notifications": notifications,
                    "count": len(notifications),
                    "timestamp": datetime.utcnow()
                }
                
    except Exception as e:
        logger.error(f"Failed to get notifications for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get notifications: {e}")

@app.get("/api/v1/connected-users")
async def get_connected_users() -> Dict[str, Any]:
    """Get connected users via WebSocket"""
    try:
        connected_users = notification_service.connection_manager.get_connected_users()
        total_connections = notification_service.connection_manager.get_connection_count()
        
        return {
            "status": "success",
            "connected_users": connected_users,
            "total_users": len(connected_users),
            "total_connections": total_connections,
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Failed to get connected users: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get connected users: {e}")

@app.post("/api/v1/broadcast")
async def broadcast_message(
    message: str,
    title: str = "System Broadcast",
    user_ids: Optional[List[str]] = None,
    priority: Priority = Priority.MEDIUM
) -> Dict[str, Any]:
    """Broadcast message to users"""
    try:
        if user_ids is None:
            user_ids = notification_service.connection_manager.get_connected_users()
        
        request = NotificationRequest(
            user_ids=user_ids,
            notification_type=NotificationType.SYSTEM_NOTIFICATION,
            priority=priority,
            title=title,
            message=message,
            channels=[NotificationChannel.WEBSOCKET, NotificationChannel.IN_APP]
        )
        
        results = await notification_service.send_notification(request)
        
        return {
            "status": "success",
            "broadcast_sent": True,
            "target_users": len(user_ids),
            "results": results,
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Failed to broadcast message: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to broadcast: {e}")

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis
        await notification_service.redis_client.ping()
        
        # Check database
        async with notification_service.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1")
        
        # Get connection stats
        connected_users = len(notification_service.connection_manager.get_connected_users())
        total_connections = notification_service.connection_manager.get_connection_count()
        
        return {
            "status": "healthy",
            "services": {
                "redis": "connected",
                "database": "connected",
                "websocket": "operational",
                "email": "configured",
                "sms": "configured",
                "push": "configured"
            },
            "stats": {
                "connected_users": connected_users,
                "total_connections": total_connections
            },
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow()
        }

async def mark_notification_read(user_id: str, notification_id: str):
    """Mark notification as read (internal function)"""
    try:
        async with notification_service.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    UPDATE notifications 
                    SET metadata = jsonb_set(
                        COALESCE(metadata, '{}'), 
                        '{read_by}', 
                        COALESCE(metadata->'read_by', '[]') || %s::jsonb
                    )
                    WHERE id = %s
                """, (json.dumps([{"user_id": user_id, "read_at": datetime.utcnow().isoformat()}]), notification_id))
                await conn.commit()
                
    except Exception as e:
        logger.error(f"Failed to mark notification as read: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8016)
