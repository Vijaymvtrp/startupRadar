import { Injectable, Logger } from '@nestjs/common';
import { RssConnector } from './rss.connector';
import { SitemapConnector } from './sitemap.connector';
import { HtmlConnector } from './html.connector';
import { SourceCollectionMethod, SourceTestResult, DiscoveredItemPreview } from '@startup-radar/shared-types';
import { SsrfValidator } from './ssrf.guard';
import axios from 'axios';

@Injectable()
export class ConnectorRegistryService {
  private readonly logger = new Logger(ConnectorRegistryService.name);

  constructor(
    private readonly rssConnector: RssConnector,
    private readonly sitemapConnector: SitemapConnector,
    private readonly htmlConnector: HtmlConnector,
  ) {}

  async testSource(url: string, method: SourceCollectionMethod, config?: any): Promise<SourceTestResult> {
    const validatedUrl = await SsrfValidator.validateUrl(url);

    if (method === SourceCollectionMethod.RSS) {
      return this.rssConnector.testConnection(validatedUrl, config);
    }
    if (method === SourceCollectionMethod.SITEMAP) {
      return this.sitemapConnector.testConnection(validatedUrl, config);
    }
    if (method === SourceCollectionMethod.HTML) {
      return this.htmlConnector.testConnection(validatedUrl, config);
    }

    // Auto-detect method
    return this.autoDetectAndTest(validatedUrl);
  }

  async discover(url: string, method: SourceCollectionMethod, config?: any): Promise<DiscoveredItemPreview[]> {
    const validatedUrl = await SsrfValidator.validateUrl(url);

    switch (method) {
      case SourceCollectionMethod.RSS:
        return this.rssConnector.discoverItems(validatedUrl, config);
      case SourceCollectionMethod.SITEMAP:
        return this.sitemapConnector.discoverItems(validatedUrl, config);
      case SourceCollectionMethod.HTML:
      default:
        return this.htmlConnector.discoverItems(validatedUrl, config);
    }
  }

  private async autoDetectAndTest(url: string): Promise<SourceTestResult> {
    // 1. First test if URL is a direct RSS/Atom feed
    const rssResult = await this.rssConnector.testConnection(url);
    if (rssResult.success && rssResult.sampleItemsCount > 0) {
      return rssResult;
    }

    // 2. Check if URL ends with .xml or mentions sitemap
    if (url.endsWith('.xml') || url.includes('sitemap')) {
      const sitemapResult = await this.sitemapConnector.testConnection(url);
      if (sitemapResult.success) {
        return sitemapResult;
      }
    }

    // 3. Fallback to HTML connector
    const htmlResult = await this.htmlConnector.testConnection(url);
    htmlResult.detectedMethod = SourceCollectionMethod.HTML;
    return htmlResult;
  }
}
