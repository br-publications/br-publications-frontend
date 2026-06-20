import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'bingbot',
        crawlDelay: 10,
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/user/register', '/user/login'],
      }
    ],
    sitemap: 'https://www.brpublications.com/sitemap.xml',
  };
}
