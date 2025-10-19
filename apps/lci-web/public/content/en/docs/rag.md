---
title: "What is RAG?"
slug: "what-is-rag"
summary: "Retrieval-Augmented Generation for grounded answers."
tags: ["ai", "rag", "ailydian"]
---

RAG lets the model fetch snippets from external knowledge and generate **grounded** answers. Ailydian supports it with Qdrant/FAISS and vLLM in prod.

## How It Works

1. **Retrieval** - Find relevant documents via vector search
2. **Augmentation** - Add found information to prompt
3. **Generation** - LLM generates grounded answer

## Benefits

- Up-to-date information
- Source attribution
- Reduced hallucination
- Domain-specific knowledge
