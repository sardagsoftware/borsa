---
license: cc-by-4.0
task_categories:
- text-generation
- text-classification
- question-answering
language:
- en
- multilingual
tags:
- ai-models
- llm
- model-discovery
- benchmarks
- leaderboard
size_categories:
- 1K<n<10K
pretty_name: LyDian Discovery – Global AI Model Feed
---

# Dataset Card for LyDian Discovery

## Dataset Description

- **Homepage:** https://www.ailydian.com
- **Repository:** https://github.com/lydian-ai/lydian-discovery-feed (if applicable)
- **Paper:** N/A (metadata aggregation dataset)
- **Leaderboard:** N/A
- **Point of Contact:** discovery@ailydian.com

### Dataset Summary

LyDian Discovery is a curated, continuously-updated feed of new AI/LLM models and datasets from the global AI ecosystem. This dataset serves as a central discovery point for:

- **New Model Releases** from Hugging Face, arXiv, ModelScope, and official catalogs
- **Benchmark Results** from Open LLM Leaderboard, MMLU, HumanEval, and more
- **Community Signals** including downloads, likes, and usage trends
- **Multi-modal Models** covering text, vision, audio, and multi-modal AI

The feed is designed for AI discovery systems, search engines, and research platforms to stay up-to-date with the rapidly evolving AI model landscape.

### Supported Tasks and Leaderboards

This is a **metadata dataset** that supports:
- **Model Discovery:** Finding relevant AI models based on task, performance, or popularity
- **Trend Analysis:** Tracking AI ecosystem evolution over time
- **Benchmark Aggregation:** Comparing models across standardized benchmarks
- **Citation Tracking:** Linking models to research papers (arXiv)

### Languages

The metadata is provided in **English**. Model descriptions may include multilingual content depending on the source.

## Dataset Structure

### Data Instances

Example entry:

```json
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
```

### Data Fields

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

**Signals Object:**
- `downloads` (int): Total downloads
- `likes` (int): Community likes/stars
- `avg_score` (float): Average benchmark score (0-100)
- `benchmarks` (object): Specific benchmark results (MMLU, HumanEval, etc.)

### Data Splits

This dataset is continuously updated and does not have traditional train/val/test splits. It can be considered a **streaming dataset** with daily updates.

**Current size:** ~1,247 models (as of 2025-10-09)

## Dataset Creation

### Curation Rationale

The AI model ecosystem is fragmented across multiple platforms (Hugging Face, arXiv, ModelScope, official releases). This dataset aggregates model metadata from these sources to provide:

1. **Unified discovery** across platforms
2. **Standardized metadata** for search and recommendation
3. **Benchmark aggregation** for model comparison
4. **Time-series data** for ecosystem analysis

### Source Data

#### Initial Data Collection and Normalization

Data is collected from:

1. **Hugging Face Hub API** (https://huggingface.co/api)
   - Model cards and metadata
   - Download/like statistics
   - License information

2. **arXiv API** (https://arxiv.org/help/api)
   - Papers with model releases
   - Abstract and author information

3. **Open LLM Leaderboard** (https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard)
   - Benchmark scores (MMLU, HumanEval, etc.)

4. **Official Announcements**
   - LyDian Labs, LyDian Research, Google, Meta blogs
   - GitHub releases

**Normalization:**
- All dates converted to ISO8601 UTC
- License identifiers mapped to SPDX
- URLs validated and checked
- Schema validation on all entries

#### Who are the source language producers?

Metadata is produced by:
- Model authors and organizations
- Platform maintainers (Hugging Face, arXiv)
- Benchmark evaluators
- Community curators (LyDian AI team)

### Annotations

#### Annotation process

**Automated:**
- Metadata extracted via APIs
- Benchmark scores aggregated from leaderboards
- Download/like statistics refreshed daily

**Manual:**
- License verification for ambiguous cases
- Quality checks for descriptions
- Duplicate detection and resolution

#### Who are the annotators?

- **Automated systems:** API extraction scripts (white-hat, rate-limited)
- **Manual review:** LyDian AI Discovery team
- **Community:** Model authors can request corrections

### Personal and Sensitive Information

**This dataset contains NO personal or sensitive information.**

- Only public model metadata
- No user data
- No API keys or credentials
- No private/internal model information

## Considerations for Using the Data

### Social Impact of Dataset

**Positive:**
- Democratizes AI model discovery
- Reduces barrier to entry for developers
- Enables research on AI ecosystem trends
- Supports white-hat search engine indexing

**Neutral:**
- Lists models without endorsement or bias
- Includes models from all organizations equally

**Potential Negative:**
- May inadvertently list models with known safety issues (we include warnings when detected)

### Discussion of Biases

**Platform Bias:**
- Hugging Face models are over-represented (71.5%) due to API availability
- Closed-source models (OX5C9E2B, AX9F7E2B) have limited metadata

**Geographic Bias:**
- English-language platforms dominate
- Chinese platforms (ModelScope) underrepresented

**Temporal Bias:**
- Recent models have more complete metadata
- Historical models may have sparse signals

**Mitigation:**
- Explicitly document source distribution
- Actively seek non-Hugging Face sources
- Include metadata completeness scores

### Other Known Limitations

1. **Latency:** Up to 24h delay for new model releases
2. **Broken Links:** Monthly sweeps, but some links may break between checks
3. **Benchmark Coverage:** Not all models have benchmark scores
4. **License Accuracy:** Depends on source platform accuracy

## Additional Information

### Dataset Curators

- **Primary Curator:** LyDian AI Ecosystem (www.ailydian.com)
- **Contributors:** Hugging Face (via API), arXiv (via API), Open LLM Leaderboard
- **Contact:** discovery@ailydian.com

### Licensing Information

This dataset is licensed under **CC BY 4.0** (Creative Commons Attribution 4.0 International).

**You are free to:**
- Share: Copy and redistribute
- Adapt: Remix, transform, and build upon
- Commercial use: Use for any purpose, including commercially

**Under these terms:**
- **Attribution:** You must give appropriate credit and link to the license

**Note:** This license applies to the **metadata dataset** only. Individual AI models have their own licenses (specified in the `license` field).

### Citation Information

```bibtex
@misc{lydian_discovery_2025,
  title={LyDian Discovery: Global AI Model Feed},
  author={LyDian AI Ecosystem},
  year={2025},
  howpublished={\url{https://huggingface.co/datasets/lydian-ai/lydian-discovery-feed}},
  note={A curated feed of AI/LLM models from HuggingFace, arXiv, and official catalogs}
}
```

### Contributions

We welcome contributions! Please see [README.md](README.md) for contribution guidelines.

**Report Issues:**
- Broken links: discovery@ailydian.com
- Missing models: Submit via contact form
- Data corrections: Include model ID and details

---

**Maintained by:** LyDian AI (www.ailydian.com)
**Last Updated:** 2025-10-09
**Version:** 1.0.0
