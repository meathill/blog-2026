import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';

describe('robots metadata route', () => {
  it('should return valid robots configuration', () => {
    const config = robots();
    expect(config).toBeDefined();
    expect(config.sitemap).toBe('https://meathill.com/sitemap.xml');
  });

  it('should allow all crawlers on root with specific disallow paths', () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const defaultRule = rules.find((r) => r.userAgent === '*');
    expect(defaultRule).toBeDefined();
    expect(defaultRule?.allow).toBe('/');
    expect(defaultRule?.disallow).toEqual(expect.arrayContaining(['/api/', '/_next/', '/search']));
  });

  it('should explicitly support both AhrefsSiteAudit and AhrefsBot with tag disallow to protect quota', () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const ahrefsRule = rules.find((r) => {
      if (Array.isArray(r.userAgent)) {
        return r.userAgent.includes('AhrefsSiteAudit') && r.userAgent.includes('AhrefsBot');
      }
      return r.userAgent === 'AhrefsSiteAudit' || r.userAgent === 'AhrefsBot';
    });

    expect(ahrefsRule).toBeDefined();
    expect(ahrefsRule?.allow).toBe('/');
    expect(ahrefsRule?.disallow).toEqual(expect.arrayContaining(['/api/', '/_next/', '/search', '/tag/', '/en/tag/']));
  });
});
