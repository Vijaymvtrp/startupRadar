import { Injectable, Logger } from '@nestjs/common';
import { SourceConnector } from './connector.interface';
import { DiscoveredItemPreview, SourceCollectionMethod, SourceTestResult } from '@startup-radar/shared-types';
import { SsrfValidator } from './ssrf.guard';
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';

@Injectable()
export class SitemapConnector implements SourceConnector {
  readonly method = SourceCollectionMethod.SITEMAP;
  private readonly logger = new Logger(SitemapConnector.name);
  private readonly xmlParser = new XMLParser({ ignoreAttributes: false });

  async testConnection(url: string, config?: any): Promise<SourceTestResult> {
    const start = Date.now();
    try {
      const validatedUrl = await SsrfValidator.validateUrl(url);
      const res = await axios.get(validatedUrl, {
        headers: { 'User-Agent': 'StartupRadarIndiaBot/1.0' },
        timeout: 10000,
        maxContentLength: 5 * 1024 * 1024,
      });

      const latencyMs = Date.now() - start;
      const parsed = this.xmlParser.parse(res.data);
      const urlEntries = parsed.urlset?.url || [];
      const entries = Array.isArray(urlEntries) ? urlEntries : [urlEntries];

      const sampleItems = entries.slice(0, 5).filter((u: any) => !!u?.loc).map((u: any) => ({
        title: this.deriveTitleFromUrl(u.loc),
        url: u.loc,
        publishedAt: u.lastmod ? new Date(u.lastmod) : undefined,
        confidenceScore: 0.85,
      }));

      return {
        success: true,
        reachable: true,
        detectedMethod: SourceCollectionMethod.SITEMAP,
        statusCode: res.status,
        latencyMs,
        sampleItemsCount: sampleItems.length,
        sampleItems,
      };
    } catch (err: any) {
      return {
        success: false,
        reachable: false,
        detectedMethod: SourceCollectionMethod.SITEMAP,
        latencyMs: Date.now() - start,
        sampleItemsCount: 0,
        sampleItems: [],
        errorMessage: `Sitemap check failed: ${err.message}`,
      };
    }
  }

  async discoverItems(url: string, config?: any): Promise<DiscoveredItemPreview[]> {
    const validatedUrl = await SsrfValidator.validateUrl(url);
    const res = await axios.get(validatedUrl, {
      headers: { 'User-Agent': 'StartupRadarIndiaBot/1.0' },
      timeout: 15000,
      maxContentLength: 10 * 1024 * 1024,
    });

    const parsed = this.xmlParser.parse(res.data);
    const urlEntries = parsed.urlset?.url || [];
    const entries = Array.isArray(urlEntries) ? urlEntries : [urlEntries];

    return entries.filter((u: any) => !!u?.loc).map((u: any) => ({
      title: this.deriveTitleFromUrl(u.loc),
      url: u.loc,
      publishedAt: u.lastmod ? new Date(u.lastmod) : undefined,
      confidenceScore: 0.85,
    }));
  }

  private deriveTitleFromUrl(urlString: string): string {
    try {
      const parsed = new URL(urlString);
      const parts = parsed.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1] || 'Program Page';
      return last
        .replace(/[-_]/g, ' ')
        .replace(/\.(html|php|aspx|pdf)$/i, '')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    } catch {
      return urlString;
    }
  }
}
