'use client';

import Link from 'next/link';
import { HomeIcon, RotateCcwIcon } from 'lucide-react';

interface LocaleErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// [locale] 段内页面渲染或取数抛错时兜底，典型场景是 WP 源站瞬时不可用导致冷渲染失败。
// 保持 500 语义不掩盖故障，但给访客可操作的恢复入口，避免裸报错。
export default function LocaleError({ reset }: LocaleErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 500 Number */}
        <div className="relative mb-8">
          <div className="text-[10rem] font-black text-gradient leading-none opacity-20">500</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl">😵</div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">服务器开小差了</h1>
        <p className="text-[var(--text-secondary)] mb-8">
          内容暂时加载不出来，通常是数据源抖动。
          <br />
          请稍等片刻后重试。
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <RotateCcwIcon size={18} />
            重试
          </button>
          <Link
            prefetch={false}
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-[var(--text-primary)] font-semibold hover:bg-[var(--surface-hover)] transition-all"
          >
            <HomeIcon size={18} />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
