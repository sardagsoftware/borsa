#!/usr/bin/env python3
"""
🌍 LyDian i18n Auto-Integration Script (Python)

Tüm HTML sayfalarına otomatik i18n sistemi entegre eder.
"""

import os
import glob
import sys
from datetime import datetime
from pathlib import Path

# I18n init code
I18N_INIT = '''
    <!-- 🌍 LyDian i18n System - Auto-integrated -->
    <script src="/js/feature-flags.js"></script>
    <script src="/js/locale-engine.js"></script>
    <script src="/js/locale-switcher.js"></script>
    <script>
        (async function() {
            try {
                // 1. Initialize feature flags
                const flags = new FeatureFlags();
                await flags.init();

                // 2. Check if i18n is enabled
                if (flags.isEnabled('i18n_system_enabled')) {
                    // 3. Initialize locale engine
                    const i18n = new LocaleEngine({ defaultLocale: 'tr' });
                    await i18n.init();

                    // 4. Make available globally
                    window.i18n = i18n;

                    console.log('✅ i18n system initialized:', i18n.getCurrentLocale());
                }
            } catch (error) {
                console.warn('⚠️ i18n initialization failed:', error);
            }
        })();
    </script>
'''

def integrate_i18n(html_file):
    """Integrate i18n into a single HTML file"""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Skip if already has i18n
        if 'locale-engine.js' in content:
            return 'skipped', 'Already has i18n'

        # Skip if no </body> tag
        if '</body>' not in content:
            return 'skipped', 'No </body> tag'

        # Create backup
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        backup_file = f"{html_file}.bak-i18n-{timestamp}"
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(content)

        # Insert i18n code before </body>
        new_content = content.replace('</body>', I18N_INIT + '\n</body>')

        # Write back
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(new_content)

        return 'success', 'i18n integrated'

    except Exception as e:
        return 'failed', str(e)

def main():
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║  🌍 LyDian i18n Auto-Integration (Python)                 ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    print()

    # Find all HTML files
    html_files = glob.glob('public/*.html')
    html_files = [f for f in html_files if not any(x in f for x in ['backup', 'old', 'bak', 'BACKUP', 'OLD', 'demo'])]

    total = len(html_files)
    success = 0
    skipped = 0
    failed = 0

    print(f"📁 Found {total} HTML files")
    print()

    for html_file in html_files:
        filename = os.path.basename(html_file)
        status, message = integrate_i18n(html_file)

        if status == 'success':
            print(f"✅ {filename} - {message}")
            success += 1
        elif status == 'skipped':
            print(f"⊘ {filename} - {message}")
            skipped += 1
        else:
            print(f"❌ {filename} - {message}")
            failed += 1

    print()
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("📊 Summary:")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"Total files: {total}")
    print(f"✅ Successfully integrated: {success}")
    print(f"⊘ Skipped: {skipped}")
    print(f"❌ Failed: {failed}")
    print()

    if failed == 0:
        print("🎉 Auto-integration completed with 0 errors!")
        return 0
    else:
        print(f"⚠️ Auto-integration completed with {failed} errors")
        return 1

if __name__ == '__main__':
    sys.exit(main())
