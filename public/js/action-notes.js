// 📝 ACTION NOTES GENERATOR - Kök-neden analizi ve öneriler

/**
 * Generate actionable notes for an incident
 * @param {Object} classifiedIncident - { tag, name, url, code, status, hint }
 * @returns {Object} - { title, steps: string[] }
 */
function generateActionNotes(classifiedIncident) {
  const tag = classifiedIncident.tag;

  const actionMap = {
    'Server5xx': {
      title: '🔴 Backend 5xx Hatası',
      steps: [
        'Son deploy ve config değişikliklerini kontrol et',
        'Uygulama loglarında stack trace ara (p95 artışı var mı?)',
        'Bağımlı upstream servislerin health durumunu doğrula',
        'Auto-rollback mekanizması aktif mi kontrol et'
      ]
    },
    'Client4xx': {
      title: '⚠️ İstek/Erişim Hatası (4xx)',
      steps: [
        'Auth durumunu ve token süresini doğrula',
        'Route/Firewall kısıtlarını (WAF/GeoIP) kontrol et',
        'İstemci tarafı URL/parametre doğruluğunu incele',
        'CORS ve API key konfigürasyonlarını gözden geçir'
      ]
    },
    'RateLimit': {
      title: '⏱️ Rate Limit Aşımı (429)',
      steps: [
        'Rate limit konfigürasyonlarını (burst/steady) gözden geçir',
        'İstemci exponential backoff stratejisi aktif mi kontrol et',
        'Kritik endpoint\'lerde kota yükseltme veya cache ekle',
        'Endpoint bazlı rate limit metriklerini incele'
      ]
    },
    'Auth': {
      title: '🔐 Kimlik Doğrulama Sorunu',
      steps: [
        'IdP/SSO sağlayıcı sağlık durumunu kontrol et',
        'JWT/Session sürelerini ve clock skew\'i doğrula',
        'Yetkilendirme politikalarında son değişiklikleri incele',
        'OAuth refresh token mekanizması çalışıyor mu test et'
      ]
    },
    'Upstream': {
      title: '⬆️ Upstream/Servis Bağımlılığı',
      steps: [
        'Bağımlı servisin /health endpoint\'ini ve error rate grafiğini kontrol et',
        'Ağ gecikmesi ve connection pool sınırlarını gözden geçir',
        'Circuit breaker ve retry politikaları etkin mi doğrula',
        'Fallback/degraded mode stratejisini aktive et'
      ]
    },
    'DNS': {
      title: '🌐 DNS Çözümleme Hatası',
      steps: [
        'A kaydı / CNAME TTL ve authoritative name server\'ları doğrula',
        'Son DNS değişikliklerini ve yayılımı (propagation) kontrol et',
        'Fallback DNS provider\'ları test et (DoH/DoT)',
        'Local DNS cache\'i temizle ve yeniden dene'
      ]
    },
    'Network': {
      title: '📡 Ağ/Timeout Sorunu',
      steps: [
        'Ingress/Firewall kurallarını ve oranlarını incele',
        'TCP timeout, keep-alive ve connection reuse ayarlarını kontrol et',
        'Bölgesel (region) ağ sorunları için monitoring panellerini kontrol et',
        'Load balancer health check\'lerini doğrula'
      ]
    },
    'Redirect': {
      title: '↪️ Yönlendirme (3xx)',
      steps: [
        'Hedef URL ve status kodu doğruluğunu (301 vs 302) doğrula',
        'Zincirli redirect sayısını kontrol et (≥3 ise düzelt)',
        'Cache-Control header\'larını gözden geçir',
        'SEO etkileri için permanent redirect (301) kullanımını değerlendir'
      ]
    },
    'Security': {
      title: '🛡️ Güvenlik/Uyum',
      steps: [
        'WAF/IPS tetiklerini ve kural setini kontrol et',
        'Hassas rotalarda PII redaction ve attestation kayıtlarını doğrula',
        'Olayı ilgili güvenlik runbook\'u ile ilişkilendir',
        'Security incident response team\'i bilgilendir'
      ]
    },
    'Unknown': {
      title: '❓ Sınıflandırılamayan Olay',
      steps: [
        'Raw hata metni ve son changeset\'leri detaylı incele',
        'İlgili servisin p95/p99 latency grafiğini kontrol et',
        'Canary trafiğini düşür ve rollback değerlendir',
        'Incident sınıflandırma kurallarını güncelle'
      ]
    }
  };

  return actionMap[tag] || actionMap['Unknown'];
}

/**
 * Generate HTML for action notes
 * @param {Object} notes - { title, steps }
 * @returns {string} HTML string
 */
function renderActionNotesHTML(notes) {
  const stepsHTML = notes.steps
    .map(step => `<li>${step}</li>`)
    .join('');

  return `
    <div class="action-notes">
      <div class="action-notes-title">${notes.title}</div>
      <ul class="action-notes-steps">
        ${stepsHTML}
      </ul>
    </div>
  `;
}

/**
 * Get severity level for incident
 * @param {Object} incident
 * @returns {string} - 'critical' | 'warning' | 'info'
 */
function getIncidentSeverity(incident) {
  if (incident.status === 'down') return 'critical';
  if (incident.status === 'warn') return 'warning';
  return 'info';
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateActionNotes,
    renderActionNotesHTML,
    getIncidentSeverity
  };
}
