import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import JsonLd from '@/components/JsonLd';

describe('JsonLd', () => {
  it('应输出 application/ld+json 且内容为 JSON 序列化', () => {
    const data = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'test' };
    const { container } = render(<JsonLd data={data} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(JSON.parse(script!.textContent || '')).toEqual(data);
  });
});
