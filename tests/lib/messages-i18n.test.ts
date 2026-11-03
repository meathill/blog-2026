import { describe, expect, it } from 'vitest';
import enMessages from '../../messages/en.json';
import zhMessages from '../../messages/zh.json';

type Messages = Record<string, unknown>;

/** 递归展开嵌套 key（数组视为叶子，messages 里只存字符串） */
function flattenKeys(value: Messages, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, val]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return flattenKeys(val as Messages, path);
    }
    return [path];
  });
}

// 双语化守卫（2026-11 双语化收口）：客户端/服务端组件共用 messages，
// zh/en key 集合必须一致且值非空，否则一侧页面会出现 MISSING_MESSAGE 或空文案。
describe.each(['About', 'PostCard', 'NotFound', 'AwesomeComment'] as const)('messages.%s', (namespace) => {
  it('zh/en key 集合一致', () => {
    const zhKeys = flattenKeys(zhMessages[namespace] as Messages).sort();
    const enKeys = flattenKeys(enMessages[namespace] as Messages).sort();
    expect(enKeys).toEqual(zhKeys);
  });

  it.each(['zh', 'en'] as const)('%s 所有值非空', (locale) => {
    const source = (locale === 'en' ? enMessages : zhMessages)[namespace] as Messages;
    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === 'object') {
        for (const [subKey, subValue] of Object.entries(value as Messages)) {
          expect(`${namespace}.${key}.${subKey}`, `${locale} 的 ${namespace}.${key}.${subKey} 非空`).toBeTruthy();
        }
      } else {
        expect(`${namespace}.${key}`, `${locale} 的 ${namespace}.${key} 非空`).toBeTruthy();
      }
    }
  });
});

describe('messages 关键 key 抽查', () => {
  it('Home.hot_tags 与 Contact.mail_subject 双语齐全', () => {
    expect(zhMessages.Home).toHaveProperty('hot_tags');
    expect(enMessages.Home).toHaveProperty('hot_tags');
    expect((enMessages.Home as Messages).hot_tags).not.toBe((zhMessages.Home as Messages).hot_tags);
    expect(zhMessages.Contact).toHaveProperty('mail_subject');
    expect(enMessages.Contact).toHaveProperty('mail_subject');
  });
});
