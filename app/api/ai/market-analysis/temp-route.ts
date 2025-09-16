export const dynamic = 'force-dynamic';

export async function GET() {
  // Temporary stub for deployment
  return Response.json({ 
    error: 'Service temporarily unavailable',
    status: 'maintenance'
  }, { status: 503 });
}
