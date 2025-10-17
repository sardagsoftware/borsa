/**
 * 🎨 Intent UI Components - Vanilla JS
 * Natural language chat interface with intent parsing
 *
 * @author LyDian AI - Ultra Intelligence Platform
 */

(function(window) {
  'use strict';

  // Import dependencies
  const IntentEngine = window.IntentEngine || {};
  const IntentDictionaries = window.IntentDictionaries || {};

  /**
   * 💬 Main IntentChat Controller
   */
  class IntentChat {
    constructor(containerId, options = {}) {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.error(`Container #${containerId} not found`);
        return;
      }

      this.locale = options.locale || 'tr';
      this.apiBaseUrl = options.apiBaseUrl || '/api';
      this.onAction = options.onAction || null;

      this.messages = [];
      this.currentIntents = [];

      this.init();
    }

    init() {
      this.container.innerHTML = AilydianSanitizer.sanitizeHTML(`
        <div class="intent-chat-wrapper">
          <!-- Messages Container -->
          <div class="intent-messages" id="intent-messages"></div>

          <!-- Intent Chips (Suggestions) -->
          <div class="intent-chips-container" id="intent-chips"></div>

          <!-- Chat Composer -->
          <div class="intent-composer">
            <div class="composer-input-wrapper">
              <textarea
                id="intent-input"
                class="composer-textarea"
                placeholder="${this.getPlaceholder()}"
                rows="1"
              ></textarea>
              <button id="intent-send-btn" class="composer-send-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div class="composer-hint" id="composer-hint"></div>
          </div>
        </div>
      `;

      this.attachEventListeners();
      this.sendTelemetry('session.started', { locale: this.locale });
    }

    getPlaceholder() {
      const placeholders = {
        tr: 'Aras kargom nerede 1234567890? • 250000 TL kredi 24 ay • Antalya 3 gece 2 kişi otel',
        en: 'Where is my Aras shipment 1234567890? • 250000 TL loan 24 months • Antalya 3 nights 2 guests',
        ar: 'أين شحنة Aras الخاصة بي 1234567890؟'
      };
      return placeholders[this.locale] || placeholders.tr;
    }

    attachEventListeners() {
      const input = document.getElementById('intent-input');
      const sendBtn = document.getElementById('intent-send-btn');

      // Real-time intent parsing
      input.addEventListener('input', (e) => {
        this.handleInputChange(e.target.value);
      });

      // Auto-resize textarea
      input.addEventListener('input', (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
      });

      // Send on Enter (Shift+Enter for newline)
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSend();
        }
      });

      // Send button click
      sendBtn.addEventListener('click', () => this.handleSend());
    }

    handleInputChange(utterance) {
      if (!utterance || utterance.trim().length < 3) {
        this.currentIntents = [];
        this.renderIntentChips([]);
        this.updateComposerHint('');
        return;
      }

      // Parse intents
      const intents = IntentEngine.parseUtterance(utterance, this.locale);
      this.currentIntents = intents;

      // Render chips
      this.renderIntentChips(intents);

      // Update hint
      if (intents.length > 0) {
        const topIntent = intents[0];
        const formattedIntent = IntentEngine.formatIntentChip(topIntent);
        const confidence = Math.round(topIntent.score * 100);
        this.updateComposerHint(`🎯 ${formattedIntent} (${confidence}%)`);
      } else {
        this.updateComposerHint('');
      }

      // Send telemetry
      this.sendTelemetry('intent.parsed', {
        utterance: utterance.substring(0, 100),
        topIntent: intents[0]?.action,
        confidence: intents[0]?.score,
        locale: this.locale,
        totalIntents: intents.length
      });
    }

    renderIntentChips(intents) {
      const container = document.getElementById('intent-chips');
      if (intents.length === 0) {
        container.innerHTML = AilydianSanitizer.sanitizeHTML('';
        container.style.display = 'none';
        return;
      }

      container.style.display = 'flex';
      container.innerHTML = intents.map((intent, idx) => {
        const metadata = IntentDictionaries.actionMetadata?.[intent.action] || {};
        const icon = metadata.icon || '🎯';
        const label = IntentEngine.formatIntentChip(intent);
        const confidence = Math.round(intent.score * 100);

        return `
          <button class="intent-chip ${idx === 0 ? 'intent-chip-primary' : ''}" data-index="${idx}">
            <span class="intent-chip-icon">${icon}</span>
            <span class="intent-chip-label">${label}</span>
            <span class="intent-chip-confidence">${confidence}%</span>
          </button>
        `;
      }).join('');

      // Attach click handlers to chips
      container.querySelectorAll('.intent-chip').forEach((chip) => {
        chip.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.getAttribute('data-index'));
          this.handleIntentChipClick(intents[idx]);
        });
      });
    }

    updateComposerHint(hint) {
      const hintEl = document.getElementById('composer-hint');
      hintEl.textContent = hint;
      hintEl.style.display = hint ? 'block' : 'none';
    }

    handleIntentChipClick(intent) {
      // Execute action immediately when user clicks a chip
      this.executeAction(intent);
    }

    async handleSend() {
      const input = document.getElementById('intent-input');
      const utterance = input.value.trim();

      if (!utterance) return;

      // Add user message
      this.addMessage('user', utterance);

      // Clear input
      input.value = '';
      input.style.height = 'auto';
      this.currentIntents = [];
      this.renderIntentChips([]);
      this.updateComposerHint('');

      // Parse intents
      const intents = IntentEngine.parseUtterance(utterance, this.locale);

      if (intents.length === 0) {
        this.addMessage('assistant', 'Üzgünüm, bu isteği anlayamadım. Lütfen farklı bir şekilde ifade eder misiniz?');
        return;
      }

      // Execute top intent
      const topIntent = intents[0];
      await this.executeAction(topIntent);
    }

    async executeAction(intent) {
      const actionHandlers = {
        'shipment.track': this.handleShipmentTrack.bind(this),
        'loan.compare': this.handleLoanCompare.bind(this),
        'trip.search': this.handleTripSearch.bind(this),
        'economy.optimize': this.handleEconomyOptimize.bind(this),
        'insights.price-trend': this.handleInsightsTrend.bind(this),
        'esg.calculate-carbon': this.handleESGCarbon.bind(this)
      };

      const handler = actionHandlers[intent.action];

      if (!handler) {
        this.addMessage('assistant', `Eylem "${intent.action}" henüz desteklenmiyor.`);
        this.sendTelemetry('action.executed', {
          action: intent.action,
          success: false,
          error: 'Handler not implemented',
          locale: this.locale
        });
        return;
      }

      // Show loading
      const loadingId = this.addMessage('assistant', '⏳ İşleniyor...');

      try {
        await handler(intent);
        this.removeMessage(loadingId);

        this.sendTelemetry('action.executed', {
          action: intent.action,
          success: true,
          confidence: intent.score,
          locale: this.locale
        });
      } catch (error) {
        this.removeMessage(loadingId);
        this.addMessage('assistant', `❌ Hata: ${error.message}`);

        this.sendTelemetry('action.executed', {
          action: intent.action,
          success: false,
          error: error.message,
          locale: this.locale
        });
      }
    }

    async handleShipmentTrack(intent) {
      const { vendor, trackingNo } = intent.params;

      // Mock shipment tracking (in production, call real API)
      const shipment = {
        vendor,
        trackingNo,
        status: 'in_transit',
        currentLocation: 'İstanbul Anadolu Dağıtım Merkezi',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        history: [
          { timestamp: '2025-10-09T10:00:00Z', location: 'Ankara Çıkış', status: 'departed' },
          { timestamp: '2025-10-09T18:00:00Z', location: 'İstanbul Giriş', status: 'arrived' },
          { timestamp: '2025-10-10T08:00:00Z', location: 'Dağıtım Merkezi', status: 'sorting' }
        ]
      };

      this.addMessage('assistant', '', 'shipment', shipment);
    }

    async handleLoanCompare(intent) {
      const { amount, term } = intent.params;

      const response = await fetch(`${this.apiBaseUrl}/finance/loan/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, term })
      });

      if (!response.ok) throw new Error('Kredi karşılaştırma başarısız');

      const data = await response.json();
      this.addMessage('assistant', '', 'loan', data);
    }

    async handleTripSearch(intent) {
      const { place, days, pax } = intent.params;

      const response = await fetch(`${this.apiBaseUrl}/travel/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: place, nights: days, guests: pax })
      });

      if (!response.ok) throw new Error('Otel arama başarısız');

      const data = await response.json();
      this.addMessage('assistant', '', 'hotel', data);
    }

    async handleEconomyOptimize(intent) {
      const response = await fetch(`${this.apiBaseUrl}/economy/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marginTarget: 20 })
      });

      if (!response.ok) throw new Error('Fiyat optimizasyonu başarısız');

      const data = await response.json();
      this.addMessage('assistant', '', 'economy', data);
    }

    async handleInsightsTrend(intent) {
      const response = await fetch(`${this.apiBaseUrl}/insights/price-trend?days=30`);

      if (!response.ok) throw new Error('Trend analizi başarısız');

      const data = await response.json();
      this.addMessage('assistant', '', 'insights', data);
    }

    async handleESGCarbon(intent) {
      const response = await fetch(`${this.apiBaseUrl}/esg/calculate-carbon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distance: 450, transportMode: 'road', weight: 2.5 })
      });

      if (!response.ok) throw new Error('Karbon hesaplama başarısız');

      const data = await response.json();
      this.addMessage('assistant', '', 'esg', data);
    }

    addMessage(role, text, cardType = null, cardData = null) {
      const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const message = { id, role, text, cardType, cardData, timestamp: new Date().toISOString() };
      this.messages.push(message);

      const messagesContainer = document.getElementById('intent-messages');
      const messageEl = this.createMessageElement(message);
      messagesContainer.appendChild(messageEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      return id;
    }

    removeMessage(id) {
      this.messages = this.messages.filter(m => m.id !== id);
      const messageEl = document.getElementById(id);
      if (messageEl) messageEl.remove();
    }

    createMessageElement(message) {
      const div = document.createElement('div');
      div.id = message.id;
      div.className = `intent-message intent-message-${message.role}`;

      if (message.text) {
        div.innerHTML = AilydianSanitizer.sanitizeHTML(`<div class="message-text">${this.escapeHtml(message.text)}</div>`;
      }

      if (message.cardType && message.cardData) {
        const card = this.createCard(message.cardType, message.cardData);
        div.appendChild(card);
      }

      return div;
    }

    createCard(cardType, data) {
      const cardFactories = {
        shipment: this.createShipmentCard.bind(this),
        loan: this.createLoanCard.bind(this),
        hotel: this.createHotelCard.bind(this),
        economy: this.createEconomyCard.bind(this),
        insights: this.createInsightsCard.bind(this),
        esg: this.createESGCard.bind(this)
      };

      const factory = cardFactories[cardType];
      return factory ? factory(data) : this.createGenericCard(data);
    }

    createShipmentCard(data) {
      const div = document.createElement('div');
      div.className = 'message-card shipment-card';

      const statusIcons = {
        in_transit: '🚚',
        delivered: '✅',
        pending: '⏳',
        sorting: '📦'
      };

      const statusLabels = {
        in_transit: 'Yolda',
        delivered: 'Teslim Edildi',
        pending: 'Beklemede',
        sorting: 'Dağıtımda'
      };

      div.innerHTML = AilydianSanitizer.sanitizeHTML(`
        <div class="card-header">
          <h3>${statusIcons[data.status] || '📦'} ${data.vendor.toUpperCase()} Kargo Takip</h3>
        </div>
        <div class="card-body">
          <div class="card-field">
            <span class="field-label">Takip No:</span>
            <span class="field-value">${data.trackingNo}</span>
          </div>
          <div class="card-field">
            <span class="field-label">Durum:</span>
            <span class="field-value">${statusLabels[data.status]}</span>
          </div>
          <div class="card-field">
            <span class="field-label">Konum:</span>
            <span class="field-value">${data.currentLocation}</span>
          </div>
          <div class="card-field">
            <span class="field-label">Tahmini Teslimat:</span>
            <span class="field-value">${new Date(data.estimatedDelivery).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>
      `;

      return div;
    }

    createLoanCard(data) {
      const div = document.createElement('div');
      div.className = 'message-card loan-card';

      const bestOffer = data.bestOffer;
      const otherOffers = data.offers.slice(1, 3);

      div.innerHTML = AilydianSanitizer.sanitizeHTML(`
        <div class="card-header">
          <h3>💰 Kredi Karşılaştırma</h3>
        </div>
        <div class="card-body">
          <div class="best-offer">
            <div class="offer-badge">✨ En İyi Teklif</div>
            <h4>${bestOffer.bank}</h4>
            <div class="offer-amount">${this.formatMoney(bestOffer.monthlyPayment)}/ay</div>
            <div class="offer-details">
              <span>Faiz: %${bestOffer.interestRate}</span>
              <span>Toplam: ${this.formatMoney(bestOffer.totalPayment)}</span>
            </div>
          </div>
          ${otherOffers.length > 0 ? `
            <div class="other-offers">
              ${otherOffers.map(offer => `
                <div class="offer-item">
                  <span class="offer-bank">${offer.bank}</span>
                  <span class="offer-monthly">${this.formatMoney(offer.monthlyPayment)}/ay</span>
                  <span class="offer-rate">%${offer.interestRate}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;

      return div;
    }

    createHotelCard(data) {
      const div = document.createElement('div');
      div.className = 'message-card hotel-card';

      const topHotels = data.hotels.slice(0, 3);

      div.innerHTML = AilydianSanitizer.sanitizeHTML(`
        <div class="card-header">
          <h3>✈️ Otel Arama Sonuçları</h3>
          <span class="result-count">${data.totalResults} otel bulundu</span>
        </div>
        <div class="card-body">
          ${topHotels.map(hotel => `
            <div class="hotel-item">
              <div class="hotel-info">
                <h4>${hotel.name}</h4>
                <div class="hotel-rating">${'⭐'.repeat(Math.floor(hotel.rating))} ${hotel.rating}</div>
                <div class="hotel-amenities">${hotel.amenities.slice(0, 3).join(' • ')}</div>
              </div>
              <div class="hotel-price">
                <span class="price-total">${this.formatMoney(hotel.totalPrice)}</span>
                <span class="price-per-night">${this.formatMoney(hotel.pricePerNight)}/gece</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      return div;
    }

    createEconomyCard(data) {
      const div = document.createElement('div');
      div.className = 'message-card economy-card';

      div.innerHTML = AilydianSanitizer.sanitizeHTML(`
        <div class="card-header">
          <h3>📈 Fiyat Optimizasyonu</h3>
        </div>
        <div class="card-body">
          <div class="recommendations">
            ${data.recommendations.map(rec => `
              <div class="recommendation-item">
                <div class="rec-icon">${rec.impact === 'high' ? '🔥' : rec.impact === 'medium' ? '📊' : '💡'}</div>
                <div class="rec-content">
                  <div class="rec-title">${rec.title}</div>
                  <div class="rec-desc">${rec.description}</div>
                  <div class="rec-impact">${rec.expectedIncrease}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      return div;
    }

    createInsightsCard(data) {
      const div = document.createElement('div');
      div.className = 'message-card insights-card';

      div.innerHTML = AilydianSanitizer.sanitizeHTML(`
        <div class="card-header">
          <h3>📊 Fiyat Trend Analizi</h3>
        </div>
        <div class="card-body">
          <div class="trend-summary">
            <div class="trend-direction ${data.analysis.trend}">
              ${data.analysis.trend === 'up' ? '📈' : data.analysis.trend === 'down' ? '📉' : '➡️'}
              ${data.analysis.trend === 'up' ? 'Yükseliş' : data.analysis.trend === 'down' ? 'Düşüş' : 'Stabil'}
            </div>
            <div class="trend-change">${data.analysis.percentageChange > 0 ? '+' : ''}${data.analysis.percentageChange.toFixed(2)}%</div>
          </div>
          <div class="trend-stats">
            <div class="stat-item">
              <span class="stat-label">Ortalama Fiyat</span>
              <span class="stat-value">${this.formatMoney(data.statistics.averagePrice)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">En Düşük</span>
              <span class="stat-value">${this.formatMoney(data.statistics.minPrice)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">En Yüksek</span>
              <span class="stat-value">${this.formatMoney(data.statistics.maxPrice)}</span>
            </div>
          </div>
        </div>
      `;

      return div;
    }

    createESGCard(data) {
      const div = document.createElement('div');
      div.className = 'message-card esg-card';

      div.innerHTML = AilydianSanitizer.sanitizeHTML(`
        <div class="card-header">
          <h3>🌱 Karbon Ayak İzi</h3>
        </div>
        <div class="card-body">
          <div class="carbon-total">
            <span class="carbon-amount">${data.carbonFootprint}</span>
            <span class="carbon-unit">${data.unit}</span>
          </div>
          <div class="carbon-breakdown">
            ${data.breakdown.map(item => `
              <div class="breakdown-item">
                <span class="breakdown-label">${item.source}</span>
                <span class="breakdown-amount">${item.amount} kg</span>
                <span class="breakdown-percentage">${item.percentage}%</span>
              </div>
            `).join('')}
          </div>
          <div class="carbon-impact">
            <div class="impact-item">🌳 ${data.impact.treesNeeded} ağaç gerekli</div>
            <div class="impact-item">🚗 ${data.impact.equivalentKm} km araç eşdeğeri</div>
          </div>
        </div>
      `;

      return div;
    }

    createGenericCard(data) {
      const div = document.createElement('div');
      div.className = 'message-card generic-card';
      div.innerHTML = AilydianSanitizer.sanitizeHTML(`<pre>${JSON.stringify(data, null, 2)}</pre>`;
      return div;
    }

    formatMoney(amount) {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    async sendTelemetry(event, data) {
      try {
        await fetch(`${this.apiBaseUrl}/ui-telemetry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, data })
        });
      } catch (error) {
        console.warn('Telemetry failed:', error);
      }
    }
  }

  // Export to window
  window.IntentChat = IntentChat;

})(window);
