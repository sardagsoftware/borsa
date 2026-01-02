#!/usr/bin/env node

const fs = require('fs');

// Read the grape logo SVG from live site
const grapeLogoSVG = fs.readFileSync('public/icons/grape-icon-simple.svg', 'utf8');

// Create an HTML file that will render the PWA icon
const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PWA Icon Generator</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #f0f0f0;
      font-family: Arial, sans-serif;
    }
    #icon-container {
      width: 512px;
      height: 512px;
      background: #1C2536;
      border-radius: 64px;
      position: relative;
      margin: 20px auto;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    #grape-logo {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -55%);
      width: 340px;
      height: 340px;
    }
    #lydian-text {
      position: absolute;
      bottom: 42px;
      left: 50%;
      transform: translateX(-50%);
      color: #FFFFFF;
      font-size: 42px;
      font-weight: 300;
      letter-spacing: 6px;
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    }
    .instructions {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .instructions h2 {
      margin-top: 0;
      color: #1C2536;
    }
    .instructions ol {
      line-height: 1.8;
    }
    .instructions code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="instructions">
    <h2>📱 PWA Icon Generator</h2>
    <p>Bu sayfa PWA ikonunuzu oluşturmak için hazırlandı. Aşağıdaki adımları takip edin:</p>
    <ol>
      <li>Aşağıdaki ikonu sağ tıklayın</li>
      <li>"Resmi Farklı Kaydet" veya "Save Image As" seçin</li>
      <li><code>pwa-icon-512.png</code> olarak kaydedin</li>
      <li>Dosyayı <code>public/icons/</code> klasörüne taşıyın</li>
    </ol>
    <p><strong>Not:</strong> İkonu tam 512x512 boyutunda kaydettiğinizden emin olun.</p>
  </div>

  <div id="icon-container">
    <div id="grape-logo">${grapeLogoSVG}</div>
    <div id="lydian-text">LyDian</div>
  </div>

  <div class="instructions">
    <p><strong>Alternatif:</strong> macOS'ta ekran görüntüsü almak için:</p>
    <ol>
      <li>Cmd + Shift + 4 + Space tuşlarına basın</li>
      <li>İkon kutusunun üzerine gelin</li>
      <li>Tıklayarak ekran görüntüsü alın</li>
    </ol>
  </div>

  <script>
    // Adjust SVG size after load
    window.addEventListener('load', function() {
      const svgElements = document.querySelectorAll('#grape-logo svg');
      svgElements.forEach(svg => {
        svg.setAttribute('width', '340');
        svg.setAttribute('height', '340');
      });
    });
  </script>
</body>
</html>`;

// Write HTML file
const outputPath = '/tmp/pwa-icon-generator.html';
fs.writeFileSync(outputPath, html);

console.log('✅ PWA Icon Generator created!');
console.log('\n📂 File:', outputPath);
console.log('\n🌐 Opening in browser...\n');

// Open in browser
const { execSync } = require('child_process');
execSync(`open "${outputPath}"`);

console.log('📸 Take a screenshot of the icon and save it as:');
console.log('   public/icons/pwa-icon-512.png\n');
