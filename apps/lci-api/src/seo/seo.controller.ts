// LCI API - SEO Controller
// White-hat: Public endpoints for sitemap, robots.txt, and meta data

import { Controller, Get, Param, Header } from '@nestjs/common';
import { SeoService } from './seo.service';

@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  /**
   * GET /seo/sitemap.xml
   * Returns XML sitemap for search engines
   * Public endpoint (no auth required)
   */
  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  @Header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
  async getSitemap(): Promise<string> {
    return this.seoService.generateSitemap();
  }

  /**
   * GET /seo/robots.txt
   * Returns robots.txt for crawler rules
   * Public endpoint (no auth required)
   */
  @Get('robots.txt')
  @Header('Content-Type', 'text/plain')
  @Header('Cache-Control', 'public, max-age=86400') // Cache for 24 hours
  getRobotsTxt(): string {
    return this.seoService.generateRobotsTxt();
  }

  /**
   * GET /seo/meta/complaint/:id
   * Returns meta tags for a complaint page
   * Used by frontend for dynamic meta tags
   */
  @Get('meta/complaint/:id')
  @Header('Cache-Control', 'public, max-age=1800') // Cache for 30 minutes
  async getComplaintMeta(@Param('id') id: string) {
    const meta = await this.seoService.getComplaintMeta(id);
    if (!meta) {
      return {
        error: 'Complaint not found or not public',
        statusCode: 404,
      };
    }
    return meta;
  }

  /**
   * GET /seo/meta/brand/:slug
   * Returns meta tags for a brand page
   * Used by frontend for dynamic meta tags
   */
  @Get('meta/brand/:slug')
  @Header('Cache-Control', 'public, max-age=1800') // Cache for 30 minutes
  async getBrandMeta(@Param('slug') slug: string) {
    const meta = await this.seoService.getBrandMeta(slug);
    if (!meta) {
      return {
        error: 'Brand not found',
        statusCode: 404,
      };
    }
    return meta;
  }
}
