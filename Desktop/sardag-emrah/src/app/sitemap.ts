import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.ukalai.ai';
  const currentDate = new Date();

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/market`,
      lastModified: currentDate,
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/charts`,
      lastModified: currentDate,
      changeFrequency: 'always',
      priority: 0.9,
    },
  ];
}
