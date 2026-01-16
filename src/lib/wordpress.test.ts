import { describe, it, expect } from 'vitest';
import { stripHtml, calculateReadingTime, formatDate } from './wordpress';

describe('wordpress utils', () => {
  describe('stripHtml', () => {
    it('应该移除 HTML 标签', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      expect(stripHtml(html)).toBe('Hello World');
    });

    it('应该处理 HTML 实体', () => {
      const html = '&lt;div&gt; &amp; &quot;test&quot;';
      expect(stripHtml(html)).toBe('<div> & "test"');
    });

    it('应该处理空字符串', () => {
      expect(stripHtml('')).toBe('');
    });
  });

  describe('calculateReadingTime', () => {
    it('应该计算中文阅读时间', () => {
      const content = '这是一段测试文本'.repeat(100); // 800 字
      expect(calculateReadingTime(content)).toBe(2); // 800 / 400 = 2 分钟
    });

    it('最少返回 1 分钟', () => {
      const content = '短文';
      expect(calculateReadingTime(content)).toBe(1);
    });

    it('应该忽略 HTML 标签', () => {
      const content = '<p>测试</p>'.repeat(200);
      const time = calculateReadingTime(content);
      expect(time).toBeGreaterThan(0);
    });
  });

  describe('formatDate', () => {
    it('应该格式化日期为 YYYY-MM-DD', () => {
      expect(formatDate('2025-11-23T10:30:00')).toBe('2025-11-23');
    });

    it('应该处理带时区的日期', () => {
      expect(formatDate('2025-11-23T10:30:00+08:00')).toBe('2025-11-23');
    });
  });
});
