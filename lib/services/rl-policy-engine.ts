// Advanced Reinforcement Learning Policy Engine for Crypto Trading
import { EventEmitter } from 'events';

export interface TradingEnvironment {
  // Market state
  currentPrice: number;
  volume: number;
  volatility: number;
  spread: number;
  orderBookDepth: number;
  
  // Technical indicators
  sma20: number;
  ema12: number;
  ema26: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  bb_upper: number;
  bb_lower: number;
  
  // Market microstructure
  buyPressure: number;
  sellPressure: number;
  imbalanceRatio: number;
  tickDirection: number;
  
  // Time features
  hour: number;
  dayOfWeek: number;
  isWeekend: boolean;
  
  // Macro features
  btcDominance: number;
  fearGreedIndex: number;
  marketCap: number;
  
  // Portfolio state
  position: number;
  unrealizedPnL: number;
  availableBalance: number;
  maxDrawdown: number;
  
  // Risk metrics
  var95: number;
  sharpeRatio: number;
  sortino: number;
  calmar: number;
}

export interface TradingAction {
  type: 'BUY' | 'SELL' | 'HOLD';
  size: number; // Position size (0-1 normalized)
  leverage: number; // Leverage multiplier (1-10)
  stopLoss?: number; // Stop loss price
  takeProfit?: number; // Take profit price
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LIMIT';
  timeInForce: 'GTC' | 'IOC' | 'FOK';
  
  // Advanced parameters
  slippage_tolerance: number;
  max_position_hold_time: number; // Minutes
  confidence: number; // Action confidence (0-1)
}

export interface PolicyReward {
  immediate: number; // Immediate reward (PnL)
  risk_adjusted: number; // Risk-adjusted reward
  sharpe_component: number; // Sharpe ratio component
  drawdown_penalty: number; // Drawdown penalty
  transaction_cost: number; // Transaction cost penalty
  
  // Components for reward shaping
  profit_factor: number;
  win_rate_bonus: number;
  volatility_penalty: number;
  correlation_bonus: number;
  
  total: number; // Total reward
}

export interface ExperienceBuffer {
  state: TradingEnvironment;
  action: TradingAction;
  reward: PolicyReward;
  nextState: TradingEnvironment;
  done: boolean;
  timestamp: number;
  
  // Additional metadata
  market_regime: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'VOLATILE';
  volatility_cluster: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  liquidity_regime: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface NeuralNetworkArchitecture {
  input_dim: number;
  hidden_layers: number[];
  output_dim: number;
  activation: 'relu' | 'tanh' | 'sigmoid' | 'leaky_relu';
  dropout_rate: number;
  batch_norm: boolean;
  
  // Advanced architectures
  use_lstm: boolean;
  lstm_units?: number;
  use_attention: boolean;
  attention_heads?: number;
  use_residual: boolean;
}

export interface PolicyConfiguration {
  algorithm: 'PPO' | 'SAC' | 'TD3' | 'A3C' | 'DDPG' | 'DQN';
  
  // Hyperparameters
  learning_rate: number;
  discount_factor: number; // Gamma
  exploration_rate: number; // Epsilon
  exploration_decay: number;
  target_update_frequency: number;
  
  // PPO specific
  ppo_clip_ratio?: number;
  ppo_epochs?: number;
  value_loss_coeff?: number;
  entropy_coeff?: number;
  
  // SAC specific
  sac_alpha?: number; // Temperature parameter
  sac_tau?: number; // Soft update parameter
  target_entropy?: number;
  
  // Experience replay
  buffer_size: number;
  batch_size: number;
  min_experiences_before_training: number;
  
  // Network architecture
  actor_network: NeuralNetworkArchitecture;
  critic_network: NeuralNetworkArchitecture;
  
  // Training parameters
  episodes_per_training: number;
  steps_per_episode: number;
  validation_frequency: number;
  save_frequency: number;
  
  // Risk management
  max_position_size: number;
  max_leverage: number;
  max_drawdown_threshold: number;
  stop_training_on_drawdown: boolean;
  
  // Reward shaping
  reward_scaling: number;
  risk_penalty_weight: number;
  transaction_cost_weight: number;
  exploration_bonus_weight: number;
}

export interface PolicyPerformance {
  episode: number;
  steps: number;
  total_reward: number;
  average_reward: number;
  
  // Trading performance
  total_return: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  calmar_ratio: number;
  
  // Trade statistics
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  profit_factor: number;
  average_trade_return: number;
  
  // Learning metrics
  actor_loss: number;
  critic_loss: number;
  exploration_rate: number;
  entropy: number;
  
  // Risk metrics
  var_95: number;
  var_99: number;
  expected_shortfall: number;
  volatility: number;
  
  // Market regime performance
  bull_market_performance: number;
  bear_market_performance: number;
  sideways_performance: number;
  volatile_market_performance: number;
  
  timestamp: number;
}

export interface SafetyConstraints {
  // Position limits
  max_position_pct: number; // Maximum position as % of portfolio
  max_sector_exposure: number; // Maximum sector exposure
  max_daily_trades: number; // Maximum trades per day
  
  // Risk limits
  max_var_95: number; // Maximum 95% VaR
  max_expected_shortfall: number; // Maximum expected shortfall
  min_liquidity_ratio: number; // Minimum liquidity ratio
  max_correlation_exposure: number; // Maximum correlation exposure
  
  // Performance constraints
  min_sharpe_ratio: number; // Minimum Sharpe ratio
  max_consecutive_losses: number; // Stop after N losses
  max_drawdown_from_peak: number; // Maximum drawdown from peak
  
  // Learning safety
  conservative_mode_threshold: number; // Switch to conservative when breached
  exploration_reduction_factor: number; // Reduce exploration in conservative mode
  safety_buffer_multiplier: number; // Safety buffer for constraints
  
  // Emergency stops
  enable_circuit_breaker: boolean;
  circuit_breaker_threshold: number; // Stop trading if breached
  cool_down_period: number; // Minutes before resuming
}

export interface MarketRegimeClassifier {
  current_regime: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'VOLATILE';
  confidence: number;
  
  // Regime probabilities
  bull_probability: number;
  bear_probability: number;
  sideways_probability: number;
  volatile_probability: number;
  
  // Regime characteristics
  volatility_cluster: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  trend_strength: number;
  momentum: number;
  mean_reversion_tendency: number;
  
  // Transition probabilities
  regime_transition_matrix: number[][]; // 4x4 transition matrix
  expected_regime_duration: number; // Expected duration in current regime
}

export class RLPolicyEngine extends EventEmitter {
  private config: PolicyConfiguration;
  private experienceBuffer: ExperienceBuffer[] = [];
  private currentEnvironment: TradingEnvironment;
  private safetyConstraints: SafetyConstraints;
  private regimeClassifier: MarketRegimeClassifier;
  
  // Model components (simplified representations)
  private actorNetwork: any = null;
  private criticNetwork: any = null;
  private targetActorNetwork: any = null;
  private targetCriticNetwork: any = null;
  
  // Training state
  private isTraining: boolean = false;
  private episode: number = 0;
  private totalSteps: number = 0;
  private lastPerformanceEval: PolicyPerformance | null = null;
  
  // Safety mechanisms
  private conservativeMode: boolean = false;
  private circuitBreakerActive: boolean = false;
  private lastCircuitBreakerTime: number = 0;
  
  // Performance tracking
  private performanceHistory: PolicyPerformance[] = [];
  private rewardHistory: number[] = [];
  private actionHistory: TradingAction[] = [];
  
  constructor(config: PolicyConfiguration, safetyConstraints: SafetyConstraints) {
    super();
    
    this.config = config;
    this.safetyConstraints = safetyConstraints;
    this.currentEnvironment = this.initializeEnvironment();
    this.regimeClassifier = this.initializeRegimeClassifier();
    
    this.initializeNetworks();
    this.startSafetyMonitoring();
  }

  private initializeEnvironment(): TradingEnvironment {
    return {
      currentPrice: 50000,
      volume: 1000000,
      volatility: 0.02,
      spread: 0.001,
      orderBookDepth: 500000,
      
      sma20: 50000,
      ema12: 49800,
      ema26: 50200,
      rsi: 50,
      macd: 0,
      macdSignal: 0,
      bb_upper: 51000,
      bb_lower: 49000,
      
      buyPressure: 0.5,
      sellPressure: 0.5,
      imbalanceRatio: 1.0,
      tickDirection: 0,
      
      hour: 12,
      dayOfWeek: 2,
      isWeekend: false,
      
      btcDominance: 45,
      fearGreedIndex: 50,
      marketCap: 1000000000000,
      
      position: 0,
      unrealizedPnL: 0,
      availableBalance: 100000,
      maxDrawdown: 0,
      
      var95: 0,
      sharpeRatio: 0,
      sortino: 0,
      calmar: 0
    };
  }

  private initializeRegimeClassifier(): MarketRegimeClassifier {
    return {
      current_regime: 'SIDEWAYS',
      confidence: 0.7,
      bull_probability: 0.25,
      bear_probability: 0.25,
      sideways_probability: 0.35,
      volatile_probability: 0.15,
      volatility_cluster: 'MEDIUM',
      trend_strength: 0.3,
      momentum: 0.1,
      mean_reversion_tendency: 0.6,
      regime_transition_matrix: [
        [0.8, 0.1, 0.08, 0.02], // Bull -> [Bull, Bear, Sideways, Volatile]
        [0.1, 0.8, 0.08, 0.02], // Bear -> [Bull, Bear, Sideways, Volatile]
        [0.15, 0.15, 0.6, 0.1], // Sideways -> [Bull, Bear, Sideways, Volatile]
        [0.2, 0.2, 0.3, 0.3]    // Volatile -> [Bull, Bear, Sideways, Volatile]
      ],
      expected_regime_duration: 48 // hours
    };
  }

  private initializeNetworks() {
    // Initialize actor and critic networks (simplified)
    // In a real implementation, this would initialize TensorFlow.js or similar models
    this.actorNetwork = this.createNetwork(this.config.actor_network);
    this.criticNetwork = this.createNetwork(this.config.critic_network);
    
    // Initialize target networks
    this.targetActorNetwork = this.copyNetwork(this.actorNetwork);
    this.targetCriticNetwork = this.copyNetwork(this.criticNetwork);
    
    console.log('RL Policy Engine initialized with', this.config.algorithm, 'algorithm');
  }

  private createNetwork(architecture: NeuralNetworkArchitecture): any {
    // Placeholder for neural network creation
    // In production, this would create actual neural networks
    return {
      architecture,
      weights: new Array(architecture.input_dim).fill(0).map(() => Math.random() - 0.5),
      forward: (input: number[]) => this.simulateForwardPass(input, architecture),
      backward: (gradients: number[]) => this.simulateBackwardPass(gradients),
      updateWeights: (learningRate: number) => this.simulateWeightUpdate(learningRate)
    };
  }

  private copyNetwork(network: any): any {
    return {
      ...network,
      weights: [...network.weights]
    };
  }

  // Main policy decision method
  public async selectAction(environment: TradingEnvironment): Promise<TradingAction> {
    // Update current environment
    this.currentEnvironment = environment;
    
    // Update market regime classification
    this.updateMarketRegime(environment);
    
    // Check safety constraints
    if (this.circuitBreakerActive) {
      return this.getSafeAction();
    }
    
    // Check if we should enter conservative mode
    this.updateConservativeMode(environment);
    
    // Get action from policy network
    const action = await this.getActionFromPolicy(environment);
    
    // Apply safety filters
    const safeAction = this.applySafetyConstraints(action, environment);
    
    // Log action
    this.actionHistory.push(safeAction);
    
    // Emit action event
    this.emit('actionSelected', {
      action: safeAction,
      environment,
      regime: this.regimeClassifier.current_regime,
      conservativeMode: this.conservativeMode
    });
    
    return safeAction;
  }

  private async getActionFromPolicy(environment: TradingEnvironment): Promise<TradingAction> {
    // Convert environment to feature vector
    const stateVector = this.environmentToVector(environment);
    
    // Forward pass through actor network
    const actionVector = this.actorNetwork.forward(stateVector);
    
    // Add exploration noise if training
    if (this.isTraining && !this.conservativeMode) {
      this.addExplorationNoise(actionVector);
    }
    
    // Convert network output to trading action
    return this.vectorToAction(actionVector, environment);
  }

  private environmentToVector(env: TradingEnvironment): number[] {
    // Normalize and convert environment to feature vector
    return [
      // Price features (normalized)
      (env.currentPrice - 50000) / 50000,
      Math.log(env.volume / 1000000),
      env.volatility * 100, // Scale volatility
      env.spread * 10000, // Scale to bps
      
      // Technical indicators (normalized)
      (env.rsi - 50) / 50,
      env.macd / 1000,
      (env.sma20 - env.currentPrice) / env.currentPrice,
      (env.ema12 - env.ema26) / env.currentPrice,
      
      // Order book features
      env.buyPressure - 0.5, // Center around 0
      env.sellPressure - 0.5,
      env.imbalanceRatio - 1,
      env.tickDirection,
      
      // Time features
      Math.sin(2 * Math.PI * env.hour / 24), // Cyclical encoding
      Math.cos(2 * Math.PI * env.hour / 24),
      Math.sin(2 * Math.PI * env.dayOfWeek / 7),
      Math.cos(2 * Math.PI * env.dayOfWeek / 7),
      env.isWeekend ? 1 : 0,
      
      // Portfolio features
      env.position / this.config.max_position_size,
      env.unrealizedPnL / env.availableBalance,
      env.maxDrawdown,
      
      // Risk metrics
      env.sharpeRatio / 3, // Normalize assuming max Sharpe of 3
      env.var95 / env.availableBalance,
      
      // Market regime features
      this.regimeClassifier.bull_probability,
      this.regimeClassifier.bear_probability,
      this.regimeClassifier.sideways_probability,
      this.regimeClassifier.volatile_probability,
      this.regimeClassifier.trend_strength,
      this.regimeClassifier.momentum
    ];
  }

  private vectorToAction(vector: number[], env: TradingEnvironment): TradingAction {
    // Convert neural network output to trading action
    // Assume vector has [action_type, size, leverage, stop_loss, take_profit, confidence]
    
    const actionProbs = this.softmax(vector.slice(0, 3)); // BUY, SELL, HOLD probabilities
    const actionType = this.sampleFromProbabilities(['BUY', 'SELL', 'HOLD'], actionProbs);
    
    const size = Math.abs(Math.tanh(vector[3])) * this.config.max_position_size;
    const leverage = 1 + (Math.abs(Math.tanh(vector[4])) * (this.config.max_leverage - 1));
    const confidence = Math.abs(Math.tanh(vector[5]));
    
    // Calculate stop loss and take profit based on volatility
    const volatilityMultiplier = env.volatility * 100;
    const stopLossDistance = volatilityMultiplier * (1 + Math.abs(vector[6]));
    const takeProfitDistance = volatilityMultiplier * (2 + Math.abs(vector[7]));
    
    let stopLoss: number | undefined;
    let takeProfit: number | undefined;
    
    if (actionType === 'BUY') {
      stopLoss = env.currentPrice * (1 - stopLossDistance / 100);
      takeProfit = env.currentPrice * (1 + takeProfitDistance / 100);
    } else if (actionType === 'SELL') {
      stopLoss = env.currentPrice * (1 + stopLossDistance / 100);
      takeProfit = env.currentPrice * (1 - takeProfitDistance / 100);
    }
    
    return {
      type: actionType as 'BUY' | 'SELL' | 'HOLD',
      size,
      leverage,
      stopLoss,
      takeProfit,
      orderType: confidence > 0.8 ? 'MARKET' : 'LIMIT',
      timeInForce: 'GTC',
      slippage_tolerance: 0.001 * (1 + env.volatility),
      max_position_hold_time: Math.max(30, Math.min(1440, 180 / confidence)), // 30 min to 24 hours
      confidence
    };
  }

  // Experience storage and learning
  public storeExperience(
    state: TradingEnvironment,
    action: TradingAction,
    reward: PolicyReward,
    nextState: TradingEnvironment,
    done: boolean
  ) {
    const experience: ExperienceBuffer = {
      state,
      action,
      reward,
      nextState,
      done,
      timestamp: Date.now(),
      market_regime: this.regimeClassifier.current_regime,
      volatility_cluster: this.regimeClassifier.volatility_cluster,
      liquidity_regime: state.volume > 2000000 ? 'HIGH' : state.volume > 500000 ? 'MEDIUM' : 'LOW'
    };
    
    // Add to buffer
    this.experienceBuffer.push(experience);
    
    // Keep buffer size manageable
    if (this.experienceBuffer.length > this.config.buffer_size) {
      this.experienceBuffer.shift();
    }
    
    // Store reward for tracking
    this.rewardHistory.push(reward.total);
    this.totalSteps++;
    
    // Train if enough experiences
    if (this.experienceBuffer.length >= this.config.min_experiences_before_training && this.isTraining) {
      this.trainPolicy();
    }
    
    this.emit('experienceStored', experience);
  }

  private async trainPolicy() {
    if (!this.isTraining) return;
    
    try {
      // Sample batch from experience buffer
      const batch = this.sampleBatch();
      
      // Calculate returns and advantages
      const { returns, advantages } = this.calculateReturnsAndAdvantages(batch);
      
      // Train networks based on algorithm
      let actorLoss = 0;
      let criticLoss = 0;
      
      switch (this.config.algorithm) {
        case 'PPO':
          ({ actorLoss, criticLoss } = await this.trainPPO(batch, returns, advantages));
          break;
        case 'SAC':
          ({ actorLoss, criticLoss } = await this.trainSAC(batch));
          break;
        case 'TD3':
          ({ actorLoss, criticLoss } = await this.trainTD3(batch));
          break;
        default:
          throw new Error(`Algorithm ${this.config.algorithm} not implemented`);
      }
      
      // Update target networks if needed
      this.updateTargetNetworks();
      
      // Update exploration rate
      this.updateExplorationRate();
      
      this.emit('policyTrained', {
        episode: this.episode,
        steps: this.totalSteps,
        actorLoss,
        criticLoss,
        bufferSize: this.experienceBuffer.length
      });
      
    } catch (error) {
      console.error('Error training policy:', error);
      this.emit('trainingError', error);
    }
  }

  private sampleBatch(): ExperienceBuffer[] {
    const batchSize = Math.min(this.config.batch_size, this.experienceBuffer.length);
    const batch: ExperienceBuffer[] = [];
    
    // Prioritized experience replay (simplified)
    for (let i = 0; i < batchSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.experienceBuffer.length);
      batch.push(this.experienceBuffer[randomIndex]);
    }
    
    return batch;
  }

  private calculateReturnsAndAdvantages(batch: ExperienceBuffer[]): {
    returns: number[];
    advantages: number[];
  } {
    const returns: number[] = [];
    const advantages: number[] = [];
    
    // Calculate discounted returns using GAE (Generalized Advantage Estimation)
    for (let i = 0; i < batch.length; i++) {
      const experience = batch[i];
      let discountedReturn = 0;
      let advantage = 0;
      
      // Calculate return
      for (let j = i; j < Math.min(i + 10, batch.length); j++) {
        const future = batch[j];
        const discount = Math.pow(this.config.discount_factor, j - i);
        discountedReturn += discount * future.reward.total;
      }
      
      // Estimate value function (simplified)
      const stateValue = this.estimateValue(experience.state);
      const nextStateValue = experience.done ? 0 : this.estimateValue(experience.nextState);
      
      // Calculate advantage
      advantage = experience.reward.total + this.config.discount_factor * nextStateValue - stateValue;
      
      returns.push(discountedReturn);
      advantages.push(advantage);
    }
    
    return { returns, advantages };
  }

  private async trainPPO(
    batch: ExperienceBuffer[],
    returns: number[],
    advantages: number[]
  ): Promise<{ actorLoss: number; criticLoss: number }> {
    
    let totalActorLoss = 0;
    let totalCriticLoss = 0;
    
    // PPO training loop
    for (let epoch = 0; epoch < (this.config.ppo_epochs || 4); epoch++) {
      for (let i = 0; i < batch.length; i++) {
        const experience = batch[i];
        const return_ = returns[i];
        const advantage = advantages[i];
        
        // Get current policy probability
        const stateVector = this.environmentToVector(experience.state);
        const actionVector = this.actorNetwork.forward(stateVector);
        const currentProb = this.getActionProbability(actionVector, experience.action);
        
        // Calculate importance sampling ratio
        const oldProb = this.getActionProbability(actionVector, experience.action); // Simplified
        const ratio = currentProb / (oldProb + 1e-8);
        
        // PPO clipped objective
        const clipRatio = this.config.ppo_clip_ratio || 0.2;
        const clippedRatio = Math.max(Math.min(ratio, 1 + clipRatio), 1 - clipRatio);
        const actorLoss = -Math.min(ratio * advantage, clippedRatio * advantage);
        
        // Value function loss
        const predictedValue = this.criticNetwork.forward(stateVector)[0];
        const criticLoss = Math.pow(predictedValue - return_, 2);
        
        // Entropy bonus
        const entropy = this.calculateEntropy(actionVector);
        const entropyBonus = (this.config.entropy_coeff || 0.01) * entropy;
        
        // Update networks
        const totalLoss = actorLoss + (this.config.value_loss_coeff || 0.5) * criticLoss - entropyBonus;
        
        // Simplified gradient update
        this.actorNetwork.updateWeights(this.config.learning_rate);
        this.criticNetwork.updateWeights(this.config.learning_rate);
        
        totalActorLoss += actorLoss;
        totalCriticLoss += criticLoss;
      }
    }
    
    return {
      actorLoss: totalActorLoss / (batch.length * (this.config.ppo_epochs || 4)),
      criticLoss: totalCriticLoss / (batch.length * (this.config.ppo_epochs || 4))
    };
  }

  private async trainSAC(batch: ExperienceBuffer[]): Promise<{ actorLoss: number; criticLoss: number }> {
    // SAC (Soft Actor-Critic) implementation placeholder
    return { actorLoss: 0, criticLoss: 0 };
  }

  private async trainTD3(batch: ExperienceBuffer[]): Promise<{ actorLoss: number; criticLoss: number }> {
    // TD3 (Twin Delayed Deep Deterministic Policy Gradient) implementation placeholder
    return { actorLoss: 0, criticLoss: 0 };
  }

  // Safety and risk management
  private applySafetyConstraints(action: TradingAction, env: TradingEnvironment): TradingAction {
    let safeAction = { ...action };
    
    // Position size limits
    if (Math.abs(env.position) + safeAction.size > this.safetyConstraints.max_position_pct) {
      safeAction.size = Math.max(0, this.safetyConstraints.max_position_pct - Math.abs(env.position));
    }
    
    // Leverage limits
    safeAction.leverage = Math.min(safeAction.leverage, this.config.max_leverage);
    
    // Conservative mode adjustments
    if (this.conservativeMode) {
      safeAction.size *= 0.5; // Reduce position size
      safeAction.leverage = Math.min(safeAction.leverage, 2); // Reduce leverage
      safeAction.orderType = 'LIMIT'; // Use limit orders
    }
    
    // VaR constraint
    const estimatedVaR = this.estimateVaR(safeAction, env);
    if (estimatedVaR > this.safetyConstraints.max_var_95) {
      const scaleFactor = this.safetyConstraints.max_var_95 / estimatedVaR;
      safeAction.size *= scaleFactor;
    }
    
    // Circuit breaker check
    if (this.shouldTriggerCircuitBreaker(env)) {
      this.activateCircuitBreaker();
      return this.getSafeAction();
    }
    
    return safeAction;
  }

  private shouldTriggerCircuitBreaker(env: TradingEnvironment): boolean {
    if (!this.safetyConstraints.enable_circuit_breaker) return false;
    
    // Check drawdown threshold
    if (env.maxDrawdown > this.safetyConstraints.circuit_breaker_threshold) {
      return true;
    }
    
    // Check consecutive losses
    const recentRewards = this.rewardHistory.slice(-10);
    const consecutiveLosses = recentRewards.filter(r => r < 0).length;
    if (consecutiveLosses >= this.safetyConstraints.max_consecutive_losses) {
      return true;
    }
    
    return false;
  }

  private activateCircuitBreaker() {
    this.circuitBreakerActive = true;
    this.lastCircuitBreakerTime = Date.now();
    
    console.log('🚨 Circuit breaker activated - suspending trading');
    this.emit('circuitBreakerActivated', {
      timestamp: Date.now(),
      reason: 'Safety threshold breached'
    });
  }

  private getSafeAction(): TradingAction {
    return {
      type: 'HOLD',
      size: 0,
      leverage: 1,
      orderType: 'MARKET',
      timeInForce: 'GTC',
      slippage_tolerance: 0.001,
      max_position_hold_time: 60,
      confidence: 1.0
    };
  }

  private updateConservativeMode(env: TradingEnvironment) {
    const shouldBeConservative = 
      env.maxDrawdown > this.safetyConstraints.conservative_mode_threshold ||
      env.sharpeRatio < this.safetyConstraints.min_sharpe_ratio ||
      this.regimeClassifier.volatility_cluster === 'EXTREME';
    
    if (shouldBeConservative !== this.conservativeMode) {
      this.conservativeMode = shouldBeConservative;
      this.emit('conservativeModeChanged', {
        active: this.conservativeMode,
        reason: shouldBeConservative ? 'Risk threshold breached' : 'Risk levels normalized'
      });
    }
  }

  private startSafetyMonitoring() {
    // Check circuit breaker status every minute
    setInterval(() => {
      if (this.circuitBreakerActive) {
        const coolDownPassed = Date.now() - this.lastCircuitBreakerTime > 
          this.safetyConstraints.cool_down_period * 60000;
        
        if (coolDownPassed) {
          this.circuitBreakerActive = false;
          console.log('✅ Circuit breaker deactivated - resuming trading');
          this.emit('circuitBreakerDeactivated', { timestamp: Date.now() });
        }
      }
    }, 60000);
  }

  // Performance evaluation
  public evaluatePerformance(): PolicyPerformance {
    const recentRewards = this.rewardHistory.slice(-100);
    const recentActions = this.actionHistory.slice(-100);
    
    // Calculate trading statistics
    const totalTrades = recentActions.filter(a => a.type !== 'HOLD').length;
    const winningTrades = recentRewards.filter(r => r > 0).length;
    const losingTrades = recentRewards.filter(r => r < 0).length;
    
    // Calculate performance metrics
    const totalReturn = recentRewards.reduce((sum, r) => sum + r, 0);
    const averageReward = totalReturn / recentRewards.length;
    const volatility = this.calculateVolatility(recentRewards);
    const sharpeRatio = volatility > 0 ? averageReward / volatility : 0;
    
    // Calculate drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;
    
    for (const reward of recentRewards) {
      cumulative += reward;
      peak = Math.max(peak, cumulative);
      maxDrawdown = Math.min(maxDrawdown, cumulative - peak);
    }
    
    const performance: PolicyPerformance = {
      episode: this.episode,
      steps: this.totalSteps,
      total_reward: totalReturn,
      average_reward: averageReward,
      
      total_return: totalReturn,
      sharpe_ratio: sharpeRatio,
      sortino_ratio: this.calculateSortino(recentRewards),
      max_drawdown: Math.abs(maxDrawdown),
      calmar_ratio: totalReturn / Math.abs(maxDrawdown) || 0,
      
      total_trades: totalTrades,
      winning_trades: winningTrades,
      losing_trades: losingTrades,
      win_rate: totalTrades > 0 ? winningTrades / totalTrades : 0,
      profit_factor: this.calculateProfitFactor(recentRewards),
      average_trade_return: totalTrades > 0 ? totalReturn / totalTrades : 0,
      
      actor_loss: 0, // Would be filled from actual training
      critic_loss: 0,
      exploration_rate: this.config.exploration_rate,
      entropy: 0,
      
      var_95: this.calculateVaR(recentRewards, 0.95),
      var_99: this.calculateVaR(recentRewards, 0.99),
      expected_shortfall: this.calculateExpectedShortfall(recentRewards),
      volatility,
      
      bull_market_performance: 0, // Would be calculated from regime-specific performance
      bear_market_performance: 0,
      sideways_performance: 0,
      volatile_market_performance: 0,
      
      timestamp: Date.now()
    };
    
    this.lastPerformanceEval = performance;
    this.performanceHistory.push(performance);
    
    this.emit('performanceEvaluated', performance);
    
    return performance;
  }

  // Market regime update
  private updateMarketRegime(env: TradingEnvironment) {
    // Simple regime classification based on volatility and momentum
    const vol = env.volatility;
    const momentum = (env.ema12 - env.ema26) / env.currentPrice;
    const rsiSignal = (env.rsi - 50) / 50;
    
    // Update volatility cluster
    if (vol > 0.05) this.regimeClassifier.volatility_cluster = 'EXTREME';
    else if (vol > 0.03) this.regimeClassifier.volatility_cluster = 'HIGH';
    else if (vol > 0.015) this.regimeClassifier.volatility_cluster = 'MEDIUM';
    else this.regimeClassifier.volatility_cluster = 'LOW';
    
    // Update regime probabilities
    this.regimeClassifier.bull_probability = Math.max(0, Math.min(1, 0.5 + momentum + rsiSignal * 0.3));
    this.regimeClassifier.bear_probability = Math.max(0, Math.min(1, 0.5 - momentum - rsiSignal * 0.3));
    this.regimeClassifier.volatile_probability = vol * 20; // Scale volatility
    this.regimeClassifier.sideways_probability = 1 - this.regimeClassifier.bull_probability - 
      this.regimeClassifier.bear_probability - this.regimeClassifier.volatile_probability;
    
    // Determine current regime
    const probs = [
      this.regimeClassifier.bull_probability,
      this.regimeClassifier.bear_probability,
      this.regimeClassifier.sideways_probability,
      this.regimeClassifier.volatile_probability
    ];
    
    const maxProb = Math.max(...probs);
    const regimes: MarketRegimeClassifier['current_regime'][] = ['BULL', 'BEAR', 'SIDEWAYS', 'VOLATILE'];
    this.regimeClassifier.current_regime = regimes[probs.indexOf(maxProb)];
    this.regimeClassifier.confidence = maxProb;
    
    // Update trend characteristics
    this.regimeClassifier.trend_strength = Math.abs(momentum);
    this.regimeClassifier.momentum = momentum;
    this.regimeClassifier.mean_reversion_tendency = 1 - this.regimeClassifier.trend_strength;
  }

  // Utility methods
  private simulateForwardPass(input: number[], architecture: NeuralNetworkArchitecture): number[] {
    // Simplified forward pass simulation
    let output = [...input];
    
    for (const layerSize of architecture.hidden_layers) {
      output = output.slice(0, layerSize).map(x => Math.tanh(x + Math.random() * 0.1 - 0.05));
    }
    
    return output.slice(0, architecture.output_dim);
  }

  private simulateBackwardPass(gradients: number[]): void {
    // Placeholder for backpropagation
  }

  private simulateWeightUpdate(learningRate: number): void {
    // Placeholder for weight updates
  }

  private addExplorationNoise(actionVector: number[]): void {
    const noise = this.config.exploration_rate;
    for (let i = 0; i < actionVector.length; i++) {
      actionVector[i] += (Math.random() - 0.5) * noise;
    }
  }

  private softmax(vector: number[]): number[] {
    const exp = vector.map(x => Math.exp(x));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map(x => x / sum);
  }

  private sampleFromProbabilities(actions: string[], probabilities: number[]): string {
    const rand = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i];
      if (rand <= cumulative) {
        return actions[i];
      }
    }
    
    return actions[actions.length - 1];
  }

  private estimateValue(state: TradingEnvironment): number {
    const stateVector = this.environmentToVector(state);
    return this.criticNetwork.forward(stateVector)[0];
  }

  private getActionProbability(actionVector: number[], action: TradingAction): number {
    // Simplified action probability calculation
    return 0.33; // Placeholder
  }

  private calculateEntropy(actionVector: number[]): number {
    const probs = this.softmax(actionVector);
    return -probs.reduce((sum, p) => sum + p * Math.log(p + 1e-8), 0);
  }

  private estimateVaR(action: TradingAction, env: TradingEnvironment): number {
    // Simplified VaR estimation
    const positionValue = action.size * env.currentPrice * action.leverage;
    return positionValue * env.volatility * 1.65; // 95% confidence
  }

  private updateTargetNetworks(): void {
    // Soft update of target networks (simplified)
    const tau = this.config.sac_tau || 0.005;
    
    // Update target network weights (placeholder)
    this.targetActorNetwork.weights = this.targetActorNetwork.weights.map((w: number, i: number) => 
      (1 - tau) * w + tau * this.actorNetwork.weights[i]
    );
  }

  private updateExplorationRate(): void {
    this.config.exploration_rate *= this.config.exploration_decay;
  }

  private calculateVolatility(rewards: number[]): number {
    if (rewards.length < 2) return 0;
    
    const mean = rewards.reduce((sum, r) => sum + r, 0) / rewards.length;
    const variance = rewards.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (rewards.length - 1);
    return Math.sqrt(variance);
  }

  private calculateSortino(rewards: number[]): number {
    const mean = rewards.reduce((sum, r) => sum + r, 0) / rewards.length;
    const negativeRewards = rewards.filter(r => r < 0);
    
    if (negativeRewards.length === 0) return Infinity;
    
    const downside = Math.sqrt(
      negativeRewards.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeRewards.length
    );
    
    return downside > 0 ? mean / downside : 0;
  }

  private calculateProfitFactor(rewards: number[]): number {
    const gains = rewards.filter(r => r > 0).reduce((sum, r) => sum + r, 0);
    const losses = Math.abs(rewards.filter(r => r < 0).reduce((sum, r) => sum + r, 0));
    
    return losses > 0 ? gains / losses : Infinity;
  }

  private calculateVaR(rewards: number[], confidence: number): number {
    const sorted = [...rewards].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sorted.length);
    return -sorted[index] || 0;
  }

  private calculateExpectedShortfall(rewards: number[]): number {
    const var95 = this.calculateVaR(rewards, 0.95);
    const tailLosses = rewards.filter(r => -r >= var95);
    return tailLosses.length > 0 ? -tailLosses.reduce((sum, r) => sum + r, 0) / tailLosses.length : 0;
  }

  // Public API methods
  public startTraining(): void {
    this.isTraining = true;
    this.episode = 0;
    this.totalSteps = 0;
    
    console.log('🚀 Started RL Policy training');
    this.emit('trainingStarted', { timestamp: Date.now() });
  }

  public stopTraining(): void {
    this.isTraining = false;
    
    console.log('⏹️ Stopped RL Policy training');
    this.emit('trainingStopped', { timestamp: Date.now() });
  }

  public getConfiguration(): PolicyConfiguration {
    return { ...this.config };
  }

  public updateConfiguration(updates: Partial<PolicyConfiguration>): void {
    this.config = { ...this.config, ...updates };
    this.emit('configurationUpdated', updates);
  }

  public getSafetyConstraints(): SafetyConstraints {
    return { ...this.safetyConstraints };
  }

  public updateSafetyConstraints(updates: Partial<SafetyConstraints>): void {
    this.safetyConstraints = { ...this.safetyConstraints, ...updates };
    this.emit('safetyConstraintsUpdated', updates);
  }

  public getCurrentRegime(): MarketRegimeClassifier {
    return { ...this.regimeClassifier };
  }

  public getPerformanceHistory(limit: number = 100): PolicyPerformance[] {
    return this.performanceHistory.slice(-limit);
  }

  public getExperienceBufferSize(): number {
    return this.experienceBuffer.length;
  }

  public clearExperienceBuffer(): void {
    this.experienceBuffer = [];
    this.emit('experienceBufferCleared', { timestamp: Date.now() });
  }

  public exportModel(): any {
    return {
      actorNetwork: this.actorNetwork,
      criticNetwork: this.criticNetwork,
      configuration: this.config,
      performanceHistory: this.performanceHistory
    };
  }

  public importModel(modelData: any): void {
    this.actorNetwork = modelData.actorNetwork;
    this.criticNetwork = modelData.criticNetwork;
    this.config = modelData.configuration;
    this.performanceHistory = modelData.performanceHistory || [];
    
    this.emit('modelImported', { timestamp: Date.now() });
  }

  public subscribeToPolicy(callback: (data: any) => void): void {
    this.on('actionSelected', callback);
    this.on('experienceStored', callback);
    this.on('policyTrained', callback);
    this.on('performanceEvaluated', callback);
    this.on('circuitBreakerActivated', callback);
    this.on('circuitBreakerDeactivated', callback);
    this.on('conservativeModeChanged', callback);
  }
}

export const createRLPolicy = (config: PolicyConfiguration, safetyConstraints: SafetyConstraints) => {
  return new RLPolicyEngine(config, safetyConstraints);
};
