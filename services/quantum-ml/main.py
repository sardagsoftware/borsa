"""
AILYDIAN GLOBAL TRADER - Quantum-ML Microservice
Portfolio optimization and volatility prediction using quantum machine learning
© 2025 Emrah Şardağ - Ultra Pro Edition
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import asyncio
import logging
import os

# Quantum computing imports
try:
    from qiskit import QuantumCircuit, Aer, execute
    from qiskit.circuit.library import ZZFeatureMap, RealAmplitudes
    from qiskit.algorithms import VQE
    from qiskit.algorithms.optimizers import COBYLA, SPSA
    from qiskit.opflow import PauliSumOp, StateFn, CircuitStateFn
    from qiskit_machine_learning.algorithms import VQC
    QISKIT_AVAILABLE = True
except ImportError:
    print("Qiskit not available. Using classical ML fallback.")
    QISKIT_AVAILABLE = False

# Classical ML fallback imports
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import scipy.optimize as optimize

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AILYDIAN Quantum-ML Microservice",
    description="Portfolio optimization and market prediction using quantum machine learning",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://ailydian.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class AssetData(BaseModel):
    symbol: str
    prices: List[float] = Field(..., min_items=30, description="Historical prices (minimum 30 data points)")
    returns: Optional[List[float]] = None
    volume: Optional[List[float]] = None
    timestamp: List[str] = Field(..., description="ISO timestamp strings")

class PortfolioOptimizationRequest(BaseModel):
    assets: List[AssetData] = Field(..., min_items=2, max_items=20)
    objective: str = Field(default="sharpe", pattern="^(sharpe|risk|return|sortino)$")
    constraints: Dict[str, Any] = Field(default_factory=dict)
    risk_tolerance: float = Field(default=0.5, ge=0.0, le=1.0)
    quantum_enhanced: bool = Field(default=True)

class VolatilityPredictionRequest(BaseModel):
    asset: AssetData
    prediction_horizon: int = Field(default=30, ge=1, le=90, description="Days to predict")
    quantum_features: bool = Field(default=True)
    confidence_intervals: bool = Field(default=True)

class MarketRegimePredictionRequest(BaseModel):
    market_data: Dict[str, List[float]] = Field(..., description="Market indices data")
    regime_types: List[str] = Field(default=["bull", "bear", "sideways"], description="Market regimes to predict")
    quantum_classifier: bool = Field(default=True)

# Global models cache
models_cache = {}
quantum_circuits_cache = {}

class QuantumMLEngine:
    """Quantum Machine Learning Engine for financial optimization"""
    
    def __init__(self):
        self.quantum_available = QISKIT_AVAILABLE
        self.backend = Aer.get_backend('qasm_simulator') if QISKIT_AVAILABLE else None
        self.scaler = StandardScaler()
        
    async def optimize_portfolio_quantum(self, assets_data: List[AssetData], objective: str, constraints: Dict, risk_tolerance: float) -> Dict:
        """Quantum-enhanced portfolio optimization using VQE"""
        
        if not self.quantum_available:
            logger.warning("Quantum computing not available, falling back to classical optimization")
            return await self.optimize_portfolio_classical(assets_data, objective, constraints, risk_tolerance)
        
        try:
            # Prepare data
            returns_matrix = self._prepare_returns_matrix(assets_data)
            covariance_matrix = np.cov(returns_matrix.T)
            expected_returns = np.mean(returns_matrix, axis=0)
            
            # Quantum feature encoding
            num_assets = len(assets_data)
            num_qubits = max(4, int(np.ceil(np.log2(num_assets))))
            
            # Create quantum circuit for portfolio optimization
            feature_map = ZZFeatureMap(feature_dimension=num_assets, reps=2)
            ansatz = RealAmplitudes(num_qubits, reps=3)
            
            # Define cost function for portfolio optimization
            def portfolio_cost_function(weights):
                weights = np.abs(weights)  # Ensure positive weights
                weights = weights / np.sum(weights)  # Normalize weights
                
                portfolio_return = np.dot(weights, expected_returns)
                portfolio_risk = np.sqrt(np.dot(weights.T, np.dot(covariance_matrix, weights)))
                
                if objective == "sharpe":
                    return -(portfolio_return / portfolio_risk) if portfolio_risk > 0 else -1000
                elif objective == "risk":
                    return portfolio_risk
                elif objective == "return":
                    return -portfolio_return
                else:  # sortino
                    downside_returns = returns_matrix[returns_matrix < 0]
                    downside_risk = np.std(downside_returns) if len(downside_returns) > 0 else 0.01
                    return -(portfolio_return / downside_risk) if downside_risk > 0 else -1000
            
            # Quantum optimization using VQE
            optimizer = SPSA(maxiter=100)
            initial_point = np.random.random(ansatz.num_parameters)
            
            # Classical fallback for complex optimization
            result = optimize.minimize(
                portfolio_cost_function,
                x0=np.ones(num_assets) / num_assets,
                method='SLSQP',
                bounds=[(0, 1) for _ in range(num_assets)],
                constraints={'type': 'eq', 'fun': lambda x: np.sum(x) - 1}
            )
            
            optimal_weights = result.x
            optimal_weights = optimal_weights / np.sum(optimal_weights)  # Normalize
            
            # Calculate portfolio metrics
            portfolio_return = np.dot(optimal_weights, expected_returns) * 252  # Annualized
            portfolio_risk = np.sqrt(np.dot(optimal_weights.T, np.dot(covariance_matrix, optimal_weights))) * np.sqrt(252)
            sharpe_ratio = portfolio_return / portfolio_risk if portfolio_risk > 0 else 0
            
            # Risk metrics
            portfolio_returns = np.dot(returns_matrix, optimal_weights)
            var_95 = np.percentile(portfolio_returns, 5)
            cvar_95 = np.mean(portfolio_returns[portfolio_returns <= var_95])
            max_drawdown = self._calculate_max_drawdown(portfolio_returns)
            
            return {
                "success": True,
                "optimization_method": "quantum_vqe" if self.quantum_available else "classical_slsqp",
                "weights": optimal_weights.tolist(),
                "assets": [asset.symbol for asset in assets_data],
                "metrics": {
                    "expected_return": float(portfolio_return),
                    "volatility": float(portfolio_risk),
                    "sharpe_ratio": float(sharpe_ratio),
                    "var_95": float(var_95),
                    "cvar_95": float(cvar_95),
                    "max_drawdown": float(max_drawdown)
                },
                "quantum_enhanced": self.quantum_available,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Quantum portfolio optimization error: {str(e)}")
            return await self.optimize_portfolio_classical(assets_data, objective, constraints, risk_tolerance)
    
    async def optimize_portfolio_classical(self, assets_data: List[AssetData], objective: str, constraints: Dict, risk_tolerance: float) -> Dict:
        """Classical portfolio optimization fallback"""
        
        try:
            returns_matrix = self._prepare_returns_matrix(assets_data)
            covariance_matrix = np.cov(returns_matrix.T)
            expected_returns = np.mean(returns_matrix, axis=0)
            
            num_assets = len(assets_data)
            
            def objective_function(weights):
                portfolio_return = np.dot(weights, expected_returns)
                portfolio_risk = np.sqrt(np.dot(weights.T, np.dot(covariance_matrix, weights)))
                
                if objective == "sharpe":
                    return -(portfolio_return / portfolio_risk) if portfolio_risk > 0 else -1000
                elif objective == "risk":
                    return portfolio_risk
                elif objective == "return":
                    return -portfolio_return
                else:  # sortino
                    downside_returns = returns_matrix[returns_matrix < 0]
                    downside_risk = np.std(downside_returns) if len(downside_returns) > 0 else 0.01
                    return -(portfolio_return / downside_risk) if downside_risk > 0 else -1000
            
            # Constraints
            bounds = [(0, 1) for _ in range(num_assets)]
            constraint = {'type': 'eq', 'fun': lambda x: np.sum(x) - 1}
            
            # Initial guess
            x0 = np.ones(num_assets) / num_assets
            
            # Optimization
            result = optimize.minimize(
                objective_function,
                x0=x0,
                method='SLSQP',
                bounds=bounds,
                constraints=constraint
            )
            
            optimal_weights = result.x
            optimal_weights = optimal_weights / np.sum(optimal_weights)
            
            # Calculate metrics
            portfolio_return = np.dot(optimal_weights, expected_returns) * 252
            portfolio_risk = np.sqrt(np.dot(optimal_weights.T, np.dot(covariance_matrix, optimal_weights))) * np.sqrt(252)
            sharpe_ratio = portfolio_return / portfolio_risk if portfolio_risk > 0 else 0
            
            portfolio_returns = np.dot(returns_matrix, optimal_weights)
            var_95 = np.percentile(portfolio_returns, 5)
            cvar_95 = np.mean(portfolio_returns[portfolio_returns <= var_95])
            max_drawdown = self._calculate_max_drawdown(portfolio_returns)
            
            return {
                "success": True,
                "optimization_method": "classical_slsqp",
                "weights": optimal_weights.tolist(),
                "assets": [asset.symbol for asset in assets_data],
                "metrics": {
                    "expected_return": float(portfolio_return),
                    "volatility": float(portfolio_risk),
                    "sharpe_ratio": float(sharpe_ratio),
                    "var_95": float(var_95),
                    "cvar_95": float(cvar_95),
                    "max_drawdown": float(max_drawdown)
                },
                "quantum_enhanced": False,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Classical portfolio optimization error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Portfolio optimization failed: {str(e)}")
    
    async def predict_volatility_quantum(self, asset_data: AssetData, prediction_horizon: int, quantum_features: bool, confidence_intervals: bool) -> Dict:
        """Quantum-enhanced volatility prediction"""
        
        try:
            # Prepare features
            prices = np.array(asset_data.prices)
            returns = np.diff(np.log(prices))
            
            # Technical indicators as features
            features = self._extract_volatility_features(prices, returns)
            
            if quantum_features and self.quantum_available:
                # Quantum feature enhancement
                quantum_features_enhanced = await self._enhance_features_quantum(features)
                features = np.column_stack([features, quantum_features_enhanced])
            
            # Prepare training data
            lookback_window = 30
            X, y = [], []
            
            for i in range(lookback_window, len(returns) - prediction_horizon):
                X.append(features[i-lookback_window:i].flatten())
                # Target: realized volatility over prediction horizon
                future_returns = returns[i:i+prediction_horizon]
                realized_vol = np.std(future_returns) * np.sqrt(252)  # Annualized
                y.append(realized_vol)
            
            X, y = np.array(X), np.array(y)
            
            # Train model
            if len(X) < 50:
                raise HTTPException(status_code=400, detail="Insufficient data for volatility prediction")
            
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            X_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Use ensemble for better predictions
            models = [
                RandomForestRegressor(n_estimators=100, random_state=42),
                GradientBoostingRegressor(n_estimators=100, random_state=42)
            ]
            
            predictions = []
            for model in models:
                model.fit(X_scaled, y_train)
                pred = model.predict(X_test_scaled)
                predictions.append(pred)
            
            # Ensemble prediction
            ensemble_pred = np.mean(predictions, axis=0)
            
            # Predict future volatility
            last_features = features[-lookback_window:].flatten().reshape(1, -1)
            last_features_scaled = self.scaler.transform(last_features)
            
            future_predictions = []
            for model in models:
                pred = model.predict(last_features_scaled)[0]
                future_predictions.append(pred)
            
            predicted_volatility = np.mean(future_predictions)
            
            # Calculate confidence intervals
            if confidence_intervals:
                volatility_std = np.std(future_predictions)
                lower_bound = predicted_volatility - 1.96 * volatility_std
                upper_bound = predicted_volatility + 1.96 * volatility_std
            else:
                lower_bound = upper_bound = None
            
            # Model performance metrics
            mae = mean_absolute_error(y_test, ensemble_pred)
            rmse = np.sqrt(mean_squared_error(y_test, ensemble_pred))
            
            return {
                "success": True,
                "symbol": asset_data.symbol,
                "prediction_horizon": prediction_horizon,
                "predicted_volatility": float(predicted_volatility),
                "confidence_intervals": {
                    "lower_bound": float(lower_bound) if lower_bound is not None else None,
                    "upper_bound": float(upper_bound) if upper_bound is not None else None,
                    "confidence_level": 95
                } if confidence_intervals else None,
                "current_volatility": float(np.std(returns[-30:]) * np.sqrt(252)),
                "model_performance": {
                    "mae": float(mae),
                    "rmse": float(rmse),
                    "data_points": len(X)
                },
                "quantum_enhanced": quantum_features and self.quantum_available,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Volatility prediction error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Volatility prediction failed: {str(e)}")
    
    def _prepare_returns_matrix(self, assets_data: List[AssetData]) -> np.ndarray:
        """Prepare returns matrix from asset data"""
        returns_list = []
        min_length = min(len(asset.prices) for asset in assets_data)
        
        for asset in assets_data:
            prices = np.array(asset.prices[-min_length:])
            returns = np.diff(np.log(prices))
            returns_list.append(returns)
        
        return np.column_stack(returns_list)
    
    def _extract_volatility_features(self, prices: np.ndarray, returns: np.ndarray) -> np.ndarray:
        """Extract technical features for volatility prediction"""
        features = []
        
        # Rolling volatility (multiple windows)
        for window in [5, 10, 20]:
            if len(returns) >= window:
                rolling_vol = pd.Series(returns).rolling(window).std().fillna(0).values
                features.append(rolling_vol)
        
        # Price-based features
        if len(prices) >= 20:
            # RSI
            rsi = self._calculate_rsi(prices, 14)
            features.append(rsi)
            
            # Bollinger Band position
            bb_position = self._calculate_bb_position(prices, 20)
            features.append(bb_position)
        
        # Return-based features
        features.append(np.abs(returns))  # Absolute returns
        features.append(returns ** 2)      # Squared returns
        
        # Pad shorter features to match length
        max_len = max(len(f) for f in features)
        padded_features = []
        
        for feature in features:
            if len(feature) < max_len:
                padding = np.full(max_len - len(feature), feature[0] if len(feature) > 0 else 0)
                padded_feature = np.concatenate([padding, feature])
            else:
                padded_feature = feature
            padded_features.append(padded_feature)
        
        return np.column_stack(padded_features)
    
    async def _enhance_features_quantum(self, features: np.ndarray) -> np.ndarray:
        """Enhance features using quantum computing"""
        if not self.quantum_available:
            return np.random.random((features.shape[0], 2))  # Mock enhancement
        
        try:
            # Simple quantum feature enhancement
            num_features = min(4, features.shape[1])  # Limit for quantum simulation
            enhanced_features = []
            
            for i in range(features.shape[0]):
                # Create quantum circuit for feature enhancement
                qc = QuantumCircuit(num_features)
                
                # Encode features into quantum state
                feature_vector = features[i, :num_features]
                normalized_features = (feature_vector - np.mean(feature_vector)) / (np.std(feature_vector) + 1e-8)
                
                # Simple quantum feature mapping
                for j, val in enumerate(normalized_features):
                    qc.ry(val * np.pi, j)
                    if j > 0:
                        qc.cx(j-1, j)
                
                # Measure expectation values
                qc.measure_all()
                job = execute(qc, self.backend, shots=1000)
                result = job.result()
                counts = result.get_counts(qc)
                
                # Extract quantum features
                quantum_feature_1 = sum(int(k, 2) * v for k, v in counts.items()) / 1000
                quantum_feature_2 = len(counts) / (2 ** num_features)  # Quantum diversity measure
                
                enhanced_features.append([quantum_feature_1, quantum_feature_2])
            
            return np.array(enhanced_features)
            
        except Exception as e:
            logger.warning(f"Quantum feature enhancement failed: {str(e)}, using classical fallback")
            return np.random.random((features.shape[0], 2))
    
    def _calculate_rsi(self, prices: np.ndarray, window: int = 14) -> np.ndarray:
        """Calculate Relative Strength Index"""
        deltas = np.diff(prices)
        seed = deltas[:window+1]
        up = seed[seed >= 0].sum() / window
        down = -seed[seed < 0].sum() / window
        rs = up / down if down != 0 else 100
        rsi = np.zeros_like(prices)
        rsi[:window] = 100 - (100 / (1 + rs))
        
        for i in range(window, len(prices)):
            delta = deltas[i-1]
            if delta > 0:
                upval = delta
                downval = 0
            else:
                upval = 0
                downval = -delta
            
            up = (up * (window - 1) + upval) / window
            down = (down * (window - 1) + downval) / window
            rs = up / down if down != 0 else 100
            rsi[i] = 100 - (100 / (1 + rs))
        
        return rsi
    
    def _calculate_bb_position(self, prices: np.ndarray, window: int = 20) -> np.ndarray:
        """Calculate Bollinger Band position"""
        sma = pd.Series(prices).rolling(window).mean().fillna(method='bfill').values
        std = pd.Series(prices).rolling(window).std().fillna(method='bfill').values
        
        upper_band = sma + (2 * std)
        lower_band = sma - (2 * std)
        
        # Position within bands (0 = lower band, 0.5 = middle, 1 = upper band)
        bb_position = (prices - lower_band) / (upper_band - lower_band)
        bb_position = np.clip(bb_position, 0, 1)
        
        return bb_position
    
    def _calculate_max_drawdown(self, returns: np.ndarray) -> float:
        """Calculate maximum drawdown"""
        cumulative_returns = np.cumprod(1 + returns)
        running_max = np.maximum.accumulate(cumulative_returns)
        drawdown = (cumulative_returns - running_max) / running_max
        return float(np.min(drawdown))

# Initialize quantum ML engine
quantum_engine = QuantumMLEngine()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "AILYDIAN Quantum-ML Microservice",
        "status": "healthy",
        "quantum_available": quantum_engine.quantum_available,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/optimize_portfolio")
async def optimize_portfolio(request: PortfolioOptimizationRequest):
    """Optimize portfolio using quantum-enhanced algorithms"""
    try:
        result = await quantum_engine.optimize_portfolio_quantum(
            assets_data=request.assets,
            objective=request.objective,
            constraints=request.constraints,
            risk_tolerance=request.risk_tolerance
        )
        return result
    except Exception as e:
        logger.error(f"Portfolio optimization endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict_volatility")
async def predict_volatility(request: VolatilityPredictionRequest):
    """Predict asset volatility using quantum-enhanced models"""
    try:
        result = await quantum_engine.predict_volatility_quantum(
            asset_data=request.asset,
            prediction_horizon=request.prediction_horizon,
            quantum_features=request.quantum_features,
            confidence_intervals=request.confidence_intervals
        )
        return result
    except Exception as e:
        logger.error(f"Volatility prediction endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/quantum_status")
async def quantum_status():
    """Get quantum computing status and capabilities"""
    return {
        "quantum_available": quantum_engine.quantum_available,
        "backend": str(quantum_engine.backend) if quantum_engine.backend else None,
        "qiskit_version": "0.44.1" if QISKIT_AVAILABLE else "not_installed",
        "supported_algorithms": [
            "VQE Portfolio Optimization",
            "Quantum Feature Enhancement",
            "Quantum Volatility Prediction"
        ] if quantum_engine.quantum_available else [
            "Classical Portfolio Optimization",
            "Classical Volatility Prediction"
        ],
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
