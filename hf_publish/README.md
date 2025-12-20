# LyDian Discovery – Global AI Model Feed 🤖

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Dataset](https://img.shields.io/badge/Dataset-Public-green)](https://huggingface.co/datasets/lydian-ai/lydian-discovery-feed)

## 📖 Overview

**LyDian Discovery** is a curated, continuously-updated feed of new AI/LLM models and datasets from the global AI ecosystem. This feed serves as a central discovery point for:

- **New Model Releases** from Hugging Face, arXiv, ModelScope, and official catalogs
- **Benchmark Results** from Open LLM Leaderboard, MMLU, HumanEval, and more
- **Community Signals** including downloads, likes, and usage trends
- **Multi-modal Models** covering text, vision, audio, and multi-modal AI

### Purpose

This dataset is designed to:
1. **Enable AI discovery** for developers, researchers, and organizations
2. **Provide structured metadata** for model search and recommendation systems
3. **Track AI ecosystem trends** with time-series data on model releases
4. **Support white-hat indexing** for search engines and AI platforms

---

## 🗂️ Data Structure

### Feed Format

The feed is available in two formats:

#### JSON Feed (`ai_models.json`)
```json
[
  {
    "id": "hf:mistralai/Mixtral-8x22B-Instruct-v0.1",
    "name": "Mixtral-8x22B-Instruct-v0.1",
    "org": "mistralai",
    "source": "huggingface",
    "model_type": "text-generation",
    "released_at": "2025-09-20T00:00:00Z",
    "link": "https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1",
    "description": "Mixtral 8x22B is a mixture-of-experts model with 141B total parameters",
    "signals": {
      "downloads": 125000,
      "likes": 1250,
      "avg_score": 84.5,
      "benchmarks": {
        "mmlu": 77.8,
        "humaneval": 75.3
      }
    },
    "tags": ["mixture-of-experts", "instruction-following", "multilingual"],
    "license": "apache-2.0"
  }
]
```

#### RSS Feed (`ai_models.rss`)
Standard RSS 2.0 format with:
- `<title>`: Model name
- `<description>`: Model description and key metrics
- `<link>`: Direct link to model page
- `<pubDate>`: Release date
- `<category>`: Model type and tags

---

## 📊 Data Sources

### Primary Sources
1. **Hugging Face Hub** - Official model releases and metadata
2. **arXiv** - Research papers and model announcements
3. **Open LLM Leaderboard** - Benchmark scores and rankings
4. **ModelScope** - Chinese AI model ecosystem
5. **Official Catalogs** - LyDian Labs, LyDian Research, Google, Meta announcements

### Update Frequency
- **Real-time:** Major model releases (LyDian Core-5, AX9F7E2B 4, LyDian Vision 2.0)
- **Daily:** Hugging Face trending models
- **Weekly:** arXiv paper-model mappings
- **Monthly:** Historical data cleanup and validation

---

## 🚀 Usage

### Direct Access
```bash
# JSON Feed
curl https://www.ailydian.com/feed/ai_models.json

# RSS Feed
curl https://www.ailydian.com/feed/ai_models.rss
```

### Python Example
```python
import requests
import json

# Fetch latest models
response = requests.get('https://www.ailydian.com/feed/ai_models.json')
models = response.json()

# Filter by type
text_models = [m for m in models if m['model_type'] == 'text-generation']

# Sort by signals
top_models = sorted(models, key=lambda x: x['signals']['downloads'], reverse=True)[:10]

print(f"Top 10 models by downloads: {[m['name'] for m in top_models]}")
```

### Integration with AI Systems
```python
# Use in AI discovery systems
from lydian_discovery import DiscoveryFeed

feed = DiscoveryFeed('https://www.ailydian.com/feed/ai_models.json')

# Get models released this week
recent = feed.get_models(days=7)

# Get models by organization
mistral_models = feed.filter_by_org('mistralai')

# Get top-performing models
top = feed.get_top_performers(metric='mmlu', limit=20)
```

---

## 📋 Schema

### Model Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (format: `source:org/model_id`) |
| `name` | string | Human-readable model name |
| `org` | string | Organization or author |
| `source` | string | Source platform (huggingface, arxiv, modelscope, official) |
| `model_type` | string | Model category (text-generation, text2text, image-generation, etc.) |
| `released_at` | ISO8601 | Official release date |
| `link` | URL | Direct link to model page or paper |
| `description` | string | Brief model description |
| `signals` | object | Community and performance metrics |
| `tags` | array[string] | Model tags and capabilities |
| `license` | string | Model license identifier |

### Signals Object

| Field | Type | Description |
|-------|------|-------------|
| `downloads` | integer | Total downloads (if applicable) |
| `likes` | integer | Community likes/stars |
| `avg_score` | float | Average benchmark score (0-100) |
| `benchmarks` | object | Specific benchmark results |

---

## 🛡️ Data Quality & Ethics

### White-Hat Compliance
- ✅ **No scraping** - Only official APIs and public catalogs
- ✅ **Rate limiting** - Respects all platform rate limits
- ✅ **Attribution** - All sources properly credited
- ✅ **No PII** - Only public metadata, no personal data
- ✅ **TOS compliant** - Follows all platform terms of service

### Data Validation
- **Schema validation** on all entries
- **Duplicate detection** via ID and name matching
- **Broken link detection** (monthly sweep)
- **License verification** against SPDX identifiers

### Ethical Considerations
- Models are listed **neutrally** without bias
- **No endorsement** of specific models or organizations
- **Safety warnings** included for known issues
- **Community moderation** for problematic models

---

## 📈 Statistics (as of 2025-10-09)

```
Total Models: 1,247
├─ Text Generation: 658 (52.8%)
├─ Text-to-Text: 203 (16.3%)
├─ Image Generation: 187 (15.0%)
├─ Multi-modal: 142 (11.4%)
└─ Other: 57 (4.5%)

Sources:
├─ Hugging Face: 892 (71.5%)
├─ arXiv: 187 (15.0%)
├─ Official: 98 (7.9%)
└─ ModelScope: 70 (5.6%)

Updated: Daily (03:00 UTC)
Latency: < 24h for major releases
```

---

## 🔗 Links

- **Live Feed:** https://www.ailydian.com/feed/ai_models.json
- **RSS Feed:** https://www.ailydian.com/feed/ai_models.rss
- **LLMs.txt:** https://www.ailydian.com/llms.txt
- **API Docs:** https://www.ailydian.com/api-docs.html
- **Contact:** discovery@ailydian.com

---

## 📜 License

This dataset is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

**Attribution:**
```
LyDian Discovery – Global AI Model Feed
Source: https://huggingface.co/datasets/lydian-ai/lydian-discovery-feed
Maintained by LyDian AI (www.ailydian.com)
```

---

## 🤝 Contributing

### Report Issues
- **Broken links:** discovery@ailydian.com
- **Missing models:** Submit via [contact form](https://www.ailydian.com/contact.html)
- **Data corrections:** Include model ID and correction details

### Source Additions
We welcome suggestions for new data sources. Requirements:
1. Must have public API or official catalog
2. Must respect rate limits
3. Must provide structured metadata
4. Must allow redistribution (terms check)

---

## 📮 Contact

**LyDian AI Discovery Team**
- Email: discovery@ailydian.com
- Website: https://www.ailydian.com
- Twitter: @lydianai
- GitHub: github.com/lydian-ai

---

**Last Updated:** 2025-10-09
**Version:** 1.0.0
**Maintainer:** LyDian AI Ecosystem
