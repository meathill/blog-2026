import { ArrowRightIcon, SparklesIcon } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 渐变光晕 */}
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-glow"
          style={{ backgroundColor: 'var(--glow-amber)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-glow"
          style={{ backgroundColor: 'var(--glow-orange)', animationDelay: '1.5s' }}
        />

        {/* 网格背景 */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(var(--surface-border) 1px, transparent 1px),
              linear-gradient(90deg, var(--surface-border) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* 渐变遮罩 */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[var(--background)] to-transparent" />
      </div>

      {/* 内容 */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* 小标签 */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-float">
          <SparklesIcon size={16} className="text-[var(--accent)]" />
          <span className="text-sm text-[var(--text-secondary)]">全栈开发 · 技术分享 · 生活记录</span>
        </div>

        {/* 大标题 */}
        <h1 className="text-responsive-hero mb-6">
          <span className="block text-[var(--text-primary)]">Hi, I&apos;m</span>
          <span className="block text-gradient glow-text">Meathill</span>
        </h1>

        {/* 副标题 */}
        <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto leading-relaxed">
          19年+ 全栈开发经验，热衷于构建
          <span className="text-[var(--accent)]">有用的产品</span>
          和分享
          <span className="text-[var(--accent)]">技术知识</span>
        </p>

        {/* 额外信息 */}
        <p className="text-[var(--text-muted)] mb-10 text-sm md:text-base">
          力量举爱好者 🏋️ · 深蹲 172.5kg · 卧推 130kg · 硬拉 210kg
        </p>

        {/* CTA 按钮 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/posts"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            探索文章
            <ArrowRightIcon size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="https://github.com/meathill"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl glass text-[var(--text-primary)] font-semibold hover:bg-[var(--surface-hover)] transition-all"
          >
            查看 GitHub
          </a>
        </div>

        {/* 统计数据 */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto">
          {[
            { label: '年经验', value: '19+' },
            { label: '开源项目', value: '50+' },
            { label: '技术文章', value: '500+' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gradient">{stat.value}</div>
              <div className="text-sm text-[var(--text-muted)] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 滚动提示 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--text-muted)]">
        <span className="text-xs">向下滚动</span>
        <div className="w-5 h-8 rounded-full border-2 border-current flex items-start justify-center p-1">
          <div className="w-1 h-2 rounded-full bg-current animate-bounce" />
        </div>
      </div>
    </section>
  );
}
