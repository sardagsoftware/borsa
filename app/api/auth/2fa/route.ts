import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// 2FA QR kod oluşturma
export async function POST(request: NextRequest) {
  try {
    const { email, action } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email gerekli' }, { status: 400 });
    }

    if (action === 'generate') {
      // Yeni 2FA secret oluştur
      const secret = speakeasy.generateSecret({
        name: `AILYDIAN Trader (${email})`,
        issuer: 'AILYDIAN',
        length: 32
      });

      // QR kod oluştur
      const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url as string);

      return NextResponse.json({
        success: true,
        secret: secret.base32,
        qrCode: qrCodeDataUrl,
        backupCodes: generateBackupCodes(),
        instructions: {
          tr: [
            '1. Google Authenticator uygulamasını indirin',
            '2. QR kodu tarayın veya manuel olarak gizli anahtarı girin',
            '3. Oluşturulan 6 haneli kodu girerek doğrulayın',
            '4. Yedek kodlarınızı güvenli bir yerde saklayın'
          ],
          en: [
            '1. Download Google Authenticator app',
            '2. Scan QR code or manually enter secret key',
            '3. Verify with the generated 6-digit code',
            '4. Store backup codes in a safe place'
          ]
        }
      });
    }

    if (action === 'verify') {
      const { secret, token } = await request.json();
      
      if (!secret || !token) {
        return NextResponse.json(
          { error: 'Secret ve token gerekli' }, 
          { status: 400 }
        );
      }

      // Token doğrula
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // 30 saniye öncesi/sonrası kabul et
      });

      if (verified) {
        return NextResponse.json({
          success: true,
          message: '2FA başarıyla doğrulandı',
          verified: true
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Geçersiz kod',
          verified: false
        });
      }
    }

    return NextResponse.json(
      { error: 'Geçersiz action' }, 
      { status: 400 }
    );

  } catch (error) {
    console.error('2FA API error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// 2FA token doğrulama (giriş için)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const token = searchParams.get('token');

    if (!secret || !token) {
      return NextResponse.json(
        { error: 'Secret ve token gerekli' }, 
        { status: 400 }
      );
    }

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    return NextResponse.json({
      success: true,
      verified,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Doğrulama hatası' },
      { status: 500 }
    );
  }
}

// Yedek kodlar oluştur
function generateBackupCodes(): string[] {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    codes.push(code);
  }
  return codes;
}
