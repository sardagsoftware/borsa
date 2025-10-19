// RAG Answer API - Get grounded answers with sources

export const runtime = 'edge';

import Fuse from 'fuse.js';

type Doc = {
  title: string;
  slug: string;
  body: string;
  href: string;
};

async function loadDocs(lang: 'tr' | 'en'): Promise<Doc[]> {
  // In real app, scan content folder - for now, hardcoded
  const docs: Doc[] = [
    {
      title: lang === 'tr' ? 'RAG Nedir?' : 'What is RAG?',
      slug: lang === 'tr' ? 'rag-nedir' : 'what-is-rag',
      body:
        lang === 'tr'
          ? 'RAG (Retrieval-Augmented Generation) modelin dış bilgi kaynaklarından parça getirip cevabı kaynaklı üretmesini sağlar. Ailydian, Qdrant/FAISS ve vLLM ile üretim ortamında bunu destekler. Nasıl Çalışır: 1) Retrieval - Vektör araması ile ilgili belgeleri bul, 2) Augmentation - Bulunan bilgiyi prompt a ekle, 3) Generation - LLM ile kaynaklı cevap üret. Avantajlar: Güncel bilgi, Kaynak gösterme, Hallüsinasyon azaltma, Domain-specific bilgi.'
          : 'RAG (Retrieval-Augmented Generation) lets the model fetch snippets from external knowledge and generate grounded answers. Ailydian supports it with Qdrant/FAISS and vLLM in prod. How It Works: 1) Retrieval - Find relevant documents via vector search, 2) Augmentation - Add found information to prompt, 3) Generation - LLM generates grounded answer. Benefits: Up-to-date information, Source attribution, Reduced hallucination, Domain-specific knowledge.',
      href: `/${lang}/docs/${lang === 'tr' ? 'rag-nedir' : 'what-is-rag'}`,
    },
  ];

  return docs;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get('lang') || 'tr').toLowerCase() as 'tr' | 'en';
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return new Response(JSON.stringify({ answer: '', sources: [] }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const docs = await loadDocs(lang);

    // Fuse.js search
    const fuse = new Fuse(docs, {
      keys: ['title', 'body'],
      threshold: 0.3,
    });

    const hits = fuse.search(q).slice(0, 3).map(h => h.item);

    // Simple summarization: first 300 chars + sources
    const answer = hits.length
      ? hits
          .map(h =>
            h.body
              .replace(/\s+/g, ' ')
              .slice(0, 300)
              .trim()
          )
          .join(' … ')
      : lang === 'tr'
      ? 'Bilgi tabanında uygun bir içerik bulunamadı.'
      : 'No suitable content found.';

    const sources = hits.map(h => ({ title: h.title, href: h.href }));

    return new Response(JSON.stringify({ answer, sources }), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Answer API error:', error);
    return new Response(
      JSON.stringify({
        answer: 'Error generating answer',
        sources: [],
      }),
      {
        headers: { 'content-type': 'application/json' },
        status: 500,
      }
    );
  }
}
