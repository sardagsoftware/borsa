/**
const { applySanitization } = require('./_middleware/sanitize');

 * Custom 404 Handler
 * Serves the 404 page with proper 404 status code
 * Catch-all rewrite in vercel.json routes unmatched paths here
 */

module.exports = function handler(req, res) {
  applySanitization(req, res);
  res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8').end(`<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sayfa Bulunamadi — LyDian AI</title>
    <meta name="description" content="Aradiginiz sayfa bulunamadi. LyDian AI ana sayfasina donebilirsiniz." />
    <meta name="robots" content="noindex, nofollow" />
    <link rel="canonical" href="https://www.ailydian.com/" />
    <link rel="icon" type="image/png" href="/icons/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="/icons/favicon-16x16.png" sizes="16x16" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            text-align: center;
            padding: 20px;
        }
        .container { max-width: 520px; }
        .error-code {
            font-size: 120px;
            font-weight: 800;
            line-height: 1;
            background: linear-gradient(135deg, #8b5cf6, #a78bfa, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 16px;
        }
        h1 { font-size: 24px; font-weight: 600; color: #f5f5f5; margin-bottom: 12px; }
        p { font-size: 16px; color: #9ca3af; line-height: 1.6; margin-bottom: 32px; }
        .buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        a {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 12px 24px; border-radius: 10px; font-size: 15px;
            font-weight: 500; text-decoration: none; transition: all 0.2s ease;
        }
        .btn-primary { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #fff; }
        .btn-primary:hover { background: linear-gradient(135deg, #8b5cf6, #7c3aed); transform: translateY(-1px); }
        .btn-secondary { background: rgba(255,255,255,0.06); color: #d1d5db; border: 1px solid rgba(255,255,255,0.1); }
        .btn-secondary:hover { background: rgba(255,255,255,0.1); transform: translateY(-1px); }
        @media (max-width: 480px) {
            .error-code { font-size: 80px; }
            h1 { font-size: 20px; }
            p { font-size: 14px; }
            .buttons { flex-direction: column; }
            a { justify-content: center; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-code">404</div>
        <h1>Sayfa Bulunamadi</h1>
        <p>Aradiginiz sayfa mevcut degil, tasindi veya kaldirildi. Ana sayfaya donerek devam edebilirsiniz.</p>
        <div class="buttons">
            <a href="/" class="btn-primary">Ana Sayfa</a>
            <a href="/chat" class="btn-secondary">AI Sohbet</a>
        </div>
    </div>
</body>
</html>`);
};
