import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

type IncidentInput = {
  name: string;
  code: number;
  ms: number;
  status: 'up' | 'warn' | 'down';
  err?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body: IncidentInput = await req.json();

    const triagePath = path.join(process.cwd(), 'public/data/triage.json');
    const triage = JSON.parse(fs.readFileSync(triagePath, 'utf-8'));

    // Classify incident
    const tag = classifyIncident(body);

    // Determine severity
    let sev = triage.defaults.sev;
    let rollback = triage.defaults.rollback;

    if (triage.byTag[tag]) {
      sev = triage.byTag[tag].sev;
      rollback = triage.byTag[tag].rollback;
    }

    // Override based on thresholds
    if (body.status === 'down') {
      if (body.ms > triage.thresholds.p95_ms.sev1) {
        sev = 1;
      } else if (body.ms > triage.thresholds.p95_ms.sev2) {
        sev = 2;
      }
    }

    return NextResponse.json({
      tag,
      sev,
      rollback,
      message: generateMessage(body, tag),
      actionNote: getActionNote(tag)
    });
  } catch (error) {
    console.error('Triage apply failed:', error);
    return NextResponse.json(
      { error: 'Triage apply failed' },
      { status: 500 }
    );
  }
}

function classifyIncident(incident: IncidentInput): string {
  const { code, err } = incident;

  if (err?.toLowerCase().includes('dns') || err?.toLowerCase().includes('enotfound')) {
    return 'DNS';
  }
  if (code === 401 || code === 403 || err?.toLowerCase().includes('auth')) {
    return 'Auth';
  }
  if (code === 502 || code === 503 || code === 504) {
    return 'Upstream';
  }
  if (code === 429) {
    return 'RateLimit';
  }
  if (err?.toLowerCase().includes('network') || err?.toLowerCase().includes('timeout')) {
    return 'Network';
  }
  if (code === 301 || code === 302 || code === 307 || code === 308) {
    return 'Redirect';
  }
  if (code >= 400 && code < 500) {
    return 'Client4xx';
  }
  if (code >= 500) {
    return 'Server5xx';
  }
  if (err?.toLowerCase().includes('security') || err?.toLowerCase().includes('ssl')) {
    return 'Security';
  }

  return 'Unknown';
}

function generateMessage(incident: IncidentInput, tag: string): string {
  return `${incident.name} - ${tag} issue detected (${incident.code}, ${incident.ms}ms)`;
}

function getActionNote(tag: string): string {
  const notes: Record<string, string> = {
    DNS: '1) DNS kayıtlarını kontrol et\n2) Name server\'ları doğrula\n3) Cache temizle',
    Auth: '1) API key/token geçerliliğini kontrol et\n2) Permissions doğrula\n3) SSO entegrasyonunu test et',
    Upstream: '1) Upstream service health check\n2) Connection pool ayarları\n3) Circuit breaker durumu',
    RateLimit: '1) Rate limit threshold artır\n2) Client throttling ekle\n3) Caching stratejisi',
    Network: '1) Network connectivity test\n2) Firewall rules kontrol\n3) Latency analizi',
    Redirect: '1) Redirect chain kontrol\n2) SSL/TLS sertifika\n3) HSTS headers',
    Client4xx: '1) Request validation\n2) Client error logging\n3) API versiyonu',
    Server5xx: '1) Server logs\n2) Resource kullanımı (CPU/RAM)\n3) Rollback düşün',
    Security: '1) Security logs inceле\n2) SSL/TLS yapılandırma\n3) Firewall rules',
    Unknown: '1) Error logs detaylı incele\n2) Monitoring dashboard\n3) Oncall ekibe escalate'
  };

  return notes[tag] || notes.Unknown;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
