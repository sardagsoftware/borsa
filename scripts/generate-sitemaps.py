#!/usr/bin/env python3
"""
Generate comprehensive sitemaps for ailydian.com.
Creates category-based sitemaps + sitemap-index.xml.
Replaces the old bloated sitemap.xml (76K lines) with proper structure.
"""

import os
import sys
from datetime import datetime

PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public')
BASE_URL = 'https://www.ailydian.com'
TODAY = datetime.now().strftime('%Y-%m-%d')

# ========================================
# PAGE CATEGORIES & PRIORITIES
# ========================================

# Pages to EXCLUDE from sitemaps (test, internal, demo, utility pages)
EXCLUDE = {
    'test.html', 'test-auto-translate.html', 'test-backend-connection.html',
    'test-chat-api.html', 'test-chat-buttons.html', 'test-chat-ecw.html',
    'test-i18n-demo.html', 'test-language-system.html', 'test-legal.html',
    'test-translation.html', 'quantum-test.html',
    'cache-clear.html', 'cache-dashboard.html', 'force-refresh.html',
    'dashboard-email-yedek.html', 'email-dashboard.html', 'email-setup-status.html',
    'verifyforzoho.html', 'verify-email.html', 'reset-password.html',
    'forgot-password.html', 'offline.html', 'lydian-offline.html',
    'hero-3d-lydian.html', 'hero-particles-lydian.html', 'hero-cinematic-demo.html',
    'hero-video-demo-1-neural.html', 'hero-video-demo-2-particles.html',
    'hero-video-demo-3-matrix.html', 'hero-video-demo-4-abstract.html',
    'hero-video-demos-index.html',
    'cyborg-demo.html', 'cyborg-orbital-full.html',
    'connector-demo.html', 'ecw-demo.html', 'search-meter-demo.html',
    'realistic-characters-demo.html', 'phase-l-results.html',
    'ai-governance-demo.html', 'lydian-iq-unified-demo.html',
    'seo-monitoring.html', 'performance-dashboard.html',
    'cost-dashboard.html', 'azure-dashboard.html',
    'monitoring.html', 'console.html',
    'lydian-iq-new-ui.html',  # duplicate of lydian-iq.html
    's/[code].html',  # dynamic route template
}

# Category definitions: (category_name, {filename: (priority, changefreq)})
CATEGORIES = {
    'core': {
        'index.html':      (1.0, 'daily'),
        'chat.html':        (0.9, 'daily'),
        'dashboard.html':   (0.9, 'daily'),
        'models.html':      (0.9, 'weekly'),
        'enterprise.html':  (0.9, 'weekly'),
        'enterprise-index.html': (0.8, 'weekly'),
        'auth.html':        (0.6, 'monthly'),
        'billing.html':     (0.6, 'monthly'),
        'settings.html':    (0.5, 'monthly'),
        'tokens.html':      (0.6, 'monthly'),
        'user-dashboard.html': (0.7, 'weekly'),
        'files.html':       (0.6, 'monthly'),
    },
    'products': {
        'ai-advisor-hub.html':      (0.8, 'weekly'),
        'ai-assistant.html':        (0.8, 'weekly'),
        'ai-chat.html':             (0.8, 'weekly'),
        'ai-cultural-advisor.html': (0.8, 'weekly'),
        'ai-decision-matrix.html':  (0.8, 'weekly'),
        'ai-health-orchestrator.html': (0.8, 'weekly'),
        'ai-knowledge-assistant.html': (0.8, 'weekly'),
        'ai-learning-path.html':    (0.8, 'weekly'),
        'ai-life-coach.html':       (0.8, 'weekly'),
        'ai-meeting-insights.html': (0.8, 'weekly'),
        'ai-ops-center.html':       (0.8, 'weekly'),
        'ai-power-panel.html':      (0.8, 'weekly'),
        'ai-startup-accelerator.html': (0.8, 'weekly'),
        'image-generation.html':    (0.8, 'weekly'),
        'video-ai.html':            (0.8, 'weekly'),
        'lydian-iq.html':           (0.8, 'weekly'),
        'lydian-os.html':           (0.8, 'weekly'),
        'knowledge-base.html':      (0.7, 'weekly'),
        'omnireach-ai-creator.html': (0.7, 'weekly'),
        'firildak.html':            (0.7, 'weekly'),
        'firildak-ai.html':         (0.7, 'weekly'),
        'google-studio.html':       (0.7, 'weekly'),
        'education.html':           (0.7, 'weekly'),
    },
    'medical': {
        'medical-ai.html':          (0.8, 'weekly'),
        'medical-expert.html':      (0.8, 'weekly'),
        'medical-ai-dashboard.html': (0.7, 'weekly'),
        'medical-dashboard.html':   (0.7, 'weekly'),
        'hospital-dashboard.html':  (0.7, 'weekly'),
        'cancer-diagnosis-dashboard.html': (0.7, 'weekly'),
        'epic-fhir-dashboard.html': (0.7, 'weekly'),
        'ecw-ailydian.html':        (0.7, 'weekly'),
    },
    'legal': {
        'legal-expert.html':        (0.8, 'weekly'),
        'lydian-hukukai.html':      (0.8, 'weekly'),
        'lydian-hukukai-pro.html':  (0.7, 'weekly'),
        'lydian-hukukai-v2.html':   (0.7, 'weekly'),
        'lydian-legal-chat.html':   (0.7, 'weekly'),
        'lydian-legal-search.html': (0.7, 'weekly'),
        'lydian-legal-search-enhanced.html': (0.7, 'weekly'),
        'lydian-legal-search-i18n.html': (0.6, 'weekly'),
        'lydian-legal-universal.html': (0.7, 'weekly'),
        'sikayet-olustur.html':     (0.6, 'weekly'),
    },
    'civic': {
        'civic-atg.html':           (0.7, 'weekly'),
        'civic-intelligence-grid.html': (0.7, 'weekly'),
        'civic-map.html':           (0.7, 'weekly'),
        'civic-phn.html':           (0.7, 'weekly'),
        'civic-rro.html':           (0.7, 'weekly'),
        'civic-svf.html':           (0.7, 'weekly'),
        'civic-umo.html':           (0.7, 'weekly'),
    },
    'governance': {
        'ai-governance-dashboard.html': (0.7, 'weekly'),
        'governance-compliance.html': (0.7, 'weekly'),
        'governance-dashboard.html': (0.7, 'weekly'),
        'governance-leaderboard.html': (0.6, 'weekly'),
        'governance-models.html':   (0.7, 'weekly'),
        'governance-trust-index.html': (0.6, 'weekly'),
        'humain-home.html':         (0.7, 'weekly'),
    },
    'developer': {
        'api-docs.html':            (0.8, 'weekly'),
        'api-reference.html':       (0.8, 'weekly'),
        'api.html':                 (0.8, 'weekly'),
        'developers.html':          (0.8, 'weekly'),
        'developer-search.html':    (0.7, 'weekly'),
        'docs.html':                (0.8, 'weekly'),
        'connectors.html':          (0.7, 'weekly'),
        'changelog.html':           (0.7, 'monthly'),
    },
    'company': {
        'about.html':               (0.7, 'monthly'),
        'contact.html':             (0.7, 'monthly'),
        'careers.html':             (0.7, 'monthly'),
        'blog.html':                (0.7, 'weekly'),
        'help.html':                (0.7, 'monthly'),
        'research.html':            (0.7, 'weekly'),
        'analytics.html':           (0.7, 'weekly'),
        'privacy.html':             (0.5, 'yearly'),
        'terms.html':               (0.5, 'yearly'),
        'cookies.html':             (0.5, 'yearly'),
        'security-analytics.html':  (0.6, 'weekly'),
        'status.html':              (0.5, 'weekly'),
        'status-dashboard.html':    (0.5, 'weekly'),
        'system-status.html':       (0.5, 'weekly'),
    },
}

def get_url(filename):
    """Convert filename to URL path."""
    if filename == 'index.html':
        return BASE_URL + '/'
    return f"{BASE_URL}/{filename.replace('.html', '')}"

def generate_sitemap(category_name, pages):
    """Generate a single category sitemap XML."""
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    for filename, (priority, changefreq) in sorted(pages.items()):
        # Verify file exists
        filepath = os.path.join(PUBLIC_DIR, filename)
        if not os.path.isfile(filepath):
            print(f"  WARN: {filename} not found, skipping")
            continue

        lines.append('  <url>')
        lines.append(f'    <loc>{get_url(filename)}</loc>')
        lines.append(f'    <lastmod>{TODAY}</lastmod>')
        lines.append(f'    <changefreq>{changefreq}</changefreq>')
        lines.append(f'    <priority>{priority}</priority>')
        lines.append('  </url>')

    lines.append('</urlset>')
    return '\n'.join(lines) + '\n'

def generate_sitemap_index(category_names):
    """Generate sitemap-index.xml."""
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    for name in category_names:
        lines.append('  <sitemap>')
        lines.append(f'    <loc>{BASE_URL}/sitemap-{name}.xml</loc>')
        lines.append(f'    <lastmod>{TODAY}</lastmod>')
        lines.append('  </sitemap>')

    # Include images sitemap if it exists
    if os.path.isfile(os.path.join(PUBLIC_DIR, 'sitemap-images.xml')):
        lines.append('  <sitemap>')
        lines.append(f'    <loc>{BASE_URL}/sitemap-images.xml</loc>')
        lines.append(f'    <lastmod>{TODAY}</lastmod>')
        lines.append('  </sitemap>')

    lines.append('</sitemapindex>')
    return '\n'.join(lines) + '\n'

def main():
    if not os.path.isdir(PUBLIC_DIR):
        print(f"ERROR: {PUBLIC_DIR} not found")
        sys.exit(1)

    total_urls = 0
    category_names = []

    # Collect all categorized pages to check for uncategorized ones
    all_categorized = set()
    for pages in CATEGORIES.values():
        all_categorized.update(pages.keys())

    # Generate category sitemaps
    for category_name, pages in CATEGORIES.items():
        xml = generate_sitemap(category_name, pages)
        filename = f'sitemap-{category_name}.xml'
        filepath = os.path.join(PUBLIC_DIR, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(xml)

        url_count = xml.count('<url>')
        total_urls += url_count
        category_names.append(category_name)
        print(f"  {filename}: {url_count} URLs")

    # Generate sitemap-index.xml
    index_xml = generate_sitemap_index(category_names)
    with open(os.path.join(PUBLIC_DIR, 'sitemap-index.xml'), 'w', encoding='utf-8') as f:
        f.write(index_xml)
    print(f"\n  sitemap-index.xml: {len(category_names)} sitemaps")

    # Check for uncategorized pages
    all_html = set()
    for f in os.listdir(PUBLIC_DIR):
        if f.endswith('.html'):
            all_html.add(f)

    uncategorized = all_html - all_categorized - EXCLUDE
    if uncategorized:
        print(f"\n  NOTE: {len(uncategorized)} uncategorized pages (not in sitemap):")
        for f in sorted(uncategorized):
            print(f"    - {f}")

    print(f"\nSummary: {total_urls} total URLs across {len(category_names)} sitemaps")

if __name__ == '__main__':
    main()
