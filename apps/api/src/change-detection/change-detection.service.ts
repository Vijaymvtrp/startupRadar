import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

export interface ChangeDetectionResult {
  hasChanged: boolean;
  changeType: '304_NOT_MODIFIED' | 'IDENTICAL_HASH' | 'CONTENT_MODIFIED' | 'INITIAL_FETCH';
  statusCode: number;
  etag?: string;
  lastModified?: string;
  contentHash: string;
  normalizedContent: string;
}

@Injectable()
export class ChangeDetectionService {
  private readonly logger = new Logger(ChangeDetectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Normalizes raw HTML content by removing dynamic, volatile elements
   * (ads, counters, timestamps, navigations) to prevent false positive change alerts.
   */
  normalizeContent(html: string): string {
    const $ = cheerio.load(html);

    // Strip volatile and irrelevant elements
    $('script, style, noscript, nav, footer, header, svg, iframe, form').remove();
    $('.ad, .ads, .advertisement, #cookie-banner, .social-share, .comments').remove();

    // Remove comments
    $('*')
      .contents()
      .filter((_, el) => el.type === 'comment')
      .remove();

    // Get cleaned text and normalize whitespace
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return text;
  }

  /**
   * Generates SHA-256 hash of normalized text
   */
  computeHash(text: string): string {
    return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
  }

  /**
   * Performs conditional fetch using ETag / Last-Modified, normalizes content,
   * compares with stored hash in source_checks, and updates provenance.
   */
  async checkUrl(sourceId: string, url: string): Promise<ChangeDetectionResult> {
    // 1. Retrieve previous check for this URL if exists
    const previousCheck = await this.prisma.sourceCheck.findFirst({
      where: { sourceId, url },
      orderBy: { lastCheckedAt: 'desc' },
    });

    const headers: Record<string, string> = {
      'User-Agent': 'StartupRadarIndiaBot/1.0 (+https://startupradar.in)',
    };

    if (previousCheck?.etag) {
      headers['If-None-Match'] = previousCheck.etag;
    }
    if (previousCheck?.lastModified) {
      headers['If-Modified-Since'] = previousCheck.lastModified;
    }

    try {
      const response = await axios.get(url, {
        headers,
        timeout: 10000,
        validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
      });

      // Handle 304 Not Modified
      if (response.status === 304) {
        await this.prisma.sourceCheck.upsert({
          where: { id: previousCheck?.id || 'temp-check' },
          create: {
            sourceId,
            url,
            statusCode: 304,
            etag: previousCheck?.etag,
            lastModified: previousCheck?.lastModified,
            contentHash: previousCheck?.contentHash,
            checkStatus: 'SUCCESS',
            lastCheckedAt: new Date(),
          },
          update: {
            statusCode: 304,
            lastCheckedAt: new Date(),
          },
        });

        return {
          hasChanged: false,
          changeType: '304_NOT_MODIFIED',
          statusCode: 304,
          etag: previousCheck?.etag || undefined,
          lastModified: previousCheck?.lastModified || undefined,
          contentHash: previousCheck?.contentHash || '',
          normalizedContent: '',
        };
      }

      // Handle 200 OK
      const rawHtml = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const normalizedContent = this.normalizeContent(rawHtml);
      const newHash = this.computeHash(normalizedContent);

      const etag = response.headers['etag'] as string | undefined;
      const lastModified = response.headers['last-modified'] as string | undefined;

      const isInitial = !previousCheck || !previousCheck.contentHash;
      const isIdentical = previousCheck?.contentHash === newHash;

      let changeType: ChangeDetectionResult['changeType'] = 'CONTENT_MODIFIED';
      if (isInitial) {
        changeType = 'INITIAL_FETCH';
      } else if (isIdentical) {
        changeType = 'IDENTICAL_HASH';
      }

      // Record check in source_checks
      if (previousCheck) {
        await this.prisma.sourceCheck.update({
          where: { id: previousCheck.id },
          data: {
            statusCode: response.status,
            etag,
            lastModified,
            contentHash: newHash,
            lastCheckedAt: new Date(),
            lastChangedAt: changeType === 'CONTENT_MODIFIED' ? new Date() : previousCheck.lastChangedAt,
          },
        });
      } else {
        await this.prisma.sourceCheck.create({
          data: {
            sourceId,
            url,
            statusCode: response.status,
            etag,
            lastModified,
            contentHash: newHash,
            checkStatus: 'SUCCESS',
            lastCheckedAt: new Date(),
            lastChangedAt: new Date(),
          },
        });
      }

      return {
        hasChanged: changeType === 'CONTENT_MODIFIED' || changeType === 'INITIAL_FETCH',
        changeType,
        statusCode: response.status,
        etag,
        lastModified,
        contentHash: newHash,
        normalizedContent,
      };
    } catch (err: any) {
      this.logger.error(`Change detection failed for ${url}: ${err.message}`);
      throw err;
    }
  }
}
