/**
 * 🔐 SAFE AI MODEL ABSTRACTION LAYER
 * ===================================
 * Frontend-safe model definitions
 *
 * SECURITY: Never expose actual provider or model names
 * Only use LyDian-branded display names and generic codes
 *
 * This file is safe for client-side inspection
 */

/**
 * Available AI Engines
 * All models use obfuscated codes (LX/VX/QX/NX)
 * Display names use LyDian branding only
 */
const LYDIAN_AI_ENGINES = [
  {
    code: 'LX01',
    name: 'LyDian UltraFast Engine',
    tier: 'ultra-fast',
    capabilities: ['text', 'fast'],
    description: 'Lightning-fast responses for quick tasks',
    icon: '⚡',
    recommended: ['quick-questions', 'simple-tasks', 'chat']
  },
  {
    code: 'LX02',
    name: 'LyDian Pro Engine',
    tier: 'balanced',
    capabilities: ['text', 'code', 'reasoning'],
    description: 'Balanced performance for everyday tasks',
    icon: '🎯',
    recommended: ['general-tasks', 'code-generation', 'analysis']
  },
  {
    code: 'LX03',
    name: 'LyDian Advanced Engine',
    tier: 'advanced',
    capabilities: ['text', 'code', 'reasoning', 'analysis'],
    description: 'Advanced reasoning for complex problems',
    icon: '🧠',
    recommended: ['complex-analysis', 'deep-reasoning', 'research']
  },
  {
    code: 'LX04',
    name: 'LyDian Premium Engine',
    tier: 'premium',
    capabilities: ['text', 'code', 'reasoning', 'analysis', 'multimodal'],
    description: 'Premium intelligence for enterprise tasks',
    icon: '👑',
    recommended: ['enterprise', 'critical-tasks', 'expert-analysis']
  },
  {
    code: 'VX01',
    name: 'LyDian Vision Engine',
    tier: 'vision',
    capabilities: ['text', 'vision', 'image-analysis'],
    description: 'Multimodal AI for image and text understanding',
    icon: '👁️',
    recommended: ['image-analysis', 'visual-tasks', 'multimodal']
  },
  {
    code: 'QX01',
    name: 'LyDian Quantum Engine',
    tier: 'quantum',
    capabilities: ['text', 'ultra-fast'],
    description: 'Quantum-speed streaming responses',
    icon: '🚀',
    recommended: ['real-time-chat', 'streaming', 'fast-responses']
  },
  {
    code: 'NX01',
    name: 'LyDian Neural Engine',
    tier: 'neural',
    capabilities: ['text', 'multimodal', 'analysis'],
    description: 'Neural network for multimodal analysis',
    icon: '🌐',
    recommended: ['multimodal-tasks', 'creative-work', 'analysis']
  }
];

/**
 * Get all available engines
 */
function getAvailableEngines() {
  return LYDIAN_AI_ENGINES;
}

/**
 * Get engine by code
 * @param {string} code - Engine code (LX01, VX01, etc.)
 */
function getEngineByCode(code) {
  return LYDIAN_AI_ENGINES.find(engine => engine.code === code);
}

/**
 * Get engines by capability
 * @param {string} capability - Capability to filter by
 */
function getEnginesByCapability(capability) {
  return LYDIAN_AI_ENGINES.filter(engine =>
    engine.capabilities.includes(capability)
  );
}

/**
 * Get recommended engine for a task
 * @param {string} taskType - Type of task
 */
function getRecommendedEngine(taskType) {
  const engine = LYDIAN_AI_ENGINES.find(e =>
    e.recommended.includes(taskType)
  );
  return engine || LYDIAN_AI_ENGINES[1]; // Default to Pro Engine
}

/**
 * Get default engine
 */
function getDefaultEngine() {
  return LYDIAN_AI_ENGINES[1]; // LyDian Pro Engine (LX02)
}

/**
 * Create engine selector HTML
 * Safe for embedding in UI
 */
function createEngineSelector(selectedCode = 'LX02') {
  const engines = getAvailableEngines();

  const options = engines.map(engine => {
    const selected = engine.code === selectedCode ? 'selected' : '';
    return `
      <option value="${engine.code}" ${selected} data-tier="${engine.tier}">
        ${engine.icon} ${engine.name} - ${engine.description}
      </option>
    `;
  }).join('');

  return `
    <select id="ai-engine-selector" class="form-control">
      ${options}
    </select>
  `;
}

/**
 * Get engine display card HTML
 * @param {string} code - Engine code
 */
function getEngineCard(code) {
  const engine = getEngineByCode(code);
  if (!engine) return '';

  return `
    <div class="engine-card" data-code="${engine.code}" data-tier="${engine.tier}">
      <div class="engine-icon">${engine.icon}</div>
      <div class="engine-name">${engine.name}</div>
      <div class="engine-description">${engine.description}</div>
      <div class="engine-capabilities">
        ${engine.capabilities.map(cap =>
          `<span class="capability-badge">${cap}</span>`
        ).join('')}
      </div>
    </div>
  `;
}

/**
 * Make API request with obfuscated model code
 * @param {string} endpoint - API endpoint
 * @param {string} modelCode - Model code (LX01, VX01, etc.)
 * @param {object} data - Request data
 */
async function lydianAPIRequest(endpoint, modelCode, data) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        modelCode: modelCode, // Only send code, never actual model name
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('LyDian API Error:', error.message);
    throw error;
  }
}

/**
 * Initialize engine selector
 * Call this on page load to set up event listeners
 */
function initEngineSelector() {
  const selector = document.getElementById('ai-engine-selector');
  if (!selector) return;

  selector.addEventListener('change', (e) => {
    const code = e.target.value;
    const engine = getEngineByCode(code);

    // Dispatch custom event for other components to listen to
    document.dispatchEvent(new CustomEvent('engineChanged', {
      detail: { code, engine }
    }));
  });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LYDIAN_AI_ENGINES,
    getAvailableEngines,
    getEngineByCode,
    getEnginesByCapability,
    getRecommendedEngine,
    getDefaultEngine,
    createEngineSelector,
    getEngineCard,
    lydianAPIRequest,
    initEngineSelector
  };
}

// Make available globally for direct HTML usage
window.LyDianEngines = {
  list: LYDIAN_AI_ENGINES,
  getAvailable: getAvailableEngines,
  getByCode: getEngineByCode,
  getByCapability: getEnginesByCapability,
  getRecommended: getRecommendedEngine,
  getDefault: getDefaultEngine,
  createSelector: createEngineSelector,
  createCard: getEngineCard,
  apiRequest: lydianAPIRequest,
  init: initEngineSelector
};
