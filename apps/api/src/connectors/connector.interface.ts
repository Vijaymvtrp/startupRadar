import { DiscoveredItemPreview, SourceTestResult, SourceCollectionMethod } from '@startup-radar/shared-types';

export interface SourceConnector {
  readonly method: SourceCollectionMethod;
  testConnection(url: string, config?: any): Promise<SourceTestResult>;
  discoverItems(url: string, config?: any): Promise<DiscoveredItemPreview[]>;
}
