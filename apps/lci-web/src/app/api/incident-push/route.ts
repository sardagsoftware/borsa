// 📤 INCIDENT PUSH API - Slack & Jira integration (Next.js App Router)
// Push incidents to external systems for alerting

import { NextResponse } from 'next/server';
import type { ClassifiedIncident, ActionNote } from '@/types/health';

interface IncidentPayload extends ClassifiedIncident {
  ts: number;
  note?: ActionNote;
}

/**
 * Push incident to Slack
 */
async function pushToSlack(incident: IncidentPayload): Promise<{
  ok: boolean;
  status?: number;
  reason?: string;
  error?: string;
}> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return { ok: false, reason: 'SLACK_WEBHOOK_URL not configured' };
  }

  try {
    const text =
      `*[${incident.tag}]* ${incident.name} — ${incident.url}\n` +
      `Status: ${incident.status} (HTTP ${incident.code})\n` +
      `Time: ${new Date(incident.ts).toLocaleString()}\n` +
      (incident.hint ? `Hint: ${incident.hint}\n` : '') +
      (incident.note
        ? `\n*${incident.note.title}*\n• ${incident.note.steps.join('\n• ')}`
        : '');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    return {
      ok: response.ok,
      status: response.status,
    };
  } catch (error) {
    console.error('Slack push error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create Jira issue
 */
async function createJiraIssue(incident: IncidentPayload): Promise<{
  ok: boolean;
  status?: number;
  key?: string;
  id?: string;
  reason?: string;
  error?: string;
}> {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY || 'AID';

  if (!baseUrl || !email || !apiToken) {
    return { ok: false, reason: 'Jira ENV variables not configured' };
  }

  try {
    const summary = `[${incident.tag}] ${incident.name} — HTTP ${incident.code}`;

    const description =
      `URL: ${incident.url}\n` +
      `Status: ${incident.status} (HTTP ${incident.code})\n` +
      `Time: ${new Date(incident.ts).toISOString()}\n` +
      (incident.hint ? `Hint: ${incident.hint}\n` : '') +
      (incident.note
        ? `\n${incident.note.title}\n- ${incident.note.steps.join('\n- ')}`
        : '');

    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        fields: {
          project: { key: projectKey },
          summary,
          description,
          issuetype: { name: 'Bug' },
          labels: ['status-incident', incident.tag.toLowerCase()],
        },
      }),
    });

    const result = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      key: result.key || '?',
      id: result.id,
    };
  } catch (error) {
    console.error('Jira creation error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * POST /api/incident-push
 * Push single incident or bulk incidents
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Bulk push
    if (body.bulk && Array.isArray(body.bulk)) {
      const results = [];

      for (const incident of body.bulk) {
        const [slack, jira] = await Promise.all([
          pushToSlack(incident),
          createJiraIssue(incident),
        ]);

        results.push({
          url: incident.url,
          slack,
          jira,
        });
      }

      return NextResponse.json({
        ok: true,
        bulk: true,
        count: results.length,
        results,
      });
    }

    // Single push
    const incident = body as IncidentPayload;
    const [slack, jira] = await Promise.all([
      pushToSlack(incident),
      createJiraIssue(incident),
    ]);

    return NextResponse.json({
      ok: slack.ok || jira.ok,
      slack,
      jira,
    });
  } catch (error) {
    console.error('Incident push API error:', error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/incident-push - CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
