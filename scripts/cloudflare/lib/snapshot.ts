// 快照读写:apply 前把现状落盘,rollback 用快照原样 PUT 回去
// 目录:scripts/cloudflare/snapshots/<ISO时间戳>-<label>/(已 gitignore)

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SNAPSHOT_ROOT = path.join(import.meta.dirname, '..', 'snapshots');

export function createSnapshotDir(label: string): string {
  const timestamp = new Date().toISOString().replaceAll(':', '-').slice(0, 19);
  const dir = path.join(SNAPSHOT_ROOT, `${timestamp}-${label}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function saveSnapshot(dir: string, name: string, data: unknown): string {
  const file = path.join(dir, `${name}.json`);
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`📸 快照已保存:${path.relative(process.cwd(), file)}`);
  return file;
}

export function loadSnapshot<T>(dir: string, name: string): T {
  const file = path.isAbsolute(dir) ? path.join(dir, `${name}.json`) : path.join(SNAPSHOT_ROOT, dir, `${name}.json`);
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}
