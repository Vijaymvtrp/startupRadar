import { Injectable, Logger } from '@nestjs/common';
import { SourceConnector } from './connector.interface';
import { DiscoveredItemPreview, SourceCollectionMethod, SourceTestResult } from '@startup-radar/shared-types';
import { SsrfValidator } from './ssrf.guard';
import * as Parser from 'rss-parser';
import axios from 'axios';

@Injectable()
export class RssConnector implements SourceConnector {
  readonly method = SourceCollectionMethod.RSS;
  private readonly logger = new Logger(RssConnector.name);
  private readonly parser = new (Parser as any)({
    headers: { 'User-Agent': 'StartupRadarIndiaBot/1.0 (+https://startupradar.in/bot)' },
    timeout: 10000,
  });

  async testConnection(url: string, config?: any): Promise<SourceTestResult> {
    const start = Date.now();
    try {
      const validatedUrl = await SsrfValidator.validateUrl(url);
      const feed = await this.parser.parseURL(validatedUrl);
      const latencyMs = Date.now() - start;

      const sampleItems = (feed.items || []).slice(0, 5).map((item: any) => ({
        title: item.title?.trim() || 'Untitled Announcement',
        url: item.link || '',
        publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        summary: item.contentSnippet?.slice(0, 300) || item.summary?.slice(0, 300),
        organizer: item.creator || feed.title,
        confidenceScore: 0.95,
      }));

      return {
        success: true,
        reachable: true,
        detectedMethod: SourceCollectionMethod.RSS,
        statusCode: 200,
        latencyMs,
        sampleItemsCount: sampleItems.length,
        sampleItems,
      };
    } catch (err: any) {
      return {
        success: false,
        reachable: false,
        detectedMethod: SourceCollectionMethod.RSS,
        latencyMs: Date.now() - start,
        sampleItemsCount: 0,
        sampleItems: [],
        errorMessage: `RSS parsing failed: ${err.message}`,
      };
    }
  }

  async discoverItems(url: string, config?: any): Promise<DiscoveredItemPreview[]> {
    const validatedUrl = await SsrfValidator.validateUrl(url);
    const feed = await this.parser.parseURL(validatedUrl);

    return (feed.items || []).map((item: any) => ({
      title: item.title?.trim() || 'Untitled Announcement',
      url: item.link || '',
      publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
      summary: item.contentSnippet?.slice(0, 400) || item.summary?.slice(0, 400),
      organizer: item.creator || feed.title,
      confidenceScore: 0.95,
    }));
  }
}
