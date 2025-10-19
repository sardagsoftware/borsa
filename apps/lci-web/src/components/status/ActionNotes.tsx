'use client';

// 📝 ACTION NOTES COMPONENT - Root cause analysis and troubleshooting steps
// Turkish language support for LCI platform

import type { ClassifiedIncident, IncidentTag, ActionNote } from '@/types/health';
import { getTagEmoji } from './IncidentClassifier';

/**
 * Generate actionable notes for incident
 */
export function generateActionNotes(incident: ClassifiedIncident): ActionNote {
  const actionMap: Record<IncidentTag, ActionNote> = {
    Server5xx: {
      title: '🔴 Backend 5xx Hatası',
      steps: [
        'Son deploy ve config değişikliklerini kontrol et',
        'Uygulama loglarında stack trace ara (p95 artışı var mı?)',
        'Bağımlı upstream servislerin health durumunu doğrula',
        'Auto-rollback mekanizması aktif mi kontrol et',
      ],
    },
    Client4xx: {
      title: '⚠️ İstek/Erişim Hatası (4xx)',
      steps: [
        'Auth durumunu ve token süresini doğrula',
        'Route/Firewall kısıtlarını (WAF/GeoIP) kontrol et',
        'İstemci tarafı URL/parametre doğruluğunu incele',
        'CORS ve API key konfigürasyonlarını gözden geçir',
      ],
    },
    RateLimit: {
      title: '⏱️ Rate Limit Aşımı (429)',
      steps: [
        'Rate limit konfigürasyonlarını (burst/steady) gözden geçir',
        'İstemci exponential backoff stratejisi aktif mi kontrol et',
        'Kritik endpoint\'lerde kota yükseltme veya cache ekle',
        'Endpoint bazlı rate limit metriklerini incele',
      ],
    },
    Auth: {
      title: '🔐 Kimlik Doğrulama Sorunu',
      steps: [
        'IdP/SSO sağlayıcı sağlık durumunu kontrol et',
        'JWT/Session sürelerini ve clock skew\'i doğrula',
        'Yetkilendirme politikalarında son değişiklikleri incele',
        'OAuth refresh token mekanizması çalışıyor mu test et',
      ],
    },
    Upstream: {
      title: '⬆️ Upstream/Servis Bağımlılığı',
      steps: [
        'Bağımlı servisin /health endpoint\'ini ve error rate grafiğini kontrol et',
        'Ağ gecikmesi ve connection pool sınırlarını gözden geçir',
        'Circuit breaker ve retry politikaları etkin mi doğrula',
        'Fallback/degraded mode stratejisini aktive et',
      ],
    },
    DNS: {
      title: '🌐 DNS Çözümleme Hatası',
      steps: [
        'A kaydı / CNAME TTL ve authoritative name server\'ları doğrula',
        'Son DNS değişikliklerini ve yayılımı (propagation) kontrol et',
        'Fallback DNS provider\'ları test et (DoH/DoT)',
        'Local DNS cache\'i temizle ve yeniden dene',
      ],
    },
    Network: {
      title: '📡 Ağ/Timeout Sorunu',
      steps: [
        'Ingress/Firewall kurallarını ve oranlarını incele',
        'TCP timeout, keep-alive ve connection reuse ayarlarını kontrol et',
        'Bölgesel (region) ağ sorunları için monitoring panellerini kontrol et',
        'Load balancer health check\'lerini doğrula',
      ],
    },
    Redirect: {
      title: '↪️ Yönlendirme (3xx)',
      steps: [
        'Hedef URL ve status kodu doğruluğunu (301 vs 302) doğrula',
        'Zincirli redirect sayısını kontrol et (≥3 ise düzelt)',
        'Cache-Control header\'larını gözden geçir',
        'SEO etkileri için permanent redirect (301) kullanımını değerlendir',
      ],
    },
    Security: {
      title: '🛡️ Güvenlik/Uyum',
      steps: [
        'WAF/IPS tetiklerini ve kural setini kontrol et',
        'Hassas rotalarda PII redaction ve attestation kayıtlarını doğrula',
        'Olayı ilgili güvenlik runbook\'u ile ilişkilendir',
        'Security incident response team\'i bilgilendir',
      ],
    },
    Unknown: {
      title: '❓ Sınıflandırılamayan Olay',
      steps: [
        'Raw hata metni ve son changeset\'leri detaylı incele',
        'İlgili servisin p95/p99 latency grafiğini kontrol et',
        'Canary trafiğini düşür ve rollback değerlendir',
        'Incident sınıflandırma kurallarını güncelle',
      ],
    },
  };

  return actionMap[incident.tag];
}

/**
 * Action Notes Component
 */
interface ActionNotesProps {
  incident: ClassifiedIncident;
  className?: string;
}

export default function ActionNotes({ incident, className = '' }: ActionNotesProps) {
  const notes = generateActionNotes(incident);
  const emoji = getTagEmoji(incident.tag);

  return (
    <div
      className={`rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 ${className}`}
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{emoji}</span>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {notes.title}
        </h3>
      </div>

      {/* Steps */}
      <ul className="space-y-2">
        {notes.steps.map((step, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
          >
            <span className="text-violet-500 font-bold mt-0.5">•</span>
            <span>{step}</span>
          </li>
        ))}
      </ul>

      {/* Incident Details */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500">Target:</span>
            <span className="ml-2 font-medium text-slate-900 dark:text-white">
              {incident.name}
            </span>
          </div>
          <div>
            <span className="text-slate-500">HTTP:</span>
            <span className="ml-2 font-medium text-slate-900 dark:text-white">
              {incident.code}
            </span>
          </div>
          <div>
            <span className="text-slate-500">URL:</span>
            <span className="ml-2 font-mono text-slate-700 dark:text-slate-300 truncate">
              {incident.url}
            </span>
          </div>
          {incident.hint && (
            <div className="col-span-2">
              <span className="text-slate-500">Hint:</span>
              <span className="ml-2 text-slate-700 dark:text-slate-300">
                {incident.hint}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Action Notes - One-liner for tables
 */
interface CompactActionNotesProps {
  incident: ClassifiedIncident;
  className?: string;
}

export function CompactActionNotes({
  incident,
  className = '',
}: CompactActionNotesProps) {
  const notes = generateActionNotes(incident);

  return (
    <div className={`text-xs text-slate-600 dark:text-slate-400 ${className}`}>
      <div className="font-medium mb-1">{notes.title}</div>
      <div className="opacity-75">{notes.steps[0]}</div>
    </div>
  );
}
