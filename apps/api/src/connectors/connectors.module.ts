import { Module } from '@nestjs/common';
import { RssConnector } from './rss.connector';
import { SitemapConnector } from './sitemap.connector';
import { HtmlConnector } from './html.connector';
import { ConnectorRegistryService } from './connector-registry.service';

@Module({
  providers: [RssConnector, SitemapConnector, HtmlConnector, ConnectorRegistryService],
  exports: [ConnectorRegistryService],
})
export class ConnectorsModule {}
