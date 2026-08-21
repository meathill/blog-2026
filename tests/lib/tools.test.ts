import { describe, expect, it } from 'vitest';
import { getAllTools, localizeTool, TOOLS_BASE_URL, type Localized } from '@/lib/tools';

describe('tools module', () => {
  it('should return all predefined tools', () => {
    const tools = getAllTools();
    expect(tools.length).toBeGreaterThanOrEqual(5);
    expect(tools.some((t) => t.path === '/tools/image-converter')).toBe(true);
    expect(tools.some((t) => t.path === '/tools/pdf-text-editor')).toBe(true);
  });

  it('should have tools base url configured', () => {
    expect(TOOLS_BASE_URL).toBe('https://tools.meathill.com');
  });

  describe('localizeTool', () => {
    const testLocalized: Localized = {
      zh: '中文名称',
      en: 'English Name',
      ja: '日本語名',
      es: 'Nombre en Español',
    };

    it('should localize to zh for zh locale', () => {
      expect(localizeTool(testLocalized, 'zh')).toBe('中文名称');
    });

    it('should localize to en for en locale', () => {
      expect(localizeTool(testLocalized, 'en')).toBe('English Name');
    });

    it('should localize to ja for ja locale when available', () => {
      expect(localizeTool(testLocalized, 'ja')).toBe('日本語名');
    });

    it('should localize to es for es locale when available', () => {
      expect(localizeTool(testLocalized, 'es')).toBe('Nombre en Español');
    });

    it('should fallback to en or zh if requested locale is missing', () => {
      const partial: Localized = { zh: '仅中文', en: 'English Only' };
      expect(localizeTool(partial, 'ja')).toBe('English Only');
      expect(localizeTool(partial, 'fr')).toBe('English Only');
    });
  });

  describe('tools keyword coverage', () => {
    it('should contain image conversion keywords in image-converter tool', () => {
      const tools = getAllTools();
      const imageTool = tools.find((t) => t.path === '/tools/image-converter');
      expect(imageTool).toBeDefined();
      if (imageTool) {
        expect(imageTool.description.zh).toContain('WebP');
        expect(imageTool.description.zh).toContain('BMP');
        expect(imageTool.description.en).toContain('BMP');
        expect(imageTool.description.es).toContain('BMP');
        expect(imageTool.description.ja).toContain('WebP');
      }
    });

    it('should contain japanese pdf editor keywords in pdf-text-editor tool', () => {
      const tools = getAllTools();
      const pdfTool = tools.find((t) => t.path === '/tools/pdf-text-editor');
      expect(pdfTool).toBeDefined();
      if (pdfTool) {
        expect(pdfTool.name.ja).toContain('PDF');
        expect(pdfTool.description.ja).toContain('PDF');
        expect(pdfTool.description.ja).toContain('エディタ');
      }
    });
  });
});
