/**
 * 🧬 MEDICAL QUANTUM ANALYSIS API
 * ===============================
 * POST /api/medical/quantum-analysis
 *
 * Purpose: Quantum-powered molecular analysis for Medical Expert
 *
 * Features:
 * - VQE molecular simulation (BlueQubit)
 * - AI interpretation of quantum results
 * - Drug-protein binding prediction
 * - Toxicity and efficacy analysis
 *
 * @author LyDian AI Team
 * @date 2024-10-24
 */

const { getQuantumGateway } = require('../../services/quantum-gateway');
const axios = require('axios');
const { getCorsOrigin } = require('../_middleware/cors');

// Groq for fast AI analysis
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * Medical quantum system prompt
 */
function buildQuantumMedicalPrompt(molecule, quantumData) {
  return `You are LyDian Medical Expert with quantum computing capabilities.

QUANTUM SIMULATION RESULTS:
Molecule: ${molecule}
Ground State Energy: ${quantumData.energy?.hartree || 'N/A'} Hartree (${quantumData.energy?.kcalMol || 'N/A'} kcal/mol)
Computational Method: VQE (Variational Quantum Eigensolver)
Device: ${quantumData.device}

YOUR TASK:
Analyze this molecule from a medical perspective:

1. MOLECULAR PROPERTIES:
   - Stability (based on ground state energy)
   - Chemical reactivity
   - Potential therapeutic applications

2. DRUG-LIKE CHARACTERISTICS:
   - Lipinski's Rule of Five compliance
   - Oral bioavailability prediction
   - Blood-brain barrier penetration

3. SAFETY PROFILE:
   - Potential toxicity indicators
   - Metabolic stability
   - Drug-drug interaction risks

4. CLINICAL RELEVANCE:
   - Similar approved drugs
   - Therapeutic targets
   - Clinical trial recommendations

IMPORTANT:
- Be precise and evidence-based
- Cite relevant medical literature when possible
- Highlight limitations of current analysis
- Recommend further studies if needed

Respond in a clear, professional medical format suitable for healthcare practitioners.`;
}

/**
 * Query Groq for fast AI analysis
 */
async function analyzeWithGroq(prompt) {
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'GX9A5E1D',
      messages: [
        {
          role: 'system',
          content:
            'You are LyDian Medical Expert, an AI physician with expertise in quantum chemistry and pharmacology.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.choices[0].message.content;
}

/**
 * Query Anthropic AX9F7E2B for analysis
 */
async function analyzeWithAX9F7E2B(prompt) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'AX9F7E2B',
    max_tokens: 2000,
    temperature: 0.3,
    system:
      'You are LyDian Medical Expert, an AI physician with expertise in quantum chemistry and pharmacology.',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return response.content[0].text;
}

/**
 * Main handler
 */
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Use POST to submit quantum analysis request',
    });
  }

  try {
    const { molecule, bondDistance, device = 'auto', budget = 0.1, language = 'en' } = req.body;

    // Validate
    if (!molecule) {
      return res.status(400).json({
        error: 'Missing molecule',
        message: 'Please provide a molecule formula (e.g., H2, H2O, C6H6)',
      });
    }

    // Step 1: Run Quantum Simulation
    console.log(`🧬 Starting quantum analysis for ${molecule}...`);

    const quantum = getQuantumGateway();
    const startTime = Date.now();

    const vqeResult = await quantum.runVQE({
      molecule,
      bondDistance,
      device,
      budget,
    });

    const quantumTime = Date.now() - startTime;
    console.log(`✅ Quantum simulation complete in ${quantumTime}ms`);

    // Extract energy data
    const quantumData = {
      molecule,
      device: vqeResult.device,
      cost: vqeResult.cost,
      fromCache: vqeResult.fromCache,
      energy: vqeResult.output ? extractEnergyData(vqeResult.output) : null,
    };

    // Step 2: AI Analysis
    console.log('🤖 Starting AI analysis...');

    const prompt = buildQuantumMedicalPrompt(molecule, quantumData);
    let aiAnalysis;
    let modelUsed;

    // Try Groq first (fastest)
    if (GROQ_API_KEY) {
      try {
        console.log('Trying Groq...');
        aiAnalysis = await analyzeWithGroq(prompt);
        modelUsed = 'LyDian Medical AI - Ultra-Fast Quantum Model';
      } catch (error) {
        console.error('Groq failed:', error.message);
      }
    }

    // Fallback to AX9F7E2B
    if (!aiAnalysis && ANTHROPIC_API_KEY) {
      try {
        console.log('Fallback to AX9F7E2B...');
        aiAnalysis = await analyzeWithAX9F7E2B(prompt);
        modelUsed = 'LyDian Medical AI - Advanced Quantum Model';
      } catch (error) {
        console.error('AX9F7E2B failed:', error.message);
      }
    }

    // No AI available
    if (!aiAnalysis) {
      aiAnalysis = generateFallbackAnalysis(molecule, quantumData);
      modelUsed = 'LyDian Medical AI - Quantum Results Only';
    }

    const totalTime = Date.now() - startTime;

    // Prepare response
    const response = {
      success: true,
      data: {
        molecule,
        quantumSimulation: {
          energy: quantumData.energy,
          device: quantumData.device,
          cost: `$${quantumData.cost.toFixed(2)}`,
          fromCache: quantumData.fromCache,
          executionTime: `${quantumTime}ms`,
        },
        medicalAnalysis: {
          content: aiAnalysis,
          model: modelUsed,
          language,
        },
        performance: {
          totalTime: `${totalTime}ms`,
          quantumTime: `${quantumTime}ms`,
          aiTime: `${totalTime - quantumTime}ms`,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        apiVersion: '1.0.0',
        quantumProvider: 'BlueQubit',
        disclaimer:
          'This analysis is for research purposes only. Not a substitute for professional medical advice.',
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Quantum Medical Analysis Error:', error);

    res.status(500).json({
      error: 'Analysis failed',
      message: 'Analiz hatası',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Extract energy data from VQE output
 */
function extractEnergyData(output) {
  if (!output || typeof output !== 'string') {
    return null;
  }

  try {
    const hartreeMatch = output.match(/Ground state energy:\s*([-\d.]+)\s*Hartree/);
    const kcalMatch = output.match(/Energy in pharma units:\s*([-\d.]+)\s*kcal\/mol/);

    return {
      hartree: hartreeMatch ? parseFloat(hartreeMatch[1]) : null,
      kcalMol: kcalMatch ? parseFloat(kcalMatch[1]) : null,
      unit: 'Hartree (quantum), kcal/mol (pharma standard)',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generate fallback analysis (if AI not available)
 */
function generateFallbackAnalysis(molecule, quantumData) {
  return `QUANTUM SIMULATION RESULTS

Molecule: ${molecule}
Ground State Energy: ${quantumData.energy?.hartree || 'N/A'} Hartree
Pharma Units: ${quantumData.energy?.kcalMol || 'N/A'} kcal/mol
Computational Device: ${quantumData.device}

INTERPRETATION:
The ground state energy indicates the molecule's inherent stability. Lower (more negative) energy values suggest a more stable molecular configuration.

LIMITATIONS:
- Full AI analysis requires API key configuration
- This is a basic quantum simulation (${molecule})
- Clinical interpretation requires human expert review

RECOMMENDATION:
For comprehensive medical analysis, please configure AI models (Groq or AX9F7E2B) or consult with a qualified pharmacologist.

Note: This quantum simulation was performed using VQE (Variational Quantum Eigensolver), a state-of-the-art quantum algorithm for molecular energy calculations.`;
}
