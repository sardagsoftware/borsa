#!/usr/bin/env node
/**
 * Z.AI destekli otomasyon betiği.
 * - Konfigürasyon: config/zai-monitor.config.json
 * - Komut çıktıları toplanır, maskeleme uygulanır, JSON rapora yazılır.
 * - Z_AI_API_KEY tanımlıysa GLM-4.6'dan özet istenir.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { OpenAI } = require('openai');
require('dotenv').config({
  path: [
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env')
  ].find((p) => fs.existsSync(p))
});

const projectRoot = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(projectRoot, 'config', 'zai-monitor.config.json');

function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Konfigürasyon dosyası bulunamadı: ${CONFIG_PATH}`);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

function sanitizeOutput(output, patterns = []) {
  if (!output) return output;
  return patterns.reduce((acc, pattern) => {
    try {
      const regex = new RegExp(pattern, 'gi');
      return acc.replace(regex, '[MASKED]');
    } catch (error) {
      console.warn(`Geçersiz regex: ${pattern}`, error.message);
      return acc;
    }
  }, output);
}

async function runCommand({ name, cmd, args = [], cwd = '.', critical = false }, maskPatterns) {
  const start = Date.now();
  const fullCwd = path.resolve(projectRoot, cwd);

  console.log(`\n▶️  ${name}: ${cmd} ${args.join(' ')}`);

  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: fullCwd,
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        FORCE_COLOR: '1'
      }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => {
      const durationMs = Date.now() - start;
      const status = code === 0 ? 'success' : 'failed';
      console.log(`⏱️  ${name} bitti - durum: ${status}, süre: ${durationMs}ms`);

      resolve({
        name,
        cmd: `${cmd} ${args.join(' ')}`,
        cwd: fullCwd,
        exitCode: code,
        durationMs,
        critical,
        status,
        stdout: sanitizeOutput(stdout, maskPatterns),
        stderr: sanitizeOutput(stderr, maskPatterns)
      });
    });
  });
}

function buildPrompt(config, commandResults, maxChars = 4000) {
  const parts = commandResults.map((result) => {
    const snippet = `${result.name} (${result.status}, exit: ${result.exitCode})\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`;
    return snippet.length > maxChars
      ? snippet.slice(0, maxChars) + '\n... (kısaltıldı)'
      : snippet;
  });

  const body = parts.join('\n\n---\n\n');
  const trimmed = body.length > maxChars ? body.slice(0, maxChars) + '\n... (toplam çıktı kısaltıldı)' : body;

  return [
    {
      role: 'system',
      content: 'Sen Ailydian Ultra Pro için kalite kontrol danışmanısın. Hataları, regresyonları ve düzeltme önerilerini tespit et.'
    },
    {
      role: 'user',
      content: `${config.promptTemplate}\n\nKomut sonuçları:\n${trimmed}`
    }
  ];
}

async function requestZaiSummary(config, commandResults) {
  const apiKey = process.env.Z_AI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  Z_AI_API_KEY tanımlı değil; Z.AI özeti atlanıyor.');
    return null;
  }

  const baseURL = process.env.Z_AI_BASE_URL || 'https://api.z.ai/api/paas/v4';
  const client = new OpenAI({ apiKey, baseURL });

  try {
    const messages = buildPrompt(config, commandResults, config.maxPromptChars || 6000);
    const completion = await client.chat.completions.create({
      model: 'glm-4.6',
      messages,
      temperature: 0.4,
      max_tokens: 800
    });

    const choice = completion.choices[0];
    return {
      content: choice.message?.content ?? '',
      model: completion.model,
      usage: completion.usage
    };
  } catch (error) {
    console.error('❌ Z.AI özet isteği başarısız:', error.response?.data || error.message);
    return {
      error: error.message
    };
  }
}

function ensureReportDir(dirRelative) {
  const dir = path.resolve(projectRoot, dirRelative);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

async function maybeSendWebhook(config, payload) {
  const { webhook } = config;
  if (!webhook?.enabled || !webhook.url) {
    return;
  }

  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhook.headers || {})
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn(`⚠️  Webhook isteği başarısız: ${res.status}`);
    }
  } catch (error) {
    console.warn('⚠️  Webhook gönderimi başarısız:', error.message);
  }
}

async function main() {
  try {
    const config = readConfig();
    const results = [];

    for (const command of config.commands) {
      const result = await runCommand(command, config.maskPatterns || []);
      results.push(result);
      if (result.exitCode !== 0 && command.critical) {
        console.log(`❌ Kritik komut başarısız (${command.name}); kalan komutlar atlanacak.`);
        break;
      }
    }

    const zaiSummary = await requestZaiSummary(config, results);
    const reportDir = ensureReportDir(config.reportDir || 'logs/zai-monitor');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `report-${timestamp}.json`);

    const report = {
      generatedAt: new Date().toISOString(),
      commands: results,
      zaiSummary,
      environment: {
        node: process.version,
        cwd: projectRoot
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`\n📝 Rapor kaydedildi: ${reportPath}`);

    await maybeSendWebhook(config, report);

    const hasFailure = results.some((r) => r.exitCode !== 0 && (r.critical || r.status === 'failed'));
    process.exitCode = hasFailure ? 1 : 0;
  } catch (error) {
    console.error('❌ zai-monitor çalışması başarısız:', error.message);
    process.exitCode = 1;
  }
}

main();
