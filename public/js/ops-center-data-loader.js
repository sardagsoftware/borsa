/**
 * AI Ops Center Data Loader
 * Gerçek verilerle dinamik veri yükleme ve render
 */

class OpsDataLoader {
  constructor() {
    this.api = new OpsCenterAPI();
    this.loadedSections = new Set();
  }

  /**
   * Loading göster
   */
  showLoading(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const loadingHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p style="margin-top: 1rem; color: #6b7280;">Veriler yükleniyor...</p>
      </div>
    `;

    // İlk container'ı bul (metric-cards veya table parent)
    const container = section.querySelector('.metric-cards, .data-table')?.parentElement;
    if (container) {
      container.innerHTML = loadingHTML;
    }
  }

  /**
   * Hata göster
   */
  showError(sectionId, error) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const errorHTML = `
      <div class="error-message">
        <h4>Veri Yüklenemedi</h4>
        <p>${error.message || 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.'}</p>
        <button onclick="window.opsLoader.loadSection('${sectionId}')"
                style="margin-top: 1rem; padding: 0.5rem 1rem; background: #10A37F; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Tekrar Dene
        </button>
      </div>
    `;

    const container = section.querySelector('.metric-cards, .data-table')?.parentElement;
    if (container) {
      container.innerHTML = errorHTML;
    }
  }

  /**
   * Benchmarks render
   */
  renderBenchmarks(data) {
    const section = document.getElementById('benchmarks');
    if (!section || !data) return;

    // Metric cards
    const metrics = data.metrics;
    const metricsHTML = metrics.map(m => `
      <div class="metric-card">
        <div class="label">${m.name}</div>
        <div class="value">${m.score.toFixed(3)}</div>
        <div class="subtext">Sıra: #${m.rank} / ${m.total_models}</div>
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: ${m.score * 100}%"></div>
        </div>
      </div>
    `).join('');

    // Table
    const tableHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>MMLU-TR</th>
            <th>Belebele</th>
            <th>XNLI</th>
            <th>HumanEval</th>
            <th>Ortalama</th>
          </tr>
        </thead>
        <tbody>
          ${data.models.map(m => `
            <tr>
              <td class="model-name">${m.name}</td>
              <td><span class="score ${this.getScoreClass(m.scores.mmlu)}">${m.scores.mmlu.toFixed(3)}</span></td>
              <td><span class="score ${this.getScoreClass(m.scores.belebele)}">${m.scores.belebele.toFixed(3)}</span></td>
              <td><span class="score ${this.getScoreClass(m.scores.xnli)}">${m.scores.xnli.toFixed(3)}</span></td>
              <td><span class="score ${this.getScoreClass(m.scores.humaneval)}">${m.scores.humaneval.toFixed(3)}</span></td>
              <td><span class="score ${this.getScoreClass(m.scores.average)}">${m.scores.average.toFixed(3)}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280;">
        ${data.disclaimer}
      </p>
    `;

    // Container'ı bul ve güncelle
    const metricsContainer = section.querySelector('.metric-cards');
    if (metricsContainer) {
      metricsContainer.outerHTML = `<div class="metric-cards">${metricsHTML}</div>`;
    }

    const tableContainer = section.querySelector('.data-table')?.parentElement;
    if (tableContainer) {
      tableContainer.innerHTML = tableHTML;
    }
  }

  /**
   * Costs render
   */
  renderCosts(data) {
    const section = document.getElementById('costs');
    if (!section || !data) return;

    // Metric cards
    const summary = data.summary;
    const metricsHTML = `
      <div class="metric-card">
        <div class="label">Aylık Toplam Maliyet</div>
        <div class="value">$${summary.total_cost}</div>
        <div class="subtext">%${summary.cost_savings_percent} tasarruf</div>
      </div>
      <div class="metric-card">
        <div class="label">1M Token Başına</div>
        <div class="value">$${summary.cost_per_1m_tokens.toFixed(2)}</div>
        <div class="subtext">Giriş+Çıkış</div>
      </div>
      <div class="metric-card">
        <div class="label">P95 Gecikme</div>
        <div class="value">${summary.p95_latency_ms}ms</div>
        <div class="subtext">İlk token</div>
      </div>
      <div class="metric-card">
        <div class="label">GPU Kullanımı</div>
        <div class="value">${summary.gpu_utilization}%</div>
        <div class="subtext">${data.infrastructure.gpu_type}</div>
      </div>
    `;

    // Table
    const tableHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Giriş (1M)</th>
            <th>Çıkış (1M)</th>
            <th>Gecikme P50</th>
            <th>Gecikme P95</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          ${data.models.map(m => `
            <tr>
              <td class="model-name">${m.name}</td>
              <td>$${m.costs.input_per_1m.toFixed(2)}</td>
              <td>$${m.costs.output_per_1m.toFixed(2)}</td>
              <td>${m.latency.p50_ms}ms</td>
              <td>${m.latency.p95_ms}ms</td>
              <td><span class="badge ${this.getStatusBadge(m.status)}">${this.getStatusText(m.status)}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Update
    const metricsContainer = section.querySelector('.metric-cards');
    if (metricsContainer) {
      metricsContainer.outerHTML = `<div class="metric-cards">${metricsHTML}</div>`;
    }

    const tableContainer = section.querySelector('.data-table')?.parentElement;
    if (tableContainer) {
      tableContainer.innerHTML = tableHTML;
    }
  }

  /**
   * Trainer render (daha kısa, fikir vermek için)
   */
  renderTrainer(data) {
    // Benzer şekilde render et
    console.log('✓ Trainer data loaded:', data);
  }

  /**
   * Ownership render
   */
  renderOwnership(data) {
    console.log('✓ Ownership data loaded:', data);
  }

  /**
   * Compliance render
   */
  renderCompliance(data) {
    console.log('✓ Compliance data loaded:', data);
  }

  /**
   * Helper: Score class
   */
  getScoreClass(score) {
    if (score >= 0.75) return 'high';
    if (score >= 0.65) return 'medium';
    return 'low';
  }

  /**
   * Helper: Status badge
   */
  getStatusBadge(status) {
    const map = {
      'active': 'success',
      'fallback': 'info',
      'testing': 'warning',
      'inactive': 'error'
    };
    return map[status] || 'info';
  }

  /**
   * Helper: Status text
   */
  getStatusText(status) {
    const map = {
      'active': 'Aktif',
      'fallback': 'Yedek',
      'testing': 'Test',
      'inactive': 'Pasif'
    };
    return map[status] || status;
  }

  /**
   * Tek bir section yükle
   */
  async loadSection(sectionId) {
    if (this.loadedSections.has(sectionId)) {
      console.log(`✓ Section already loaded: ${sectionId}`);
      return;
    }

    try {
      this.showLoading(sectionId);

      let data;
      switch(sectionId) {
        case 'benchmarks':
          const benchRes = await this.api.getBenchmarks();
          data = benchRes.data;
          this.renderBenchmarks(data);
          break;

        case 'costs':
          const costsRes = await this.api.getCosts();
          data = costsRes.data;
          this.renderCosts(data);
          break;

        case 'trainer':
          const trainerRes = await this.api.getTrainer();
          data = trainerRes.data;
          this.renderTrainer(data);
          break;

        case 'ownership':
          const ownerRes = await this.api.getOwnership();
          data = ownerRes.data;
          this.renderOwnership(data);
          break;

        case 'compliance':
          const compRes = await this.api.getCompliance();
          data = compRes.data;
          this.renderCompliance(data);
          break;
      }

      this.loadedSections.add(sectionId);
      console.log(`✓ Section loaded successfully: ${sectionId}`);

    } catch (error) {
      console.error(`✗ Failed to load section: ${sectionId}`, error);
      this.showError(sectionId, error);
    }
  }

  /**
   * Tüm section'ları yükle
   */
  async loadAll() {
    const sections = ['benchmarks', 'costs', 'trainer', 'ownership', 'compliance'];

    for (const section of sections) {
      await this.loadSection(section);
    }
  }

  /**
   * Lazy loading: Scroll olunca yükle
   */
  setupLazyLoading() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          this.loadSection(sectionId);
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '100px' // 100px önce yükle
    });

    // Tüm section'ları gözle
    ['benchmarks', 'costs', 'trainer', 'ownership', 'compliance'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });
  }
}

// Global instance
window.opsLoader = new OpsDataLoader();
