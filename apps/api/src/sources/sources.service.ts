import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectorRegistryService } from '../connectors/connector-registry.service';
import { QueueService } from '../queue/queue.service';
import { CreateSourceDto, TestSourceDto } from './sources.dto';
import {
  OpportunityCategory,
  SourceCollectionMethod,
  SourceHealthStatus,
  SourcePriority,
  SourceRunStatus,
} from '@startup-radar/shared-types';
import { SsrfValidator } from '../connectors/ssrf.guard';

@Injectable()
export class SourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly connectorRegistry: ConnectorRegistryService,
    private readonly queueService: QueueService,
  ) {}

  async listSources(status?: SourceHealthStatus) {
    const where = status ? { healthStatus: status as any } : {};
    return this.prisma.source.findMany({
      where,
      include: {
        config: true,
        _count: {
          select: { runs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSource(id: string) {
    const source = await this.prisma.source.findUnique({
      where: { id },
      include: {
        config: true,
        runs: {
          take: 10,
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!source) {
      throw new NotFoundException(`Source with ID ${id} not found`);
    }

    return source;
  }

  async testSource(dto: TestSourceDto) {
    const validatedUrl = await SsrfValidator.validateUrl(dto.baseUrl);
    const method = dto.collectionMethod || SourceCollectionMethod.AUTO_DETECT;

    return this.connectorRegistry.testSource(validatedUrl, method, dto.config);
  }

  async createSource(dto: CreateSourceDto) {
    // 1. SSRF and Domain validation
    const validatedUrl = await SsrfValidator.validateUrl(dto.baseUrl, dto.allowedDomains);
    const parsedUrl = new URL(validatedUrl);

    const allowedDomains =
      dto.allowedDomains && dto.allowedDomains.length > 0
        ? dto.allowedDomains
        : [parsedUrl.hostname];

    // 2. Test connectivity before saving
    const testResult = await this.connectorRegistry.testSource(
      validatedUrl,
      dto.collectionMethod,
      dto.config,
    );

    const initialHealth = testResult.success
      ? SourceHealthStatus.HEALTHY
      : SourceHealthStatus.CONFIGURING;

    const effectiveMethod =
      dto.collectionMethod === SourceCollectionMethod.AUTO_DETECT && testResult.detectedMethod
        ? testResult.detectedMethod
        : dto.collectionMethod;

    // 3. Create Source record
    const source = await this.prisma.source.create({
      data: {
        name: dto.name.trim(),
        baseUrl: validatedUrl,
        allowedDomains,
        category: (dto.category || OpportunityCategory.GOVERNMENT_SCHEME) as any,
        collectionMethod: effectiveMethod as any,
        priority: (dto.priority || SourcePriority.MEDIUM) as any,
        checkFrequencyMinutes: dto.checkFrequencyMinutes || 1440,
        rateLimitPerMinute: dto.rateLimitPerMinute || 10,
        healthStatus: initialHealth as any,
        countryCode: dto.countryCode || 'IN',
        stateCode: dto.stateCode?.trim(),
        city: dto.city?.trim(),
        notes: dto.notes?.trim(),
        lastCheckedAt: new Date(),
        lastSuccessAt: testResult.success ? new Date() : null,
        lastError: testResult.errorMessage || null,
        config: dto.config
          ? {
              create: {
                apiEndpoint: dto.config.apiEndpoint,
                feedUrl: dto.config.feedUrl,
                sitemapUrl: dto.config.sitemapUrl,
                htmlListingSelector: dto.config.htmlListingSelector,
                htmlTitleSelector: dto.config.htmlTitleSelector,
                htmlLinkSelector: dto.config.htmlLinkSelector,
              },
            }
          : undefined,
      },
      include: { config: true },
    });

    return {
      message: 'Source registered successfully',
      source,
      testResult,
    };
  }

  async triggerRun(sourceId: string) {
    const source = await this.getSource(sourceId);

    // 1. Create a SourceRun record with status QUEUED
    const run = await this.prisma.sourceRun.create({
      data: {
        sourceId: source.id,
        status: SourceRunStatus.QUEUED as any,
      },
    });

    // 2. Enqueue in BullMQ
    await this.queueService.enqueueSourceCollection(source.id, run.id);

    return {
      message: `Collection job queued for source: ${source.name}`,
      runId: run.id,
      sourceId: source.id,
    };
  }

  async listRuns(sourceId?: string) {
    const where = sourceId ? { sourceId } : {};
    return this.prisma.sourceRun.findMany({
      where,
      include: {
        source: {
          select: { name: true, baseUrl: true, collectionMethod: true },
        },
      },
      take: 50,
      orderBy: { startedAt: 'desc' },
    });
  }
}
