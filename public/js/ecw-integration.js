/**
 * ECW API Integration for Ailydian
 * Ethical Climate Wallet - AI Usage Tracking
 * Version: 1.0.0
 */

class ECWIntegration {
    constructor() {
        this.apiBase = 'http://localhost:3210/v7.3/ecw';
        this.userWalletCache = new Map();
        this.initialized = false;
    }

    /**
     * Initialize ECW integration for current user
     */
    async initialize(userId) {
        try {
            const wallet = await this.getOrCreateWallet(userId);
            this.initialized = true;
            console.log('✓ ECW Integration initialized:', wallet.id);
            return wallet;
        } catch (error) {
            console.error('❌ ECW initialization failed:', error);
            throw error;
        }
    }

    /**
     * Get or create wallet for user
     */
    async getOrCreateWallet(userId) {
        // Check cache
        if (this.userWalletCache.has(userId)) {
            return this.userWalletCache.get(userId);
        }

        try {
            // Try to find existing wallet
            const response = await fetch(`${this.apiBase}/wallet/owner/lookup?ownerType=individual&ownerId=${userId}&region=EU`);

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.userWalletCache.set(userId, data.data);
                    return data.data;
                }
            }

            // Create new wallet if not exists
            const createResponse = await fetch(`${this.apiBase}/wallet/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ownerType: 'individual',
                    ownerId: userId,
                    region: 'EU'
                })
            });

            const createData = await createResponse.json();
            if (createData.success) {
                this.userWalletCache.set(userId, createData.data);
                return createData.data;
            }

            throw new Error('Failed to create wallet');
        } catch (error) {
            console.error('Wallet creation error:', error);
            throw error;
        }
    }

    /**
     * Track AI Chat Usage
     * @param {string} userId - User ID
     * @param {object} chatData - Chat metadata
     */
    async trackAIChat(userId, chatData) {
        const wallet = await this.getOrCreateWallet(userId);

        // Calculate CO2 impact (rough estimate)
        const estimatedTokens = (chatData.prompt?.length || 0) + (chatData.response?.length || 0);
        const co2Impact = this.calculateCO2Impact(estimatedTokens, chatData.model);

        return await this.logTransaction(wallet.id, {
            type: co2Impact > 0 ? 'debit' : 'credit',
            metric: 'CO2',
            amount: Math.abs(co2Impact),
            reason: `AI Chat: ${chatData.model || 'Unknown'} - ${estimatedTokens} tokens`,
            source: 'ailydian',
            metadata: {
                model: chatData.model,
                tokens: estimatedTokens,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Track Image Generation
     */
    async trackImageGeneration(userId, imageData) {
        const wallet = await this.getOrCreateWallet(userId);

        // Image generation has higher CO2 impact
        const co2Impact = this.calculateImageCO2(imageData.resolution, imageData.model);

        return await this.logTransaction(wallet.id, {
            type: 'debit',
            metric: 'CO2',
            amount: co2Impact,
            reason: `Image Generation: ${imageData.model} - ${imageData.resolution}`,
            source: 'ailydian',
            metadata: {
                model: imageData.model,
                resolution: imageData.resolution,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Track Positive Action (e.g., using energy-efficient model)
     */
    async trackPositiveAction(userId, actionData) {
        const wallet = await this.getOrCreateWallet(userId);

        return await this.logTransaction(wallet.id, {
            type: 'credit',
            metric: 'CO2',
            amount: actionData.creditAmount || 10,
            reason: actionData.reason || 'Sustainable AI usage',
            source: 'ailydian',
            metadata: actionData
        });
    }

    /**
     * Log transaction to ECW
     */
    async logTransaction(walletId, txData) {
        try {
            const response = await fetch(`${this.apiBase}/tx/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletId,
                    ...txData
                })
            });

            const data = await response.json();
            if (data.success) {
                console.log('✓ ECW Transaction logged:', {
                    id: data.data.id,
                    ethicsScore: data.data.ethicsScore,
                    impactScore: data.data.impactScore
                });
                return data.data;
            }

            throw new Error(data.error?.message || 'Transaction failed');
        } catch (error) {
            console.error('Transaction logging error:', error);
            throw error;
        }
    }

    /**
     * Get wallet balance and scores
     */
    async getWalletStats(userId) {
        const wallet = await this.getOrCreateWallet(userId);

        try {
            const response = await fetch(`${this.apiBase}/wallet/${wallet.id}`);
            const data = await response.json();

            if (data.success) {
                return {
                    balanceCO2: data.data.balanceCO2,
                    ethicsScore: data.data.ethicsScore,
                    impactScore: data.data.impactScore,
                    status: data.data.status
                };
            }

            throw new Error('Failed to fetch wallet stats');
        } catch (error) {
            console.error('Wallet stats error:', error);
            throw error;
        }
    }

    /**
     * Get transaction history
     */
    async getTransactionHistory(userId, limit = 10) {
        const wallet = await this.getOrCreateWallet(userId);

        try {
            const response = await fetch(`${this.apiBase}/tx/history/${wallet.id}?limit=${limit}`);
            const data = await response.json();

            if (data.success) {
                return data.data;
            }

            throw new Error('Failed to fetch transaction history');
        } catch (error) {
            console.error('Transaction history error:', error);
            throw error;
        }
    }

    /**
     * Calculate CO2 impact for AI chat
     * Based on token count and model type
     */
    calculateCO2Impact(tokens, model) {
        const baseImpact = 0.0001; // kg CO2 per token (rough estimate)

        const modelMultipliers = {
            'gpt-4': 1.5,
            'gpt-3.5-turbo': 1.0,
            'claude-3': 1.2,
            'gemini-pro': 1.1,
            'llama-2': 0.8 // Open source, potentially more efficient
        };

        const multiplier = modelMultipliers[model] || 1.0;
        return tokens * baseImpact * multiplier;
    }

    /**
     * Calculate CO2 impact for image generation
     */
    calculateImageCO2(resolution, model) {
        const baseImpact = {
            '512x512': 0.5,
            '1024x1024': 2.0,
            '1536x1536': 4.5,
            '2048x2048': 8.0
        };

        const modelMultipliers = {
            'dall-e-3': 1.2,
            'dall-e-2': 1.0,
            'midjourney': 1.3,
            'stable-diffusion': 0.8
        };

        const resolutionImpact = baseImpact[resolution] || 1.0;
        const modelMultiplier = modelMultipliers[model] || 1.0;

        return resolutionImpact * modelMultiplier;
    }

    /**
     * Display ethics badge in UI
     */
    createEthicsBadge(stats) {
        const badge = document.createElement('div');
        badge.className = 'ecw-ethics-badge';
        badge.innerHTML = `
            <div class="ecw-badge">
                <div class="ecw-badge-icon">🌍</div>
                <div class="ecw-badge-content">
                    <div class="ecw-score">
                        <span class="ecw-label">Ethics (Ω)</span>
                        <span class="ecw-value">${stats.ethicsScore.toFixed(0)}</span>
                    </div>
                    <div class="ecw-score">
                        <span class="ecw-label">Impact (Φ)</span>
                        <span class="ecw-value">${stats.impactScore.toFixed(0)}</span>
                    </div>
                    <div class="ecw-balance">
                        <span class="ecw-label">CO2 Balance</span>
                        <span class="ecw-value ${stats.balanceCO2 < 0 ? 'negative' : 'positive'}">
                            ${stats.balanceCO2.toFixed(2)} kg
                        </span>
                    </div>
                </div>
            </div>
        `;
        return badge;
    }

    /**
     * Verify cryptographic proof
     */
    async verifyProof(txId) {
        try {
            const response = await fetch(`${this.apiBase}/proof/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ txId })
            });

            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error('Proof verification error:', error);
            return null;
        }
    }
}

// Global instance
window.ecwIntegration = new ECWIntegration();

// Auto-initialize with demo user if localStorage has user
if (typeof localStorage !== 'undefined') {
    const demoUserId = localStorage.getItem('ailydian_user_id') || 'demo-user-' + Date.now();
    localStorage.setItem('ailydian_user_id', demoUserId);

    // Initialize on page load
    window.addEventListener('DOMContentLoaded', async () => {
        try {
            await window.ecwIntegration.initialize(demoUserId);
            console.log('✓ ECW Integration ready for Ailydian');
        } catch (error) {
            console.warn('ECW Integration initialization skipped:', error.message);
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ECWIntegration;
}
