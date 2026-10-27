import { BadRequestException } from '@nestjs/common';
import * as dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

export class SsrfValidator {
  private static readonly BLOCKED_IP_PATTERNS = [
    /^127\./,                         // Loopback
    /^10\./,                          // Private class A
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private class B
    /^192\.168\./,                    // Private class C
    /^169\.254\./,                    // Link-local / Cloud metadata (AWS, GCP, Azure)
    /^0\./,                           // Zero addresses
    /^localhost$/i,
    /^::1$/,                          // IPv6 loopback
    /^fc00:/i,                        // IPv6 unique local
    /^fe80:/i,                        // IPv6 link-local
  ];

  static async validateUrl(urlString: string, allowedDomains?: string[]): Promise<string> {
    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException('Only HTTP and HTTPS protocols are permitted');
    }

    const hostname = parsed.hostname;

    // Check allowed domains if specified
    if (allowedDomains && allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some((domain) =>
        hostname === domain || hostname.endsWith(`.${domain}`)
      );
      if (!isAllowed) {
        throw new BadRequestException(`Domain ${hostname} is not in the allowed domains list`);
      }
    }

    // SSRF Check against blocked hostnames
    if (this.BLOCKED_IP_PATTERNS.some((pattern) => pattern.test(hostname))) {
      throw new BadRequestException('Access to private or local network hosts is strictly prohibited');
    }

    // DNS Lookup check to prevent DNS rebinding to internal IPs
    try {
      const lookupResult = await dnsLookup(hostname);
      const ip = lookupResult.address;

      if (this.BLOCKED_IP_PATTERNS.some((pattern) => pattern.test(ip))) {
        throw new BadRequestException(`Host resolved to blocked IP address (${ip})`);
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`Failed to resolve DNS for ${hostname}: ${err.message}`);
    }

    return parsed.toString();
  }
}
