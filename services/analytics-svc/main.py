"""
AILYDIAN Global Trader Ultra Pro
Analytics Service - Real-time data processing and ML-powered insights
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
import uuid
import numpy as np
import pandas as pd
import redis
import psycopg2
from psycopg2.extras import RealDictCursor, execute_values
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import plotly.graph_objects as go
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder
from dataclasses import dataclass
import httpx
import asyncpg
from contextlib import asynccontextmanager
import threading
import time
from collections import defaultdict, deque
import statistics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Enums
class MetricType(str, Enum):
    PORTFOLIO_VALUE = "portfolio_value"
    DAILY_PNL = "daily_pnl"
    RISK_SCORE = "risk_score"
    YIELD_PERFORMANCE = "yield_performance"
    TRADING_VOLUME = "trading_volume"
    SUCCESS_RATE = "success_rate"
    DRAWDOWN = "drawdown"
    SHARPE_RATIO = "sharpe_ratio"
    VOLATILITY = "volatility"

class AnalyticsTimeframe(str, Enum):
    MINUTE = "1m"
    FIVE_MINUTES = "5m"
    FIFTEEN_MINUTES = "15m"
    HOUR = "1h"
    FOUR_HOURS = "4h"
    DAY = "1d"
    WEEK = "1w"
    MONTH = "1M"

class ChartType(str, Enum):
    LINE = "line"
    CANDLESTICK = "candlestick"
    BAR = "bar"
    AREA = "area"
    SCATTER = "scatter"
    HEATMAP = "heatmap"
    PIE = "pie"

class AlertCondition(str, Enum):
    GREATER_THAN = "gt"
    LESS_THAN = "lt"
    EQUALS = "eq"
    PERCENTAGE_CHANGE = "pct_change"
    MOVING_AVERAGE_CROSS = "ma_cross"

# Pydantic Models
class MetricQuery(BaseModel):
    user_id: str
    metric_type: MetricType
    timeframe: AnalyticsTimeframe
    start_time: datetime
    end_time: datetime
    group_by: Optional[str] = None
    filters: Dict[str, Any] = {}

class DashboardWidget(BaseModel):
    widget_id: str
    title: str
    chart_type: ChartType
    metric_query: MetricQuery
    config: Dict[str, Any] = {}
    position: Dict[str, int] = {"x": 0, "y": 0, "w": 4, "h": 3}

class Dashboard(BaseModel):
    dashboard_id: str
    user_id: str
    name: str
    description: str
    widgets: List[DashboardWidget]
    is_public: bool = False
    created_at: Optional[datetime] = None

class AlertRule(BaseModel):
    rule_id: str
    user_id: str
    name: str
    metric_type: MetricType
    condition: AlertCondition
    threshold_value: float
    comparison_period: Optional[int] = None  # minutes
    is_active: bool = True
    notification_channels: List[str] = ["websocket", "email"]

class PerformanceMetrics(BaseModel):
    user_id: str
    period_start: datetime
    period_end: datetime
    total_return: float
    daily_returns: List[float]
    volatility: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    profit_factor: float
    total_trades: int

@dataclass
class RealTimeMetric:
    metric_type: MetricType
    user_id: str
    value: float
    timestamp: datetime
    metadata: Dict[str, Any]

class MLAnalyticsEngine:
    """Machine Learning powered analytics engine"""
    
    def __init__(self, redis_client: redis.Redis, db_pool):
        self.redis = redis_client
        self.db_pool = db_pool
        self.models = {}
        self.scalers = {}
        self.anomaly_detectors = {}
        
    async def initialize_models(self):
        """Initialize ML models for various analytics"""
        try:
            # Initialize models for different user patterns
            await self._train_portfolio_performance_model()
            await self._train_risk_prediction_model()
            await self._train_anomaly_detection_model()
            logger.info("ML models initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize ML models: {e}")
    
    async def _train_portfolio_performance_model(self):
        """Train portfolio performance prediction model"""
        try:
            # Get historical portfolio data
            async with self.db_pool.getconn() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("""
                        SELECT user_id, portfolio_value, daily_pnl, risk_score,
                               trading_volume, timestamp
                        FROM user_metrics
                        WHERE metric_type = 'portfolio_value'
                        AND timestamp > %s
                        ORDER BY timestamp
                    """, (datetime.utcnow() - timedelta(days=90),))
                    
                    data = await cur.fetchall()
                    
                    if len(data) < 100:  # Need minimum data
                        logger.warning("Insufficient data for portfolio model training")
                        return
                    
                    # Prepare features
                    df = pd.DataFrame(data, columns=['user_id', 'portfolio_value', 'daily_pnl', 
                                                   'risk_score', 'trading_volume', 'timestamp'])
                    
                    # Feature engineering
                    df['portfolio_change'] = df['portfolio_value'].pct_change()
                    df['volume_ma'] = df['trading_volume'].rolling(window=7).mean()
                    df['risk_ma'] = df['risk_score'].rolling(window=7).mean()
                    df = df.dropna()
                    
                    # Prepare training data
                    features = ['daily_pnl', 'risk_score', 'trading_volume', 'volume_ma', 'risk_ma']
                    X = df[features]
                    y = df['portfolio_change']
                    
                    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
                    
                    # Train model
                    scaler = StandardScaler()
                    X_train_scaled = scaler.fit_transform(X_train)
                    X_test_scaled = scaler.transform(X_test)
                    
                    model = RandomForestRegressor(n_estimators=100, random_state=42)
                    model.fit(X_train_scaled, y_train)
                    
                    # Evaluate model
                    y_pred = model.predict(X_test_scaled)
                    mae = mean_absolute_error(y_test, y_pred)
                    r2 = r2_score(y_test, y_pred)
                    
                    logger.info(f"Portfolio model trained - MAE: {mae:.4f}, R²: {r2:.4f}")
                    
                    # Store model
                    self.models['portfolio_performance'] = model
                    self.scalers['portfolio_performance'] = scaler
                    
        except Exception as e:
            logger.error(f"Portfolio model training failed: {e}")
    
    async def _train_risk_prediction_model(self):
        """Train risk prediction model"""
        try:
            async with self.db_pool.getconn() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("""
                        SELECT portfolio_value, daily_pnl, trading_volume,
                               volatility, risk_score
                        FROM user_metrics um
                        JOIN user_performance_metrics upm ON um.user_id = upm.user_id
                        WHERE um.timestamp > %s
                    """, (datetime.utcnow() - timedelta(days=60),))
                    
                    data = await cur.fetchall()
                    
                    if len(data) < 50:
                        logger.warning("Insufficient data for risk model training")
                        return
                    
                    df = pd.DataFrame(data, columns=['portfolio_value', 'daily_pnl', 
                                                   'trading_volume', 'volatility', 'risk_score'])
                    df = df.dropna()
                    
                    # Prepare features
                    features = ['portfolio_value', 'daily_pnl', 'trading_volume', 'volatility']
                    X = df[features]
                    y = df['risk_score']
                    
                    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
                    
                    # Train model
                    scaler = StandardScaler()
                    X_train_scaled = scaler.fit_transform(X_train)
                    X_test_scaled = scaler.transform(X_test)
                    
                    model = RandomForestRegressor(n_estimators=50, random_state=42)
                    model.fit(X_train_scaled, y_train)
                    
                    # Evaluate
                    y_pred = model.predict(X_test_scaled)
                    mae = mean_absolute_error(y_test, y_pred)
                    
                    logger.info(f"Risk model trained - MAE: {mae:.4f}")
                    
                    self.models['risk_prediction'] = model
                    self.scalers['risk_prediction'] = scaler
                    
        except Exception as e:
            logger.error(f"Risk model training failed: {e}")
    
    async def _train_anomaly_detection_model(self):
        """Train anomaly detection model"""
        try:
            async with self.db_pool.getconn() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("""
                        SELECT trading_volume, daily_pnl, portfolio_value,
                               risk_score
                        FROM user_metrics um
                        JOIN user_performance_metrics upm ON um.user_id = upm.user_id
                        WHERE um.timestamp > %s
                    """, (datetime.utcnow() - timedelta(days=30),))
                    
                    data = await cur.fetchall()
                    
                    if len(data) < 30:
                        logger.warning("Insufficient data for anomaly detection training")
                        return
                    
                    df = pd.DataFrame(data, columns=['trading_volume', 'daily_pnl', 
                                                   'portfolio_value', 'risk_score'])
                    df = df.dropna()
                    
                    # Normalize data
                    scaler = StandardScaler()
                    X_scaled = scaler.fit_transform(df)
                    
                    # Train anomaly detector
                    model = IsolationForest(contamination=0.1, random_state=42)
                    model.fit(X_scaled)
                    
                    logger.info("Anomaly detection model trained successfully")
                    
                    self.anomaly_detectors['user_behavior'] = model
                    self.scalers['anomaly_detection'] = scaler
                    
        except Exception as e:
            logger.error(f"Anomaly detection training failed: {e}")
    
    async def predict_portfolio_performance(self, user_id: str, features: Dict[str, float]) -> Dict[str, Any]:
        """Predict portfolio performance"""
        if 'portfolio_performance' not in self.models:
            return {"error": "Portfolio model not available"}
        
        try:
            model = self.models['portfolio_performance']
            scaler = self.scalers['portfolio_performance']
            
            # Prepare features
            feature_values = [
                features.get('daily_pnl', 0),
                features.get('risk_score', 50),
                features.get('trading_volume', 0),
                features.get('volume_ma', 0),
                features.get('risk_ma', 50)
            ]
            
            # Scale and predict
            features_scaled = scaler.transform([feature_values])
            prediction = model.predict(features_scaled)[0]
            
            # Get feature importance
            feature_importance = dict(zip(
                ['daily_pnl', 'risk_score', 'trading_volume', 'volume_ma', 'risk_ma'],
                model.feature_importances_
            ))
            
            return {
                "predicted_change": float(prediction),
                "confidence": float(np.max(model.feature_importances_)),
                "feature_importance": feature_importance,
                "prediction_horizon": "1_day"
            }
            
        except Exception as e:
            logger.error(f"Portfolio prediction failed: {e}")
            return {"error": str(e)}
    
    async def detect_anomalies(self, user_data: Dict[str, float]) -> Dict[str, Any]:
        """Detect anomalies in user behavior"""
        if 'user_behavior' not in self.anomaly_detectors:
            return {"is_anomaly": False, "reason": "Model not available"}
        
        try:
            model = self.anomaly_detectors['user_behavior']
            scaler = self.scalers['anomaly_detection']
            
            # Prepare data
            data_values = [
                user_data.get('trading_volume', 0),
                user_data.get('daily_pnl', 0),
                user_data.get('portfolio_value', 0),
                user_data.get('risk_score', 50)
            ]
            
            # Scale and predict
            data_scaled = scaler.transform([data_values])
            anomaly_score = model.decision_function(data_scaled)[0]
            is_anomaly = model.predict(data_scaled)[0] == -1
            
            return {
                "is_anomaly": bool(is_anomaly),
                "anomaly_score": float(anomaly_score),
                "threshold": 0.0,
                "confidence": abs(anomaly_score)
            }
            
        except Exception as e:
            logger.error(f"Anomaly detection failed: {e}")
            return {"is_anomaly": False, "error": str(e)}

class ChartGenerator:
    """Advanced chart generation for analytics"""
    
    @staticmethod
    def generate_portfolio_chart(data: List[Dict], chart_type: ChartType) -> Dict[str, Any]:
        """Generate portfolio performance chart"""
        try:
            df = pd.DataFrame(data)
            
            if chart_type == ChartType.LINE:
                fig = px.line(df, x='timestamp', y='portfolio_value', 
                            title='Portfolio Performance Over Time')
                
            elif chart_type == ChartType.AREA:
                fig = px.area(df, x='timestamp', y='portfolio_value',
                            title='Portfolio Value Area Chart')
                
            elif chart_type == ChartType.CANDLESTICK:
                fig = go.Figure(data=go.Candlestick(
                    x=df['timestamp'],
                    open=df['open_value'],
                    high=df['high_value'],
                    low=df['low_value'],
                    close=df['portfolio_value']
                ))
                fig.update_layout(title='Portfolio Candlestick Chart')
                
            else:
                fig = px.line(df, x='timestamp', y='portfolio_value')
            
            return json.loads(fig.to_json())
            
        except Exception as e:
            logger.error(f"Chart generation failed: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def generate_performance_metrics_chart(metrics: PerformanceMetrics) -> Dict[str, Any]:
        """Generate comprehensive performance metrics chart"""
        try:
            # Create subplots
            fig = go.Figure()
            
            # Daily returns
            fig.add_trace(go.Scatter(
                x=list(range(len(metrics.daily_returns))),
                y=metrics.daily_returns,
                mode='lines',
                name='Daily Returns',
                line=dict(color='blue')
            ))
            
            # Add moving average
            if len(metrics.daily_returns) >= 7:
                ma_7 = pd.Series(metrics.daily_returns).rolling(7).mean()
                fig.add_trace(go.Scatter(
                    x=list(range(len(ma_7))),
                    y=ma_7,
                    mode='lines',
                    name='7-Day MA',
                    line=dict(color='red', dash='dash')
                ))
            
            fig.update_layout(
                title='Daily Returns Analysis',
                xaxis_title='Days',
                yaxis_title='Return %',
                showlegend=True
            )
            
            return json.loads(fig.to_json())
            
        except Exception as e:
            logger.error(f"Performance chart generation failed: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def generate_risk_heatmap(risk_data: List[Dict]) -> Dict[str, Any]:
        """Generate risk correlation heatmap"""
        try:
            df = pd.DataFrame(risk_data)
            
            # Calculate correlation matrix
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            corr_matrix = df[numeric_cols].corr()
            
            fig = px.imshow(
                corr_matrix,
                title='Risk Correlation Heatmap',
                color_continuous_scale='RdBu_r',
                aspect='auto'
            )
            
            return json.loads(fig.to_json())
            
        except Exception as e:
            logger.error(f"Heatmap generation failed: {e}")
            return {"error": str(e)}

class RealTimeProcessor:
    """Real-time data processing engine"""
    
    def __init__(self, redis_client: redis.Redis, db_pool):
        self.redis = redis_client
        self.db_pool = db_pool
        self.metric_buffers = defaultdict(lambda: deque(maxlen=1000))
        self.processing_active = False
        
    async def start_processing(self):
        """Start real-time processing"""
        self.processing_active = True
        asyncio.create_task(self._process_metrics_continuously())
        logger.info("Real-time processing started")
    
    async def stop_processing(self):
        """Stop real-time processing"""
        self.processing_active = False
        logger.info("Real-time processing stopped")
    
    async def _process_metrics_continuously(self):
        """Continuously process incoming metrics"""
        while self.processing_active:
            try:
                await self._process_pending_metrics()
                await asyncio.sleep(1)  # Process every second
            except Exception as e:
                logger.error(f"Metric processing error: {e}")
                await asyncio.sleep(5)  # Wait before retry
    
    async def _process_pending_metrics(self):
        """Process pending metrics from Redis queue"""
        try:
            # Get pending metrics from Redis
            pending_metrics = await self.redis.lrange("pending_metrics", 0, 99)
            if not pending_metrics:
                return
            
            # Remove processed metrics from queue
            await self.redis.ltrim("pending_metrics", len(pending_metrics), -1)
            
            # Process each metric
            for metric_json in pending_metrics:
                metric_data = json.loads(metric_json)
                await self._process_single_metric(metric_data)
                
        except Exception as e:
            logger.error(f"Pending metrics processing failed: {e}")
    
    async def _process_single_metric(self, metric_data: Dict[str, Any]):
        """Process a single metric"""
        try:
            user_id = metric_data['user_id']
            metric_type = metric_data['metric_type']
            value = metric_data['value']
            timestamp = datetime.fromisoformat(metric_data['timestamp'])
            
            # Add to buffer
            buffer_key = f"{user_id}:{metric_type}"
            self.metric_buffers[buffer_key].append({
                'value': value,
                'timestamp': timestamp,
                'metadata': metric_data.get('metadata', {})
            })
            
            # Store in database
            await self._store_metric(user_id, metric_type, value, timestamp, 
                                   metric_data.get('metadata', {}))
            
            # Update Redis cache
            await self._update_metric_cache(user_id, metric_type, value, timestamp)
            
            # Check for alerts
            await self._check_metric_alerts(user_id, metric_type, value)
            
        except Exception as e:
            logger.error(f"Single metric processing failed: {e}")
    
    async def _store_metric(self, user_id: str, metric_type: str, value: float, 
                          timestamp: datetime, metadata: Dict[str, Any]):
        """Store metric in database"""
        async with self.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO user_metrics (
                        user_id, metric_type, value, timestamp, metadata
                    ) VALUES (%s, %s, %s, %s, %s)
                """, (user_id, metric_type, value, timestamp, json.dumps(metadata)))
                await conn.commit()
    
    async def _update_metric_cache(self, user_id: str, metric_type: str, 
                                 value: float, timestamp: datetime):
        """Update metric cache in Redis"""
        cache_key = f"metric:{user_id}:{metric_type}"
        metric_data = {
            'value': value,
            'timestamp': timestamp.isoformat(),
            'last_updated': datetime.utcnow().isoformat()
        }
        await self.redis.setex(cache_key, 3600, json.dumps(metric_data))
    
    async def _check_metric_alerts(self, user_id: str, metric_type: str, value: float):
        """Check if metric triggers any alerts"""
        try:
            # Get user's alert rules
            async with self.db_pool.getconn() as conn:
                async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    await cur.execute("""
                        SELECT * FROM alert_rules 
                        WHERE user_id = %s AND metric_type = %s AND is_active = true
                    """, (user_id, metric_type))
                    
                    alert_rules = await cur.fetchall()
                    
                    for rule in alert_rules:
                        if await self._evaluate_alert_condition(rule, value, user_id):
                            await self._trigger_alert(rule, value)
                            
        except Exception as e:
            logger.error(f"Alert checking failed: {e}")
    
    async def _evaluate_alert_condition(self, rule: Dict[str, Any], 
                                      current_value: float, user_id: str) -> bool:
        """Evaluate if alert condition is met"""
        try:
            condition = rule['condition']
            threshold = rule['threshold_value']
            
            if condition == AlertCondition.GREATER_THAN:
                return current_value > threshold
                
            elif condition == AlertCondition.LESS_THAN:
                return current_value < threshold
                
            elif condition == AlertCondition.EQUALS:
                return abs(current_value - threshold) < 0.01
                
            elif condition == AlertCondition.PERCENTAGE_CHANGE:
                # Get previous value
                cache_key = f"metric:{user_id}:{rule['metric_type']}"
                cached_data = await self.redis.get(cache_key)
                if cached_data:
                    prev_data = json.loads(cached_data)
                    prev_value = prev_data['value']
                    if prev_value > 0:
                        pct_change = ((current_value - prev_value) / prev_value) * 100
                        return abs(pct_change) > threshold
                        
            return False
            
        except Exception as e:
            logger.error(f"Alert evaluation failed: {e}")
            return False
    
    async def _trigger_alert(self, rule: Dict[str, Any], current_value: float):
        """Trigger an alert"""
        try:
            alert_data = {
                "type": "metric_alert",
                "rule_id": rule['rule_id'],
                "user_id": rule['user_id'],
                "metric_type": rule['metric_type'],
                "current_value": current_value,
                "threshold": rule['threshold_value'],
                "condition": rule['condition'],
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Send to notification service
            await self.redis.lpush("alert_queue", json.dumps(alert_data))
            logger.info(f"Alert triggered for user {rule['user_id']}")
            
        except Exception as e:
            logger.error(f"Alert triggering failed: {e}")

class AnalyticsService:
    """Main analytics service orchestrator"""
    
    def __init__(self):
        self.redis_client = None
        self.db_pool = None
        self.ml_engine = None
        self.chart_generator = None
        self.realtime_processor = None
        
    async def initialize(self):
        """Initialize analytics service"""
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
                maxconn=20,
                host="localhost",
                database="ailydian_analytics",
                user="postgres",
                password="password"
            )
            
            # Initialize engines
            self.ml_engine = MLAnalyticsEngine(self.redis_client, self.db_pool)
            self.chart_generator = ChartGenerator()
            self.realtime_processor = RealTimeProcessor(self.redis_client, self.db_pool)
            
            # Initialize ML models
            await self.ml_engine.initialize_models()
            
            # Start real-time processing
            await self.realtime_processor.start_processing()
            
            await self._create_database_schema()
            logger.info("Analytics service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize analytics service: {e}")
            raise
    
    async def _create_database_schema(self):
        """Create database schema"""
        schema_sql = """
        -- User Metrics (Time Series Data)
        CREATE TABLE IF NOT EXISTS user_metrics (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            metric_type VARCHAR(100) NOT NULL,
            value DECIMAL(20, 8) NOT NULL,
            timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            metadata JSONB DEFAULT '{}'
        );

        -- User Performance Metrics
        CREATE TABLE IF NOT EXISTS user_performance_metrics (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            period_start TIMESTAMPTZ NOT NULL,
            period_end TIMESTAMPTZ NOT NULL,
            total_return DECIMAL(10, 4) NOT NULL,
            volatility DECIMAL(10, 4) NOT NULL,
            sharpe_ratio DECIMAL(10, 4) NOT NULL,
            max_drawdown DECIMAL(10, 4) NOT NULL,
            win_rate DECIMAL(5, 2) NOT NULL,
            profit_factor DECIMAL(10, 4) NOT NULL,
            total_trades INTEGER NOT NULL,
            daily_returns DECIMAL(10, 4)[] DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Dashboards
        CREATE TABLE IF NOT EXISTS dashboards (
            dashboard_id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            widgets JSONB NOT NULL,
            is_public BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Alert Rules
        CREATE TABLE IF NOT EXISTS alert_rules (
            rule_id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            metric_type VARCHAR(100) NOT NULL,
            condition VARCHAR(50) NOT NULL,
            threshold_value DECIMAL(20, 8) NOT NULL,
            comparison_period INTEGER,
            is_active BOOLEAN DEFAULT true,
            notification_channels TEXT[] DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Alert History
        CREATE TABLE IF NOT EXISTS alert_history (
            id SERIAL PRIMARY KEY,
            rule_id VARCHAR(255) NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            metric_type VARCHAR(100) NOT NULL,
            triggered_value DECIMAL(20, 8) NOT NULL,
            threshold_value DECIMAL(20, 8) NOT NULL,
            condition_met VARCHAR(100) NOT NULL,
            triggered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (rule_id) REFERENCES alert_rules(rule_id)
        );

        -- ML Model Results
        CREATE TABLE IF NOT EXISTS ml_predictions (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            model_type VARCHAR(100) NOT NULL,
            prediction_data JSONB NOT NULL,
            features_used JSONB NOT NULL,
            confidence_score DECIMAL(5, 4),
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_user_metrics_user_id_type ON user_metrics(user_id, metric_type);
        CREATE INDEX IF NOT EXISTS idx_user_metrics_timestamp ON user_metrics(timestamp);
        CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON user_performance_metrics(user_id);
        CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id);
        CREATE INDEX IF NOT EXISTS idx_alert_rules_user_id ON alert_rules(user_id, is_active);
        CREATE INDEX IF NOT EXISTS idx_alert_history_user_id ON alert_history(user_id);

        -- Enable TimescaleDB extension for time series optimization
        CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
        SELECT create_hypertable('user_metrics', 'timestamp', if_not_exists => TRUE);
        """
        
        async with self.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute(schema_sql)
                await conn.commit()

# Initialize FastAPI app
app = FastAPI(
    title="AILYDIAN Analytics Service",
    description="Real-time data processing and ML-powered insights",
    version="1.0.0"
)

# Global service instance
analytics_service = AnalyticsService()

@app.on_event("startup")
async def startup_event():
    await analytics_service.initialize()

# API Endpoints
@app.post("/api/v1/metrics/ingest")
async def ingest_metric(
    user_id: str,
    metric_type: MetricType,
    value: float,
    metadata: Dict[str, Any] = {},
    timestamp: Optional[datetime] = None
) -> Dict[str, Any]:
    """Ingest real-time metric data"""
    try:
        if timestamp is None:
            timestamp = datetime.utcnow()
            
        # Add to processing queue
        metric_data = {
            "user_id": user_id,
            "metric_type": metric_type,
            "value": value,
            "timestamp": timestamp.isoformat(),
            "metadata": metadata
        }
        
        await analytics_service.redis_client.lpush("pending_metrics", json.dumps(metric_data))
        
        return {
            "status": "success",
            "message": "Metric ingested successfully",
            "timestamp": timestamp
        }
        
    except Exception as e:
        logger.error(f"Metric ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to ingest metric: {e}")

@app.post("/api/v1/query/metrics")
async def query_metrics(query: MetricQuery) -> Dict[str, Any]:
    """Query historical metrics"""
    try:
        async with analytics_service.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Build query based on parameters
                base_query = """
                    SELECT timestamp, value, metadata
                    FROM user_metrics
                    WHERE user_id = %s AND metric_type = %s
                    AND timestamp BETWEEN %s AND %s
                """
                
                params = [query.user_id, query.metric_type, query.start_time, query.end_time]
                
                # Add filters if specified
                filter_conditions = []
                for key, value in query.filters.items():
                    filter_conditions.append(f"metadata->>'{key}' = %s")
                    params.append(str(value))
                
                if filter_conditions:
                    base_query += " AND " + " AND ".join(filter_conditions)
                
                base_query += " ORDER BY timestamp"
                
                await cur.execute(base_query, params)
                results = await cur.fetchall()
                
                return {
                    "status": "success",
                    "data": results,
                    "count": len(results),
                    "query_params": query.dict()
                }
                
    except Exception as e:
        logger.error(f"Metrics query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to query metrics: {e}")

@app.post("/api/v1/dashboards")
async def create_dashboard(dashboard: Dashboard) -> Dict[str, Any]:
    """Create custom dashboard"""
    try:
        dashboard.dashboard_id = str(uuid.uuid4())
        dashboard.created_at = datetime.utcnow()
        
        async with analytics_service.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO dashboards (
                        dashboard_id, user_id, name, description, widgets,
                        is_public, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    dashboard.dashboard_id,
                    dashboard.user_id,
                    dashboard.name,
                    dashboard.description,
                    json.dumps([widget.dict() for widget in dashboard.widgets]),
                    dashboard.is_public,
                    dashboard.created_at
                ))
                await conn.commit()
        
        return {
            "status": "success",
            "dashboard_id": dashboard.dashboard_id,
            "message": "Dashboard created successfully"
        }
        
    except Exception as e:
        logger.error(f"Dashboard creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create dashboard: {e}")

@app.get("/api/v1/dashboards/{user_id}")
async def get_user_dashboards(user_id: str) -> Dict[str, Any]:
    """Get user dashboards"""
    try:
        async with analytics_service.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                await cur.execute("""
                    SELECT * FROM dashboards 
                    WHERE user_id = %s OR is_public = true
                    ORDER BY created_at DESC
                """, (user_id,))
                
                dashboards = await cur.fetchall()
                
                return {
                    "status": "success",
                    "dashboards": dashboards,
                    "count": len(dashboards)
                }
                
    except Exception as e:
        logger.error(f"Failed to get dashboards: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboards: {e}")

@app.post("/api/v1/charts/generate")
async def generate_chart(
    user_id: str,
    metric_type: MetricType,
    chart_type: ChartType,
    timeframe: AnalyticsTimeframe,
    start_time: datetime,
    end_time: datetime
) -> Dict[str, Any]:
    """Generate chart for metrics"""
    try:
        # Query data
        async with analytics_service.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                await cur.execute("""
                    SELECT timestamp, value, metadata
                    FROM user_metrics
                    WHERE user_id = %s AND metric_type = %s
                    AND timestamp BETWEEN %s AND %s
                    ORDER BY timestamp
                """, (user_id, metric_type, start_time, end_time))
                
                data = await cur.fetchall()
        
        # Generate chart
        chart_data = analytics_service.chart_generator.generate_portfolio_chart(data, chart_type)
        
        return {
            "status": "success",
            "chart_data": chart_data,
            "data_points": len(data)
        }
        
    except Exception as e:
        logger.error(f"Chart generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate chart: {e}")

@app.post("/api/v1/performance/calculate")
async def calculate_performance_metrics(
    user_id: str,
    start_date: datetime,
    end_date: datetime
) -> Dict[str, Any]:
    """Calculate comprehensive performance metrics"""
    try:
        async with analytics_service.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get portfolio values
                await cur.execute("""
                    SELECT DATE(timestamp) as date, 
                           LAST(value, timestamp) as portfolio_value
                    FROM user_metrics
                    WHERE user_id = %s AND metric_type = 'portfolio_value'
                    AND timestamp BETWEEN %s AND %s
                    GROUP BY DATE(timestamp)
                    ORDER BY date
                """, (user_id, start_date, end_date))
                
                portfolio_data = await cur.fetchall()
                
                if len(portfolio_data) < 2:
                    raise HTTPException(status_code=400, detail="Insufficient data for performance calculation")
                
                # Calculate daily returns
                values = [float(row['portfolio_value']) for row in portfolio_data]
                daily_returns = []
                for i in range(1, len(values)):
                    daily_return = (values[i] - values[i-1]) / values[i-1] * 100
                    daily_returns.append(daily_return)
                
                # Calculate metrics
                total_return = (values[-1] - values[0]) / values[0] * 100
                volatility = np.std(daily_returns) * np.sqrt(252)  # Annualized
                
                # Sharpe ratio (assuming 2% risk-free rate)
                excess_returns = [ret - (2/252) for ret in daily_returns]  # Daily risk-free rate
                sharpe_ratio = np.mean(excess_returns) / np.std(daily_returns) * np.sqrt(252)
                
                # Max drawdown
                peak = values[0]
                max_drawdown = 0
                for value in values:
                    if value > peak:
                        peak = value
                    drawdown = (peak - value) / peak * 100
                    max_drawdown = max(max_drawdown, drawdown)
                
                # Win rate
                positive_returns = [ret for ret in daily_returns if ret > 0]
                win_rate = len(positive_returns) / len(daily_returns) * 100
                
                # Profit factor
                gains = sum([ret for ret in daily_returns if ret > 0])
                losses = abs(sum([ret for ret in daily_returns if ret < 0]))
                profit_factor = gains / losses if losses > 0 else float('inf')
                
                performance_metrics = {
                    "user_id": user_id,
                    "period_start": start_date,
                    "period_end": end_date,
                    "total_return": round(total_return, 2),
                    "daily_returns": [round(ret, 4) for ret in daily_returns],
                    "volatility": round(volatility, 2),
                    "sharpe_ratio": round(sharpe_ratio, 2),
                    "max_drawdown": round(max_drawdown, 2),
                    "win_rate": round(win_rate, 2),
                    "profit_factor": round(profit_factor, 2),
                    "total_trades": len(daily_returns)
                }
                
                # Store in database
                await cur.execute("""
                    INSERT INTO user_performance_metrics (
                        user_id, period_start, period_end, total_return,
                        volatility, sharpe_ratio, max_drawdown, win_rate,
                        profit_factor, total_trades, daily_returns
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id, start_date, end_date, total_return,
                    volatility, sharpe_ratio, max_drawdown, win_rate,
                    profit_factor, len(daily_returns), daily_returns
                ))
                await conn.commit()
                
                return {
                    "status": "success",
                    "performance_metrics": performance_metrics
                }
                
    except Exception as e:
        logger.error(f"Performance calculation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate performance: {e}")

@app.post("/api/v1/ml/predict")
async def ml_predict(
    user_id: str,
    prediction_type: str,
    features: Dict[str, float]
) -> Dict[str, Any]:
    """Get ML predictions"""
    try:
        if prediction_type == "portfolio_performance":
            prediction = await analytics_service.ml_engine.predict_portfolio_performance(user_id, features)
        else:
            raise HTTPException(status_code=400, detail="Invalid prediction type")
        
        # Store prediction
        async with analytics_service.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO ml_predictions (
                        user_id, model_type, prediction_data, features_used,
                        confidence_score
                    ) VALUES (%s, %s, %s, %s, %s)
                """, (
                    user_id,
                    prediction_type,
                    json.dumps(prediction),
                    json.dumps(features),
                    prediction.get('confidence', 0)
                ))
                await conn.commit()
        
        return {
            "status": "success",
            "prediction": prediction,
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"ML prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get prediction: {e}")

@app.post("/api/v1/alerts/rules")
async def create_alert_rule(alert_rule: AlertRule) -> Dict[str, Any]:
    """Create alert rule"""
    try:
        alert_rule.rule_id = str(uuid.uuid4())
        
        async with analytics_service.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                    INSERT INTO alert_rules (
                        rule_id, user_id, name, metric_type, condition,
                        threshold_value, comparison_period, is_active,
                        notification_channels
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    alert_rule.rule_id,
                    alert_rule.user_id,
                    alert_rule.name,
                    alert_rule.metric_type,
                    alert_rule.condition,
                    alert_rule.threshold_value,
                    alert_rule.comparison_period,
                    alert_rule.is_active,
                    alert_rule.notification_channels
                ))
                await conn.commit()
        
        return {
            "status": "success",
            "rule_id": alert_rule.rule_id,
            "message": "Alert rule created successfully"
        }
        
    except Exception as e:
        logger.error(f"Alert rule creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create alert rule: {e}")

@app.get("/api/v1/analytics/summary/{user_id}")
async def get_analytics_summary(user_id: str) -> Dict[str, Any]:
    """Get comprehensive analytics summary"""
    try:
        async with analytics_service.db_pool.getconn() as conn:
            async with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Current portfolio value
                await cur.execute("""
                    SELECT value FROM user_metrics 
                    WHERE user_id = %s AND metric_type = 'portfolio_value'
                    ORDER BY timestamp DESC LIMIT 1
                """, (user_id,))
                current_portfolio = await cur.fetchone()
                
                # Daily PnL
                await cur.execute("""
                    SELECT value FROM user_metrics 
                    WHERE user_id = %s AND metric_type = 'daily_pnl'
                    ORDER BY timestamp DESC LIMIT 1
                """, (user_id,))
                daily_pnl = await cur.fetchone()
                
                # Risk score
                await cur.execute("""
                    SELECT value FROM user_metrics 
                    WHERE user_id = %s AND metric_type = 'risk_score'
                    ORDER BY timestamp DESC LIMIT 1
                """, (user_id,))
                risk_score = await cur.fetchone()
                
                # Active alerts count
                await cur.execute("""
                    SELECT COUNT(*) as active_alerts FROM alert_rules 
                    WHERE user_id = %s AND is_active = true
                """, (user_id,))
                active_alerts = await cur.fetchone()
                
                # Recent performance
                await cur.execute("""
                    SELECT * FROM user_performance_metrics 
                    WHERE user_id = %s 
                    ORDER BY created_at DESC LIMIT 1
                """, (user_id,))
                recent_performance = await cur.fetchone()
                
                summary = {
                    "user_id": user_id,
                    "current_portfolio_value": current_portfolio['value'] if current_portfolio else 0,
                    "daily_pnl": daily_pnl['value'] if daily_pnl else 0,
                    "risk_score": risk_score['value'] if risk_score else 50,
                    "active_alerts": active_alerts['active_alerts'] if active_alerts else 0,
                    "recent_performance": recent_performance,
                    "last_updated": datetime.utcnow()
                }
                
                return {
                    "status": "success",
                    "summary": summary
                }
                
    except Exception as e:
        logger.error(f"Analytics summary failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get analytics summary: {e}")

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis
        await analytics_service.redis_client.ping()
        
        # Check database
        async with analytics_service.db_pool.getconn() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1")
        
        # Check processing status
        processing_status = analytics_service.realtime_processor.processing_active
        
        return {
            "status": "healthy",
            "services": {
                "redis": "connected",
                "database": "connected",
                "real_time_processor": "active" if processing_status else "inactive",
                "ml_engine": "operational"
            },
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow()
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8017)
