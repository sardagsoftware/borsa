import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.ailydian.com';
  const lastModified = new Date();

  // Core pages
  const corePages = [
    { url: baseUrl, lastModified, changeFrequency: 'daily' as const, priority: 1.0 },
    {
      url: `${baseUrl}/coklu-yapay-zeka`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/yapay-zeka`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/yapay-zeka-turkiye`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/yapay-zeka-asistani`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/yapay-zeka-kodlama`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
  ];

  // English pages
  const englishPages = [
    { url: `${baseUrl}/en`, lastModified, changeFrequency: 'weekly' as const, priority: 0.9 },
    {
      url: `${baseUrl}/en/multi-ai-platform`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/en/ai-assistant`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
  ];

  // Language alternates for main pages
  const languages = ['tr', 'en', 'de', 'fr', 'ar', 'ru', 'es', 'zh'];
  const languagePages = languages
    .filter(l => l !== 'tr')
    .map(lang => ({
      url: `${baseUrl}/${lang}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  return [...corePages, ...englishPages, ...languagePages];
}
