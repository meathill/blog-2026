/**
 * 构建前同步脚本：从 Cloudflare KV 同步性能追踪和优化数据，
 * 供构建时或应用运行时静态使用。
 *
 * 目前同步内容：
 * - 代码高亮使用的语言类型 (hl:langs) -> src/generated/highlight-languages.json
 */

import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

// --- 配置区域 ---

const HIGHLIGHT_CONFIG_PATH = resolve(import.meta.dirname, '../src/config/highlight-languages.json');

// 1. 获取当前的高亮基线语言
let currentLanguages: string[] = ['javascript', 'typescript', 'json', 'css', 'xml', 'bash'];
try {
  const content = readFileSync(HIGHLIGHT_CONFIG_PATH, 'utf-8');
  currentLanguages = JSON.parse(content) as string[];
} catch (e) {
  // 如果配置文件不存在，则使用默认的回退数组
}

// --- 辅助方法 ---

/**
 * 使用 wrangler CLI 直接通过绑定的名称读取 KV，无需手动配置 Token 和 Namespace ID
 */
function fetchKVData<T>(key: string, binding: string = 'PERF_KV'): T | null {
  try {
    // wrangler 输出可能是 JSON，也可能是 "Value not found" 等
    const stdout = execSync(`npx wrangler kv key get "${key}" --binding=${binding}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    // 如果没有找到数据，wrangler 默认输出 "Value not found"
    if (stdout.includes('Value not found')) {
      return null;
    }

    return JSON.parse(stdout) as T;
  } catch (error) {
    if (error instanceof Error) {
      // 忽略找不到值的报错
      if (error.message.includes('Value not found') || error.message.includes('code: 10009')) {
        return null;
      }
      console.error(`⚠️  读取 KV key "${key}" 失败:`, error.message);
    }
    return null;
  }
}

// --- 同步任务 ---

function syncHighlightLanguages() {
  console.log('📦 同步 highlight.js 语言配置...');

  const kvData = fetchKVData<Record<string, number>>('hl:langs');
  const kvLanguages = kvData ? Object.keys(kvData) : [];

  const merged = [...new Set([...currentLanguages, ...kvLanguages])].sort();

  mkdirSync(dirname(HIGHLIGHT_CONFIG_PATH), { recursive: true });
  writeFileSync(HIGHLIGHT_CONFIG_PATH, JSON.stringify(merged, null, 2) + '\n');

  console.log(`✅ 已更新 ${HIGHLIGHT_CONFIG_PATH}`);
  if (kvLanguages.length > 0) {
    const newlyAdded = kvLanguages.filter((l) => !currentLanguages.includes(l));
    console.log(`   从 KV 获知新增语言: ${newlyAdded.join(', ') || '无'}`);
  }
  console.log(`   最终包涵语言 (${merged.length}): ${merged.join(', ')}`);
}

// 可以新增更多同步任务
// function syncOtherPerfData() { ... }

// --- 主入口 ---

function main() {
  console.log('🚀 开始获取生产环境优化数据...');

  syncHighlightLanguages();
  // syncOtherPerfData();

  console.log('✨ 数据同步完成！\n');
}

main();
