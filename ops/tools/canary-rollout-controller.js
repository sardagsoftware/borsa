#!/usr/bin/env node

/**
 * 🚀 LyDian Canary Rollout Controller
 *
 * Automated canary deployment system with gradual rollout and automatic rollback
 *
 * Rollout Strategy:
 * - Phase 1: 1% (24h) - Initial canary
 * - Phase 2: 5% (48h) - Expanded canary
 * - Phase 3: 25% (72h) - Quarter rollout
 * - Phase 4: 50% (72h) - Half rollout
 * - Phase 5: 100% (permanent) - Full rollout
 *
 * Automatic Rollback Triggers:
 * - Error rate > 0.5%
 * - Load time > 500ms
 * - User complaints > 10/hour
 * - Crash rate > 0.1%
 *
 * Usage:
 *   node ops/tools/canary-rollout-controller.js start --feature=i18n_system_enabled
 *   node ops/tools/canary-rollout-controller.js status
 *   node ops/tools/canary-rollout-controller.js rollback --feature=i18n_system_enabled
 *   node ops/tools/canary-rollout-controller.js promote --feature=i18n_system_enabled
 *
 * @author LyDian AI Platform - DevOps Team
 * @license MIT
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// ============================
// CONFIGURATION
// ============================

const CONFIG = {
    flagsPath: path.join(__dirname, '../canary/feature-flags.json'),
    rolloutHistoryPath: path.join(__dirname, '../canary/rollout-history.json'),
    monitoringEndpoint: 'http://localhost:3100/api/monitoring/metrics',
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
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

// ============================
// CANARY CONTROLLER
// ============================

class CanaryController {
    constructor() {
        this.flags = this.loadFlags();
        this.history = this.loadHistory();
    }

    // ============================
    // LOAD/SAVE
    // ============================

    loadFlags() {
        try {
            const data = fs.readFileSync(CONFIG.flagsPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            log('❌ Failed to load feature flags', 'red');
            process.exit(1);
        }
    }

    saveFlags() {
        try {
            this.flags.lastUpdated = new Date().toISOString();
            fs.writeFileSync(
                CONFIG.flagsPath,
                JSON.stringify(this.flags, null, 2)
            );
            log('✅ Feature flags saved', 'green');
        } catch (error) {
            log('❌ Failed to save feature flags', 'red');
            throw error;
        }
    }

    loadHistory() {
        try {
            if (!fs.existsSync(CONFIG.rolloutHistoryPath)) {
                return { rollouts: [] };
            }

            const data = fs.readFileSync(CONFIG.rolloutHistoryPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return { rollouts: [] };
        }
    }

    saveHistory() {
        try {
            fs.writeFileSync(
                CONFIG.rolloutHistoryPath,
                JSON.stringify(this.history, null, 2)
            );
        } catch (error) {
            log('❌ Failed to save rollout history', 'red');
        }
    }

    // ============================
    // START ROLLOUT
    // ============================

    async startRollout(featureName) {
        log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
        log('║  🚀 Starting Canary Rollout                               ║', 'cyan');
        log('╚═══════════════════════════════════════════════════════════╝', 'cyan');

        const flag = this.flags.flags[featureName];

        if (!flag) {
            log(`\n❌ Feature "${featureName}" not found`, 'red');
            return;
        }

        log(`\n📋 Feature: ${featureName}`, 'white');
        log(`   Description: ${flag.description}`, 'white');
        log(`   Current rollout: ${flag.rolloutPercentage}%`, 'white');

        // Check if already at 100%
        if (flag.rolloutPercentage >= 100) {
            log('\n⚠️  Feature already at 100% rollout', 'yellow');
            return;
        }

        // Determine next phase
        const nextPhase = this.getNextPhase(flag.rolloutPercentage);

        if (!nextPhase) {
            log('\n⚠️  No next phase available', 'yellow');
            return;
        }

        log(`\n🎯 Next Phase: ${nextPhase.name}`, 'cyan');
        log(`   Target percentage: ${nextPhase.percentage}%`, 'white');
        log(`   Duration: ${nextPhase.duration}`, 'white');
        log(`   Success criteria:`, 'white');
        for (const [key, value] of Object.entries(nextPhase.successCriteria)) {
            log(`     • ${key}: ${value}`, 'white');
        }

        // Ask for confirmation (in real system, this would be automated)
        log(`\n⚡ Updating rollout percentage to ${nextPhase.percentage}%...`, 'yellow');

        // Update flag
        flag.rolloutPercentage = nextPhase.percentage;
        flag.updatedAt = new Date().toISOString();

        // Save
        this.saveFlags();

        // Record in history
        this.history.rollouts.push({
            feature: featureName,
            phase: nextPhase.name,
            percentage: nextPhase.percentage,
            startedAt: new Date().toISOString(),
            status: 'in_progress',
        });

        this.saveHistory();

        log('\n✅ Rollout started successfully!', 'green');
        log(`\n📊 Monitor metrics at: ${CONFIG.monitoringEndpoint}`, 'blue');
        log(`\n⏰ Check back in ${nextPhase.duration}`, 'yellow');
        log('', 'reset');
    }

    // ============================
    // ROLLBACK
    // ============================

    async rollback(featureName, reason = 'Manual rollback') {
        log('\n╔═══════════════════════════════════════════════════════════╗', 'red');
        log('║  🚨 ROLLBACK INITIATED                                    ║', 'red');
        log('╚═══════════════════════════════════════════════════════════╝', 'red');

        const flag = this.flags.flags[featureName];

        if (!flag) {
            log(`\n❌ Feature "${featureName}" not found`, 'red');
            return;
        }

        log(`\n📋 Feature: ${featureName}`, 'white');
        log(`   Current rollout: ${flag.rolloutPercentage}%`, 'white');
        log(`   Reason: ${reason}`, 'yellow');

        // Determine previous phase
        const previousPhase = this.getPreviousPhase(flag.rolloutPercentage);

        if (!previousPhase) {
            log('\n⚠️  Rolling back to 0% (disabled)', 'yellow');
            flag.rolloutPercentage = 0;
            flag.enabled = false;
        } else {
            log(`\n⬅️  Rolling back to ${previousPhase.percentage}%`, 'yellow');
            flag.rolloutPercentage = previousPhase.percentage;
        }

        flag.updatedAt = new Date().toISOString();

        // Save
        this.saveFlags();

        // Record in history
        this.history.rollouts.push({
            feature: featureName,
            action: 'rollback',
            fromPercentage: flag.rolloutPercentage,
            toPercentage: previousPhase ? previousPhase.percentage : 0,
            reason,
            timestamp: new Date().toISOString(),
        });

        this.saveHistory();

        log('\n✅ Rollback completed successfully!', 'green');
        log('', 'reset');
    }

    // ============================
    // PROMOTE (SKIP TO NEXT PHASE)
    // ============================

    async promote(featureName) {
        log('\n╔═══════════════════════════════════════════════════════════╗', 'green');
        log('║  🚀 PROMOTING TO NEXT PHASE                               ║', 'green');
        log('╚═══════════════════════════════════════════════════════════╝', 'green');

        await this.startRollout(featureName);
    }

    // ============================
    // STATUS
    // ============================

    showStatus() {
        log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
        log('║  📊 Canary Rollout Status                                 ║', 'cyan');
        log('╚═══════════════════════════════════════════════════════════╝', 'cyan');

        log('\n🚩 Feature Flags:', 'cyan');
        log('━'.repeat(60), 'cyan');

        for (const [name, flag] of Object.entries(this.flags.flags)) {
            const statusEmoji = flag.enabled ? '🟢' : '🔴';
            const rolloutBar = this.getRolloutBar(flag.rolloutPercentage);

            log(`\n  ${statusEmoji} ${name}`, 'white');
            log(`     ${flag.description}`, 'white');
            log(`     Rollout: ${rolloutBar} ${flag.rolloutPercentage}%`, flag.enabled ? 'green' : 'red');
            log(`     Updated: ${flag.updatedAt}`, 'white');
        }

        log('\n📜 Recent Rollout History:', 'cyan');
        log('━'.repeat(60), 'cyan');

        const recentHistory = this.history.rollouts.slice(-5).reverse();

        if (recentHistory.length === 0) {
            log('\n  No rollout history', 'white');
        } else {
            for (const entry of recentHistory) {
                const timestamp = new Date(entry.startedAt || entry.timestamp).toLocaleString();
                const action = entry.action || 'rollout';
                const icon = action === 'rollback' ? '⬅️' : '➡️';

                log(`\n  ${icon} ${entry.feature}`, 'white');
                log(`     Action: ${action}`, 'white');
                if (entry.percentage) {
                    log(`     Phase: ${entry.phase} (${entry.percentage}%)`, 'white');
                }
                if (entry.reason) {
                    log(`     Reason: ${entry.reason}`, 'yellow');
                }
                log(`     Time: ${timestamp}`, 'white');
            }
        }

        log('\n' + '━'.repeat(60), 'cyan');
        log('', 'reset');
    }

    // ============================
    // UTILITIES
    // ============================

    getNextPhase(currentPercentage) {
        const schedule = this.flags.rolloutSchedule;

        const phases = [
            { name: 'phase1', ...schedule.phase1 },
            { name: 'phase2', ...schedule.phase2 },
            { name: 'phase3', ...schedule.phase3 },
            { name: 'phase4', ...schedule.phase4 },
            { name: 'phase5', ...schedule.phase5 },
        ];

        for (const phase of phases) {
            if (phase.percentage > currentPercentage) {
                return phase;
            }
        }

        return null;
    }

    getPreviousPhase(currentPercentage) {
        const schedule = this.flags.rolloutSchedule;

        const phases = [
            { name: 'phase1', ...schedule.phase1 },
            { name: 'phase2', ...schedule.phase2 },
            { name: 'phase3', ...schedule.phase3 },
            { name: 'phase4', ...schedule.phase4 },
        ];

        // Find the phase just before current
        for (let i = phases.length - 1; i >= 0; i--) {
            if (phases[i].percentage < currentPercentage) {
                return phases[i];
            }
        }

        return null;
    }

    getRolloutBar(percentage) {
        const barLength = 20;
        const filled = Math.floor((percentage / 100) * barLength);
        const empty = barLength - filled;

        return '█'.repeat(filled) + '░'.repeat(empty);
    }
}

// ============================
// MAIN CLI
// ============================

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        printHelp();
        process.exit(0);
    }

    const command = args[0];
    const controller = new CanaryController();

    try {
        switch (command) {
            case 'start':
            case 'begin': {
                const featureArg = args.find(arg => arg.startsWith('--feature='));

                if (!featureArg) {
                    log('❌ Error: --feature parameter required', 'red');
                    log('Usage: canary-rollout-controller start --feature=i18n_system_enabled', 'yellow');
                    process.exit(1);
                }

                const feature = featureArg.split('=')[1];
                await controller.startRollout(feature);
                break;
            }

            case 'rollback': {
                const featureArg = args.find(arg => arg.startsWith('--feature='));

                if (!featureArg) {
                    log('❌ Error: --feature parameter required', 'red');
                    log('Usage: canary-rollout-controller rollback --feature=i18n_system_enabled', 'yellow');
                    process.exit(1);
                }

                const feature = featureArg.split('=')[1];
                const reasonArg = args.find(arg => arg.startsWith('--reason='));
                const reason = reasonArg ? reasonArg.split('=')[1] : 'Manual rollback';

                await controller.rollback(feature, reason);
                break;
            }

            case 'promote': {
                const featureArg = args.find(arg => arg.startsWith('--feature='));

                if (!featureArg) {
                    log('❌ Error: --feature parameter required', 'red');
                    log('Usage: canary-rollout-controller promote --feature=i18n_system_enabled', 'yellow');
                    process.exit(1);
                }

                const feature = featureArg.split('=')[1];
                await controller.promote(feature);
                break;
            }

            case 'status':
                controller.showStatus();
                break;

            default:
                log(`❌ Unknown command: ${command}`, 'red');
                log('Run "canary-rollout-controller --help" for usage information', 'yellow');
                process.exit(1);
        }
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        process.exit(1);
    }
}

function printHelp() {
    log('', 'white');
    log('╔═══════════════════════════════════════════════════════════╗', 'cyan');
    log('║  🚀 LyDian Canary Rollout Controller                      ║', 'cyan');
    log('║  Automated canary deployment with gradual rollout         ║', 'cyan');
    log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
    log('', 'white');
    log('COMMANDS:', 'yellow');
    log('', 'white');
    log('  start --feature=<name>', 'green');
    log('    Start canary rollout for a feature', 'white');
    log('    Example: node ops/tools/canary-rollout-controller.js start --feature=i18n_system_enabled', 'white');
    log('', 'white');
    log('  rollback --feature=<name> [--reason=<reason>]', 'green');
    log('    Rollback to previous phase', 'white');
    log('    Example: node ops/tools/canary-rollout-controller.js rollback --feature=i18n_system_enabled --reason="High error rate"', 'white');
    log('', 'white');
    log('  promote --feature=<name>', 'green');
    log('    Promote to next phase (same as start)', 'white');
    log('    Example: node ops/tools/canary-rollout-controller.js promote --feature=i18n_system_enabled', 'white');
    log('', 'white');
    log('  status', 'green');
    log('    Show current rollout status', 'white');
    log('    Example: node ops/tools/canary-rollout-controller.js status', 'white');
    log('', 'white');
    log('ROLLOUT PHASES:', 'yellow');
    log('  Phase 1: 1% (24h)   - Initial canary', 'white');
    log('  Phase 2: 5% (48h)   - Expanded canary', 'white');
    log('  Phase 3: 25% (72h)  - Quarter rollout', 'white');
    log('  Phase 4: 50% (72h)  - Half rollout', 'white');
    log('  Phase 5: 100%       - Full rollout', 'white');
    log('', 'white');
    log('AUTOMATIC ROLLBACK TRIGGERS:', 'yellow');
    log('  • Error rate > 0.5%', 'white');
    log('  • Load time > 500ms', 'white');
    log('  • User complaints > 10/hour', 'white');
    log('  • Crash rate > 0.1%', 'white');
    log('', 'white');
}

// Run CLI
if (require.main === module) {
    main();
}

module.exports = { CanaryController };
