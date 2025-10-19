---
title: "RAG Nedir?"
slug: "rag-nedir"
summary: "Retrieval-Augmented Generation ile güncel ve kaynaklı cevaplar."
tags: ["ai", "rag", "ailydian"]
---

RAG, modelin dış bilgi kaynaklarından parça getirip cevabı **kaynaklı** üretmesini sağlar. Ailydian, Qdrant/FAISS ve vLLM ile üretim ortamında bunu destekler.

## Nasıl Çalışır?

1. **Retrieval** - Vektör aramast ile ilgili belgeleri bul
2. **Augmentation** - Bulunan bilgiyi prompt'a ekle
3. **Generation** - LLM ile kaynaklı cevap üret

## Avantajlar

- Güncel bilgi
- Kaynak gösterme
- Hallüsinasyon azaltma
- Domain-specific bilgi
