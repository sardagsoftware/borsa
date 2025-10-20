import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Çıkış başarılı',
  });

  // Session cookie'yi sil
  response.cookies.delete('ukalai_session');

  return response;
}
