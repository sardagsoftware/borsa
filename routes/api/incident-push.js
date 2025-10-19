// 📤 INCIDENT PUSH API - Slack & Jira entegrasyonu

const express = require('express');
const router = express.Router();

/**
 * Push incident to Slack
 * @param {Object} incident
 * @returns {Promise<Object>}
 */
async function pushToSlack(incident) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return { ok: false, reason: 'SLACK_WEBHOOK_URL not configured' };
  }

  try {
    const text = `*[${incident.tag}]* ${incident.name} — ${incident.url}\n` +
                 `Status: ${incident.status} (HTTP ${incident.code})\n` +
                 `Time: ${new Date(incident.ts).toLocaleString()}\n` +
                 (incident.hint ? `Hint: ${incident.hint}\n` : '') +
                 (incident.note ? `\n*${incident.note.title}*\n• ${incident.note.steps.join('\n• ')}` : '');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    return {
      ok: response.ok,
      status: response.status
    };
  } catch (error) {
    console.error('Slack push error:', error);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Create Jira issue
 * @param {Object} incident
 * @returns {Promise<Object>}
 */
async function createJiraIssue(incident) {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY || 'AID';

  if (!baseUrl || !email || !apiToken) {
    return { ok: false, reason: 'Jira ENV variables not configured' };
  }

  try {
    const summary = `[${incident.tag}] ${incident.name} — HTTP ${incident.code}`;

    const description = `URL: ${incident.url}\n` +
                       `Status: ${incident.status} (HTTP ${incident.code})\n` +
                       `Time: ${new Date(incident.ts).toISOString()}\n` +
                       (incident.hint ? `Hint: ${incident.hint}\n` : '') +
                       (incident.note ? `\n${incident.note.title}\n- ${incident.note.steps.join('\n- ')}` : '');

    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        fields: {
          project: { key: projectKey },
          summary,
          description,
          issuetype: { name: 'Bug' },
          labels: ['status-incident', incident.tag.toLowerCase()]
        }
      })
    });

    const result = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      key: result.key || '?',
      id: result.id
    };
  } catch (error) {
    console.error('Jira creation error:', error);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * @route   POST /api/incident-push
 * @desc    Push incident to Slack and/or Jira
 * @body    { single incident } | { bulk: [incidents] }
 * @access  Public (should be protected in production)
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    // Bulk push
    if (body.bulk && Array.isArray(body.bulk)) {
      const results = [];

      for (const incident of body.bulk) {
        const [slack, jira] = await Promise.all([
          pushToSlack(incident),
          createJiraIssue(incident)
        ]);

        results.push({
          url: incident.url,
          slack,
          jira
        });
      }

      return res.json({
        ok: true,
        bulk: true,
        count: results.length,
        results
      });
    }

    // Single push
    const incident = body;
    const [slack, jira] = await Promise.all([
      pushToSlack(incident),
      createJiraIssue(incident)
    ]);

    res.json({
      ok: slack.ok || jira.ok,
      slack,
      jira
    });

  } catch (error) {
    console.error('Incident push API error:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
