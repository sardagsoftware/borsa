import { NextRequest, NextResponse } from 'next/server';

const CORRECT_PASSWORD = process.env.UKALAI_PASSWORD || 'Xruby1985.!?';

export async function POST(request: NextRequest) {
  try {
    // Get raw text first, then parse
    const text = await request.text();
    const body = JSON.parse(text);
    const { password } = body;

    console.log('[AUTH] Login attempt, password match:', password === CORRECT_PASSWORD);

    // Şifre kontrolü
    if (password && password === CORRECT_PASSWORD) {
      // Session token oluştur
      const sessionToken = btoa(CORRECT_PASSWORD);

      // Response oluştur
      const response = NextResponse.json({
        success: true,
        message: 'Giriş başarılı',
      });

      // Session cookie set et
      response.cookies.set('ukalai_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 gün
        path: '/',
      });

      return response;
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Yanlış şifre',
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Bir hata oluştu: ' + (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}
