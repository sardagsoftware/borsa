// SSR-cached Menu API - Edge runtime

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lang = (url.searchParams.get('lang') || 'tr').toLowerCase();

  try {
    // Load menu data from public folder
    const menuData =
      lang === 'en'
        ? await import('@/../public/data/menu.en.json')
        : await import('@/../public/data/menu.tr.json');

    return new Response(JSON.stringify(menuData.default), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to load menu' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
