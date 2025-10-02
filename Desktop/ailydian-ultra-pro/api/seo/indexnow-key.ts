import { VercelRequest, VercelResponse } from '@vercel/node';

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.status(200).send(INDEXNOW_KEY);

  } catch (error) {
    console.error('❌ IndexNow key verification error:', error);
    res.status(500).send('Internal Server Error');
  }
}
