#!/usr/bin/env node

/**
 * 🌍 LyDian i18n CLI Tool v2.0
 *
 * Unified CLI interface for all i18n operations
 *
 * Commands:
 *   lydian-i18n extract [--file=path] [--all]
 *   lydian-i18n translate --lang=en [--category=cta]
 *   lydian-i18n translate --lang=all
 *   lydian-i18n validate --lang=en [--category=cta]
 *   lydian-i18n validate --lang=all
 *   lydian-i18n sync
 *   lydian-i18n status
 *   lydian-i18n init
 *
 * @author LyDian AI Platform
 * @license MIT
 * @version 2.0.0
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================
// CONFIGURATION
// ============================

const CONFIG = {
    toolsDir: path.join(__dirname),
    i18nDir: path.join(__dirname, '../../public/i18n/v2'),
    opsDir: path.join(__dirname, '../i18n'),
    supportedLanguages: ['tr', 'en', 'de', 'fr', 'es', 'ar', 'ru', 'it', 'ja', 'zh-CN'],
};

// ============================
// CLI COLORS
// ============================

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
};

function log(message, color = 'white') {
    console.log(colors[color] + message + colors.reset);
}

// ============================
// COMMAND HANDLERS
// ============================

async function handleExtract(args) {
    log('🔍 Extracting i18n strings...', 'cyan');

    const extractScript = path.join(CONFIG.toolsDir, 'extract-i18n-strings.js');
    const cmdArgs = args.slice(1); // Remove 'extract' command

    return runScript(extractScript, cmdArgs);
}

async function handleTranslate(args) {
    const langArg = args.find(arg => arg.startsWith('--lang='));

    if (!langArg) {
        log('❌ Error: --lang parameter required', 'red');
        log('Usage: lydian-i18n translate --lang=en', 'yellow');
        log('       lydian-i18n translate --lang=all', 'yellow');
        process.exit(1);
    }

    const lang = langArg.split('=')[1];

    if (lang !== 'all' && !CONFIG.supportedLanguages.includes(lang)) {
        log(`❌ Error: Unsupported language: ${lang}`, 'red');
        log(`Supported: ${CONFIG.supportedLanguages.join(', ')}`, 'yellow');
        process.exit(1);
    }

    log(`🌍 Translating to ${lang}...`, 'cyan');

    const translateScript = path.join(CONFIG.toolsDir, 'translate-pipeline.js');
    const cmdArgs = args.slice(1); // Remove 'translate' command

    return runScript(translateScript, cmdArgs);
}

async function handleValidate(args) {
    const langArg = args.find(arg => arg.startsWith('--lang='));

    if (!langArg) {
        log('❌ Error: --lang parameter required', 'red');
        log('Usage: lydian-i18n validate --lang=en', 'yellow');
        log('       lydian-i18n validate --lang=all', 'yellow');
        process.exit(1);
    }

    const lang = langArg.split('=')[1];

    if (lang !== 'all' && !CONFIG.supportedLanguages.includes(lang)) {
        log(`❌ Error: Unsupported language: ${lang}`, 'red');
        log(`Supported: ${CONFIG.supportedLanguages.join(', ')}`, 'yellow');
        process.exit(1);
    }

    log(`📝 Validating ${lang} translations...`, 'cyan');

    const qaScript = path.join(CONFIG.toolsDir, 'grammar-qa.js');
    const cmdArgs = args.slice(1); // Remove 'validate' command

    return runScript(qaScript, cmdArgs);
}

async function handleSync() {
    log('🔄 Syncing translation memory...', 'cyan');

    // Check if translation memory exists
    const tmPath = path.join(CONFIG.opsDir, 'translation-memory.json');

    if (!fs.existsSync(tmPath)) {
        log('⚠️  Translation memory not found. Nothing to sync.', 'yellow');
        return;
    }

    const tm = JSON.parse(fs.readFileSync(tmPath, 'utf-8'));
    const segmentCount = Object.keys(tm.segments || {}).length;

    log(`✅ Translation Memory: ${segmentCount} segments`, 'green');
    log(`   Last updated: ${tm.lastUpdated || 'Unknown'}`, 'white');
    log(`   Quality threshold: ${(tm.metadata?.qualityThreshold || 0.9) * 100}%`, 'white');
}

async function handleStatus() {
    log('📊 i18n System Status', 'cyan');
    log('='.repeat(60), 'white');

    // Check translation files
    const languages = CONFIG.supportedLanguages;
    const statusTable = [];

    for (const lang of languages) {
        const langDir = path.join(CONFIG.i18nDir, lang);

        if (!fs.existsSync(langDir)) {
            statusTable.push({ lang, status: '❌ Missing', files: 0, keys: 0 });
            continue;
        }

        const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

        // Load index.json to count keys
        const indexPath = path.join(langDir, 'index.json');
        let keyCount = 0;

        if (fs.existsSync(indexPath)) {
            try {
                const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
                keyCount = Object.keys(index).length;
            } catch (e) {
                // Ignore parse errors
            }
        }

        statusTable.push({
            lang,
            status: files.length > 0 ? '✅ Ready' : '⚠️  Incomplete',
            files: files.length,
            keys: keyCount
        });
    }

    // Print status table
    console.log('');
    console.log('Language | Status        | Files | Keys ');
    console.log('-'.repeat(60));

    for (const row of statusTable) {
        const langPadded = row.lang.padEnd(8);
        const statusPadded = row.status.padEnd(13);
        const filesPadded = String(row.files).padEnd(5);
        const keysPadded = String(row.keys).padEnd(5);
        console.log(`${langPadded} | ${statusPadded} | ${filesPadded} | ${keysPadded}`);
    }

    console.log('');
    console.log('='.repeat(60));

    // Check tools
    log('\n🔧 Tools Status:', 'cyan');
    const tools = [
        'extract-i18n-strings.js',
        'translate-pipeline.js',
        'grammar-qa.js'
    ];

    for (const tool of tools) {
        const toolPath = path.join(CONFIG.toolsDir, tool);
        const exists = fs.existsSync(toolPath);
        const status = exists ? '✅' : '❌';
        log(`   ${status} ${tool}`, exists ? 'green' : 'red');
    }

    // Check infrastructure
    log('\n📁 Infrastructure:', 'cyan');
    const infra = [
        { name: 'glossary.json', path: path.join(CONFIG.opsDir, 'glossary.json') },
        { name: 'translation-memory.json', path: path.join(CONFIG.opsDir, 'translation-memory.json') },
    ];

    for (const item of infra) {
        const exists = fs.existsSync(item.path);
        const status = exists ? '✅' : '❌';
        log(`   ${status} ${item.name}`, exists ? 'green' : 'red');
    }

    log('\n' + '='.repeat(60), 'white');
}

async function handleInit() {
    log('🚀 Initializing i18n system...', 'cyan');
    log('', 'white');

    // 1. Check if ops directories exist
    const opsI18nDir = CONFIG.opsDir;
    const opsToolsDir = CONFIG.toolsDir;
    const publicI18nDir = CONFIG.i18nDir;

    if (!fs.existsSync(opsI18nDir)) {
        fs.mkdirSync(opsI18nDir, { recursive: true });
        log('✅ Created ops/i18n/', 'green');
    }

    if (!fs.existsSync(opsToolsDir)) {
        fs.mkdirSync(opsToolsDir, { recursive: true });
        log('✅ Created ops/tools/', 'green');
    }

    if (!fs.existsSync(publicI18nDir)) {
        fs.mkdirSync(publicI18nDir, { recursive: true });
        log('✅ Created public/i18n/v2/', 'green');
    }

    // 2. Create glossary if doesn't exist
    const glossaryPath = path.join(opsI18nDir, 'glossary.json');
    if (!fs.existsSync(glossaryPath)) {
        const glossaryTemplate = {
            version: '2.0.0',
            terms: {},
            protectedPatterns: []
        };
        fs.writeFileSync(glossaryPath, JSON.stringify(glossaryTemplate, null, 2));
        log('✅ Created glossary.json', 'green');
    }

    // 3. Create translation memory if doesn't exist
    const tmPath = path.join(opsI18nDir, 'translation-memory.json');
    if (!fs.existsSync(tmPath)) {
        const tmTemplate = {
            version: '2.0.0',
            metadata: {
                totalEntries: 0,
                languages: CONFIG.supportedLanguages,
                qualityThreshold: 0.90
            },
            segments: {}
        };
        fs.writeFileSync(tmPath, JSON.stringify(tmTemplate, null, 2));
        log('✅ Created translation-memory.json', 'green');
    }

    log('', 'white');
    log('🎉 i18n system initialized successfully!', 'green');
    log('', 'white');
    log('Next steps:', 'cyan');
    log('  1. Run: lydian-i18n extract --all', 'yellow');
    log('  2. Run: lydian-i18n translate --lang=all', 'yellow');
    log('  3. Run: lydian-i18n validate --lang=all', 'yellow');
}

// ============================
// UTILITIES
// ============================

function runScript(scriptPath, args) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', [scriptPath, ...args], {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Script exited with code ${code}`));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

function printHelp() {
    log('', 'white');
    log('╔═══════════════════════════════════════════════════════════╗', 'cyan');
    log('║  🌍 LyDian i18n CLI Tool v2.0                            ║', 'cyan');
    log('║  Unified CLI for i18n operations                         ║', 'cyan');
    log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
    log('', 'white');
    log('COMMANDS:', 'yellow');
    log('', 'white');
    log('  init', 'green');
    log('    Initialize i18n system (create directories and templates)', 'white');
    log('    Example: lydian-i18n init', 'white');
    log('', 'white');
    log('  extract', 'green');
    log('    Extract i18n strings from source files', 'white');
    log('    Example: lydian-i18n extract --all', 'white');
    log('    Example: lydian-i18n extract --file=public/index.html', 'white');
    log('', 'white');
    log('  translate', 'green');
    log('    Translate strings to target languages', 'white');
    log('    Example: lydian-i18n translate --lang=en', 'white');
    log('    Example: lydian-i18n translate --lang=all', 'white');
    log('    Example: lydian-i18n translate --lang=en --category=cta', 'white');
    log('', 'white');
    log('  validate', 'green');
    log('    Validate translation quality (Grammar QA)', 'white');
    log('    Example: lydian-i18n validate --lang=en', 'white');
    log('    Example: lydian-i18n validate --lang=all', 'white');
    log('', 'white');
    log('  sync', 'green');
    log('    Sync translation memory', 'white');
    log('    Example: lydian-i18n sync', 'white');
    log('', 'white');
    log('  status', 'green');
    log('    Show i18n system status', 'white');
    log('    Example: lydian-i18n status', 'white');
    log('', 'white');
    log('SUPPORTED LANGUAGES:', 'yellow');
    log(`  ${CONFIG.supportedLanguages.join(', ')}`, 'white');
    log('', 'white');
    log('For more information, visit:', 'cyan');
    log('  https://docs.ailydian.com/i18n', 'blue');
    log('', 'white');
}

// ============================
// MAIN
// ============================

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        printHelp();
        process.exit(0);
    }

    const command = args[0];

    try {
        switch (command) {
            case 'init':
                await handleInit();
                break;
            case 'extract':
                await handleExtract(args);
                break;
            case 'translate':
                await handleTranslate(args);
                break;
            case 'validate':
                await handleValidate(args);
                break;
            case 'sync':
                await handleSync();
                break;
            case 'status':
                await handleStatus();
                break;
            default:
                log(`❌ Unknown command: ${command}`, 'red');
                log('Run "lydian-i18n --help" for usage information', 'yellow');
                process.exit(1);
        }
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        process.exit(1);
    }
}

// Run CLI
if (require.main === module) {
    main();
}

module.exports = { main };
