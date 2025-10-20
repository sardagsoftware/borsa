# LyDian Documentation IA - Quick Reference Card

## Location
```
/Users/sardag/Desktop/ailydian-ultra-pro/docs/
```

## Statistics at a Glance
- **204** directories created
- **32** files created
- **10** languages supported
- **3** product modules
- **5** SDK languages
- **6** API specifications

## Directory Structure Quick Guide

### Language Paths
```bash
docs/{lang}/                    # Language root (tr, en, de, fr, es, ar, ru, it, ja, zh-CN)
docs/{lang}/getting-started/    # Quick start guides
docs/{lang}/guides/             # How-to guides
docs/{lang}/concepts/           # Conceptual docs
docs/{lang}/reference/          # API references
docs/{lang}/reference/{module}/ # Module-specific API docs
```

### API Specifications
```bash
docs/openapi/{module}.v1.yml           # REST API specs
docs/asyncapi/events.{module}.yml      # Event API specs
```

### SDK Paths
```bash
docs/sdks/{language}/           # SDK documentation
docs/examples/sdk-{lang}/       # SDK examples
```

### Operations
```bash
docs/ops/ci/                    # CI/CD configs
docs/ops/search-index/          # Search indexing
docs/ops/spell-style/           # Style guides
docs/ops/brief/                 # Documentation briefs
```

## Three Product Modules

### 1. Smart Cities
- Urban intelligence and IoT management
- API: `openapi/smart-cities.v1.yml`
- Events: `asyncapi/events.smart-cities.yml`

### 2. İnsan IQ
- Human intelligence and behavioral analytics
- API: `openapi/insan-iq.v1.yml`
- Events: `asyncapi/events.insan-iq.yml`

### 3. LyDian IQ
- AI-powered decision intelligence
- API: `openapi/lydian-iq.v1.yml`
- Events: `asyncapi/events.lydian-iq.yml`

## 10 Languages Supported

| Code | Language | Flag |
|------|----------|------|
| tr | Turkish | 🇹🇷 |
| en | English | 🇬🇧 |
| de | German | 🇩🇪 |
| fr | French | 🇫🇷 |
| es | Spanish | 🇪🇸 |
| ar | Arabic | 🇸🇦 |
| ru | Russian | 🇷🇺 |
| it | Italian | 🇮🇹 |
| ja | Japanese | 🇯🇵 |
| zh-CN | Chinese | 🇨🇳 |

## 14 Documentation Sections (per language)

1. getting-started
2. guides
3. concepts
4. reference (with 3 module subdirs)
5. webhooks
6. cli
7. cookbooks
8. tutorials
9. sdk
10. change-log
11. roadmap
12. compliance-security
13. sla-slo
14. glossary

## 5 SDK Languages

1. TypeScript/JavaScript
2. Python
3. Go
4. Java
5. C#

## Key Files

| File | Purpose |
|------|---------|
| README.md | Main documentation overview |
| nav.yml | Navigation structure |
| STRUCTURE.txt | Visual directory tree |
| STATS.md | Statistics and metrics |
| MANIFEST.json | Platform manifest |
| IA-CREATION-REPORT.md | Creation report |
| QUICK-REFERENCE.md | This file |

## Common Commands

### Navigate to docs
```bash
cd /Users/sardag/Desktop/ailydian-ultra-pro/docs/
```

### Count directories
```bash
find . -type d | wc -l
```

### List all languages
```bash
ls -d */ | grep -E '^(tr|en|de|fr|es|ar|ru|it|ja|zh-CN)/$'
```

### View structure
```bash
cat STRUCTURE.txt
```

### Check navigation
```bash
cat nav.yml
```

### View manifest
```bash
cat MANIFEST.json
```

## Next Steps Checklist

- [ ] Populate getting-started guides
- [ ] Write API documentation
- [ ] Create SDK examples
- [ ] Complete OpenAPI specs
- [ ] Complete AsyncAPI specs
- [ ] Set up CI/CD
- [ ] Implement search indexing
- [ ] Create translation workflow
- [ ] Add style guides
- [ ] Deploy documentation site

## Status
**IA COMPLETE - Ready for Content Population**

---
**Version:** 1.0.0  
**Created:** 2025-10-06  
**Location:** `/Users/sardag/Desktop/ailydian-ultra-pro/docs/`
