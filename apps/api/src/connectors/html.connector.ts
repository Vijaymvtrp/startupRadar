import { Injectable, Logger } from '@nestjs/common';
import { SourceConnector } from './connector.interface';
import { DiscoveredItemPreview, SourceCollectionMethod, SourceTestResult } from '@startup-radar/shared-types';
import { SsrfValidator } from './ssrf.guard';
import * as cheerio from 'cheerio';
import axios from 'axios';

@Injectable()
export class HtmlConnector implements SourceConnector {
  readonly method = SourceCollectionMethod.HTML;
  private readonly logger = new Logger(HtmlConnector.name);

  async testConnection(url: string, config?: any): Promise<SourceTestResult> {
    const start = Date.now();
    try {
      const validatedUrl = await SsrfValidator.validateUrl(url);
      const res = await axios.get(validatedUrl, {
        headers: { 'User-Agent': 'StartupRadarIndiaBot/1.0 (+https://startupradar.in)' },
        timeout: 10000,
        maxContentLength: 5 * 1024 * 1024,
      });

      const latencyMs = Date.now() - start;
      const $ = cheerio.load(res.data);

      const items = this.extractItems($, validatedUrl, config);

      return {
        success: true,
        reachable: true,
        detectedMethod: SourceCollectionMethod.HTML,
        statusCode: res.status,
        latencyMs,
        sampleItemsCount: items.length,
        sampleItems: items.slice(0, 5),
      };
    } catch (err: any) {
      return {
        success: false,
        reachable: false,
        detectedMethod: SourceCollectionMethod.HTML,
        latencyMs: Date.now() - start,
        sampleItemsCount: 0,
        sampleItems: [],
        errorMessage: `HTML extraction failed: ${err.message}`,
      };
    }
  }

  async discoverItems(url: string, config?: any): Promise<DiscoveredItemPreview[]> {
    const validatedUrl = await SsrfValidator.validateUrl(url);
    const res = await axios.get(validatedUrl, {
      headers: { 'User-Agent': 'StartupRadarIndiaBot/1.0' },
      timeout: 15000,
      maxContentLength: 5 * 1024 * 1024,
    });

    const $ = cheerio.load(res.data);
    return this.extractItems($, validatedUrl, config);
  }

  private extractItems($: cheerio.CheerioAPI, baseUrl: string, config?: any): DiscoveredItemPreview[] {
    const items: DiscoveredItemPreview[] = [];
    const baseObj = new URL(baseUrl);

    // If custom CSS selectors are provided in SourceConfig
    if (config?.htmlListingSelector) {
      $(config.htmlListingSelector).each((_, el) => {
        const title = config.htmlTitleSelector
          ? $(el).find(config.htmlTitleSelector).text().trim()
          : $(el).text().trim().slice(0, 100);

        const href = config.htmlLinkSelector
          ? $(el).find(config.htmlLinkSelector).attr('href')
          : $(el).find('a').attr('href');

        if (title && href) {
          const itemUrl = new URL(href, baseObj.origin).toString();
          items.push({
            title,
            url: itemUrl,
            confidenceScore: 0.9,
          });
        }
      });
      return items;
    }

    // Default heuristic: find all anchor links with relevant announcement keywords
    const keywords = ['scheme', 'grant', 'incubator', 'challenge', 'tender', 'program', 'accelerator', 'competition', 'hackathon'];
    $('a').each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');

      if (text.length > 10 && href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        const lower = text.toLowerCase();
        const matchesKeyword = keywords.some((kw) => lower.includes(kw));

        if (matchesKeyword) {
          try {
            const itemUrl = new URL(href, baseObj.origin).toString();
            // avoid duplicate URLs in list
            if (!items.some((i) => i.url === itemUrl)) {
              items.push({
                title: text.replace(/\s+/g, ' ').slice(0, 150),
                url: itemUrl,
                confidenceScore: 0.75,
              });
            }
          } catch {
            // invalid URL format, ignore
          }
        }
      }
    });

    return items;
  }
}
