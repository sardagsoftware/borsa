#!/usr/bin/env node
/**
 * SEO Turkish Meta Tags Update Script
 * Updates HTML pages with Turkish SEO-optimized titles and Open Graph tags
 */

const fs = require('fs');
const path = require('path');

// Turkish SEO-optimized meta tags for each page
const PAGE_META_TAGS = {
  'chat.html': {
    title: 'LyDian Chat - Yapay Zeka Sohbet Asistanı | Çok Modelli AI Sohbet Türkiye',
    description: 'Metin, ses ve görüntü ile akıllı sohbet. Kod üretimi, belge analizi, 40+ dilde ses etkileşimi. Gerçek zamanlı streaming yanıtlar. Multimodal AI sohbet platformu.',
    keywords: 'yapay zeka sohbet, ai chat türkiye, multimodal sohbet, akıllı chat, ses etkileşimi ai, görüntü analizi chat',
    ogTitle: 'LyDian Chat - Multimodal Yapay Zeka Sohbet',
    ogDescription: 'Metin, ses ve görüntü ile akıllı sohbet. 40+ dilde ses etkileşimi, kod üretimi, belge analizi. Gerçek zamanlı AI sohbet.',
    ogImage: '/og-images/chat-preview.jpg'
  },
  'ai-chat.html': {
    title: 'LyDian AI Chat - Akıllı Sohbet Platformu | Multimodal Chat Türkiye',
    description: 'Gelişmiş yapay zeka sohbet platformu. Kod üretimi, belge analizi, görüntü tanıma. 40+ dilde ses ve metin desteği. Multimodal AI chat deneyimi.',
    keywords: 'ai chat, yapay zeka sohbet platformu, kod üretimi ai, belge analizi chat, multimodal sohbet',
    ogTitle: 'LyDian AI Chat - Akıllı Sohbet Platformu',
    ogDescription: 'Kod üretimi, belge analizi, görüntü tanıma. 40+ dilde multimodal AI sohbet deneyimi.',
    ogImage: '/og-images/ai-chat-preview.jpg'
  },
  'lydian-iq.html': {
    title: 'LyDian IQ - Yapay Zeka Destekli IQ Testi | Zeka Ölçüm Platformu Türkiye',
    description: 'Görsel mantık, matematiksel düşünme, uzamsal zeka testleri. Çok boyutlu IQ değerlendirmesi ve kişiselleştirilmiş gelişim önerileri. AI destekli zeka ölçümü.',
    keywords: 'iq testi, yapay zeka iq testi, görsel iq testi, matematiksel düşünme testi, uzamsal zeka, zeka ölçümü ai',
    ogTitle: 'LyDian IQ - AI Destekli Zeka Testi',
    ogDescription: 'Görsel mantık, matematiksel düşünme, uzamsal zeka testleri. Çok boyutlu IQ değerlendirmesi ve kişiselleştirilmiş gelişim önerileri.',
    ogImage: '/og-images/lydian-iq-preview.jpg'
  },
  'medical-expert.html': {
    title: 'LyDian Medical Expert - Tıbbi Yapay Zeka Asistanı | Sağlık AI Türkiye',
    description: 'Nadir hastalık teşhisi, klinik karar desteği, radyoloji analizi, EPIC FHIR entegrasyonu. Orphanet ve OMIM veritabanları destekli tıbbi AI platformu.',
    keywords: 'tıbbi yapay zeka, ai doktor asistan, nadir hastalık teşhisi, klinik karar desteği, radyoloji analizi ai, tıbbi ai türkiye',
    ogTitle: 'LyDian Medical Expert - Tıbbi AI Asistanı',
    ogDescription: 'Nadir hastalık teşhisi, klinik karar desteği, radyoloji analizi. Orphanet ve OMIM veritabanları destekli.',
    ogImage: '/og-images/medical-expert-preview.jpg'
  },
  'legal-expert.html': {
    title: 'LyDian Legal AI - Hukuki Yapay Zeka Danışmanı | Hukuk AI Türkiye',
    description: 'İçtihat arama motoru, sözleşme analizi, hukuki araştırma, belge otomasyonu. Türk ve uluslararası hukuk sistemleri desteği. Hukuki AI danışmanlık.',
    keywords: 'hukuk yapay zeka, ai avukat asistan, içtihat arama, sözleşme analizi ai, hukuki araştırma, belge otomasyonu',
    ogTitle: 'LyDian Legal AI - Hukuki AI Danışman',
    ogDescription: 'İçtihat arama, sözleşme analizi, hukuki araştırma ve belge otomasyonu. Türk ve uluslararası hukuk desteği.',
    ogImage: '/og-images/legal-ai-preview.jpg'
  },
  'ai-advisor-hub.html': {
    title: 'LyDian Advisor Hub - 8 Uzman Yapay Zeka Danışman | İş Danışmanlık AI Türkiye',
    description: 'Kültürel danışman, karar desteği, bilgi asistanı, öğrenme yolu, yaşam koçu, toplantı analizi, girişim hızlandırıcı, sağlık düzenleyici. 8 uzman AI danışman.',
    keywords: 'yapay zeka danışman, iş danışmanlık ai, karar desteği ai, girişim hızlandırıcı, yaşam koçu ai, ai danışmanlık türkiye',
    ogTitle: 'LyDian Advisor Hub - 8 Uzman AI Danışman',
    ogDescription: 'Kültürel danışman, karar desteği, bilgi asistanı, öğrenme yolu, yaşam koçu ve daha fazlası. 8 uzman AI danışman.',
    ogImage: '/og-images/advisor-hub-preview.jpg'
  },
  'lydian-legal-chat.html': {
    title: 'LyDian Legal Chat - Hukuki AI Sohbet | Hukuk Danışmanlık Chat Türkiye',
    description: 'Hukuki sorularınız için yapay zeka destekli sohbet platformu. İçtihat arama, sözleşme analizi, hukuki danışmanlık. Türk hukuk sistemine özel AI chat.',
    keywords: 'hukuki ai sohbet, avukat chat, hukuk danışmanlık ai, içtihat sohbet, sözleşme chat ai',
    ogTitle: 'LyDian Legal Chat - Hukuki AI Sohbet',
    ogDescription: 'Hukuki sorularınız için AI destekli sohbet. İçtihat arama, sözleşme analizi, hukuki danışmanlık.',
    ogImage: '/og-images/legal-chat-preview.jpg'
  }
};

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function updateHTMLMetaTags(htmlPath, fileName) {
  if (!PAGE_META_TAGS[fileName]) {
    console.log(`⏭️  Skipping ${fileName} - no meta tags defined`);
    return;
  }

  console.log(`🔧 Processing ${fileName}...`);

  const html = fs.readFileSync(htmlPath, 'utf8');
  const meta = PAGE_META_TAGS[fileName];

  let updatedHTML = html;

  // Update <title>
  updatedHTML = updatedHTML.replace(
    /<title>.*?<\/title>/,
    `<title>${meta.title}</title>`
  );

  // Update meta description
  updatedHTML = updatedHTML.replace(
    /<meta name="description" content=".*?">/,
    `<meta name="description" content="${meta.description}">`
  );

  // Update meta keywords
  if (updatedHTML.includes('<meta name="keywords"')) {
    updatedHTML = updatedHTML.replace(
      /<meta name="keywords" content=".*?">/,
      `<meta name="keywords" content="${meta.keywords}">`
    );
  } else {
    // Add keywords if not present
    updatedHTML = updatedHTML.replace(
      /<meta name="description".*?>/,
      `$&\n    <meta name="keywords" content="${meta.keywords}">`
    );
  }

  // Update OG tags
  updatedHTML = updatedHTML.replace(
    /<meta property="og:title" content=".*?">/,
    `<meta property="og:title" content="${meta.ogTitle}">`
  );

  updatedHTML = updatedHTML.replace(
    /<meta property="og:description" content=".*?">/,
    `<meta property="og:description" content="${meta.ogDescription}">`
  );

  updatedHTML = updatedHTML.replace(
    /<meta property="og:image" content=".*?">/,
    `<meta property="og:image" content="https://www.ailydian.com${meta.ogImage}">`
  );

  // Update Twitter tags if present
  if (updatedHTML.includes('<meta name="twitter:title"')) {
    updatedHTML = updatedHTML.replace(
      /<meta name="twitter:title" content=".*?">/,
      `<meta name="twitter:title" content="${meta.ogTitle}">`
    );

    updatedHTML = updatedHTML.replace(
      /<meta name="twitter:description" content=".*?">/,
      `<meta name="twitter:description" content="${meta.ogDescription}">`
    );

    updatedHTML = updatedHTML.replace(
      /<meta name="twitter:image" content=".*?">/,
      `<meta name="twitter:image" content="https://www.ailydian.com${meta.ogImage}">`
    );
  }

  fs.writeFileSync(htmlPath, updatedHTML, 'utf8');
  console.log(`✅ Updated ${fileName}`);
}

// Process all priority pages
console.log('🚀 Starting Turkish SEO Meta Tags Update...\n');

Object.keys(PAGE_META_TAGS).forEach(fileName => {
  const htmlPath = path.join(PUBLIC_DIR, fileName);
  if (fs.existsSync(htmlPath)) {
    updateHTMLMetaTags(htmlPath, fileName);
  } else {
    console.log(`⚠️  File not found: ${fileName}`);
  }
});

console.log('\n🎉 Turkish SEO Meta Tags Update Complete!');
console.log('📊 Updated', Object.keys(PAGE_META_TAGS).length, 'pages');
