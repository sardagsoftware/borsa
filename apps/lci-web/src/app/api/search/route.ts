// RAG Search API - Fuse.js powered search across menu + CMS content

export const runtime = 'edge';

import Fuse from 'fuse.js';

type SearchItem = {
  title: string;
  desc: string;
  href: string;
  body: string;
};

async function getMenuItems(lang: 'tr' | 'en'): Promise<SearchItem[]> {
  const menuData =
    lang === 'en'
      ? await import('@/../public/data/menu.en.json')
      : await import('@/../public/data/menu.tr.json');

  const flat = Object.values(menuData.default).flat() as any[];
  return flat.map((x: any) => ({
    title: x.title,
    desc: x.desc,
    href: x.href,
    body: '',
  }));
}

async function getDocsContent(lang: 'tr' | 'en'): Promise<SearchItem[]> {
  // For now, return basic docs - in real app, scan content folder
  const docs: SearchItem[] = [
    {
      title: lang === 'tr' ? 'RAG Nedir?' : 'What is RAG?',
      desc:
        lang === 'tr'
          ? 'Retrieval-Augmented Generation ile güncel ve kaynaklı cevaplar'
          : 'Retrieval-Augmented Generation for grounded answers',
      href: `/${lang}/docs/${lang === 'tr' ? 'rag-nedir' : 'what-is-rag'}`,
      body:
        lang === 'tr'
          ? 'RAG modelin dış bilgi kaynaklarından parça getirip cevabı kaynaklı üretmesini sağlar'
          : 'RAG lets the model fetch snippets from external knowledge and generate grounded answers',
    },
  ];

  return docs;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get('lang') || 'tr').toLowerCase() as 'tr' | 'en';
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return new Response(JSON.stringify([]), {
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    // Build search corpus
    const menuItems = await getMenuItems(lang);
    const docsItems = await getDocsContent(lang);

    const corpus: SearchItem[] = [
      ...menuItems,
      ...docsItems,
      {
        title: lang === 'tr' ? 'Fiyatlandırma' : 'Pricing',
        desc: '',
        href: `/${lang}/pricing`,
        body: '',
      },
      {
        title: lang === 'tr' ? 'Durum' : 'Status',
        desc: '',
        href: `/${lang}/status`,
        body: '',
      },
      { title: 'Blog', desc: '', href: `/${lang}/blog`, body: '' },
    ];

    // Fuse.js search
    const fuse = new Fuse(corpus, {
      keys: ['title', 'desc', 'body', 'href'],
      threshold: 0.35,
      includeScore: true,
    });

    const results = fuse.search(q).slice(0, 10);
    const out = results.map(r => r.item);

    return new Response(JSON.stringify(out), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return new Response(JSON.stringify([]), {
      headers: { 'content-type': 'application/json' },
      status: 500,
    });
  }
}
