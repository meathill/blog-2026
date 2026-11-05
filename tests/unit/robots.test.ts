import { describe, expect, it } from 'vitest';
import { GET, generateRobotsTxt } from '@/app/robots.txt/route';

describe('robots.txt route handler', () => {
  it('should return valid robots text with Content-Signal in default group', () => {
    const text = generateRobotsTxt();
    expect(text).toContain('User-Agent: *');
    expect(text).toContain('Content-Signal: ai-train=no, search=yes, ai-input=yes');
    expect(text).toContain('Allow: /');
    expect(text).toContain('Disallow: /api/');
    expect(text).toContain('Disallow: /_next/');
    expect(text).toContain('Disallow: /search');
    expect(text).toContain('Sitemap: https://meathill.com/sitemap.xml');
  });

  it('should explicitly support both AhrefsSiteAudit and AhrefsBot with tag disallow to protect quota', () => {
    const text = generateRobotsTxt();
    expect(text).toContain('User-Agent: AhrefsSiteAudit');
    expect(text).toContain('User-Agent: AhrefsBot');
    expect(text).toContain('Disallow: /tag/');
    expect(text).toContain('Disallow: /en/tag/');
  });

  it('GET handler should return 200 with text/plain charset utf-8', async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    const body = await res.text();
    expect(body).toBe(generateRobotsTxt());
  });
});
