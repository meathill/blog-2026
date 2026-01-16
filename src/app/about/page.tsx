import { Metadata } from 'next';
import Image from 'next/image';
import {
  GithubIcon,
  YoutubeIcon,
  TwitterIcon,
  MailIcon,
  MapPinIcon,
  CalendarIcon,
  CodeIcon,
  DumbbellIcon,
  PlaneIcon,
} from 'lucide-react';

export const metadata: Metadata = {
  title: '关于我',
  description: 'Meathill - 19年+ 全栈开发经验，热衷于构建有用的产品和分享技术知识',
};

const socialLinks = [
  { href: 'https://github.com/meathill', label: 'GitHub', icon: GithubIcon, username: '@meathill' },
  { href: 'https://youtube.com/@meathill', label: 'YouTube', icon: YoutubeIcon, username: '@meathill' },
  { href: 'https://x.com/meathill1', label: 'X (Twitter)', icon: TwitterIcon, username: '@meathill1' },
];

const skills = [
  { category: '前端', items: ['Vue.js', 'React', 'Next.js', 'TypeScript', 'TailwindCSS'] },
  { category: '后端', items: ['Node.js', 'Python', 'PHP', 'MySQL', 'TiDB'] },
  { category: '移动端', items: ['React Native', 'Expo'] },
  { category: 'DevOps', items: ['Cloudflare', 'Docker', 'GitHub Actions'] },
];

const timeline = [
  { year: '2006', event: '开始 Web 开发之旅' },
  { year: '2010', event: '全职前端开发' },
  { year: '2015', event: '转型全栈开发' },
  { year: '2020', event: '开始技术自媒体' },
  { year: '2023', event: '专注远程工作' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <section className="text-center mb-16">
          {/* Avatar */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 animate-pulse-glow" />
            <div className="relative w-full h-full rounded-full bg-[var(--surface)] border-4 border-[var(--background)] flex items-center justify-center text-4xl">
              🏋️
            </div>
          </div>

          <h1 className="text-responsive-title mb-4">
            <span className="text-gradient">Meathill</span>
          </h1>

          <p className="text-xl text-[var(--text-secondary)] mb-6 max-w-2xl mx-auto">
            19年+ 全栈开发经验，热衷于构建有用的产品和分享技术知识
          </p>

          {/* Quick Info */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1">
              <MapPinIcon size={14} />
              深圳, 中国
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarIcon size={14} />
              2006 年入行
            </span>
            <span className="inline-flex items-center gap-1">
              <CodeIcon size={14} />
              全栈开发
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-4 mt-8">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                <link.icon size={18} />
                <span className="text-sm">{link.username}</span>
              </a>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-gradient mb-6">关于我</h2>
          <div className="prose prose-invert max-w-none space-y-4 text-[var(--text-secondary)]">
            <p>
              大家好，我是肉山（Meathill），一名拥有 19 年以上经验的全栈开发者。 目前主要从事 Web 全栈开发，专注于
              Vue.js、React、Node.js 等现代技术栈。
            </p>
            <p>
              我热爱技术，喜欢探索新工具和新方法。同时也热衷于技术分享， 在 YouTube 和 B
              站上发布视频教程，帮助更多人学习编程。
            </p>
            <p>
              工作之余，我是一名力量举爱好者。目前的最好成绩是： 深蹲 172.5kg、卧推 130kg、硬拉 187.5kg，总重量 490kg。
              目标是突破 510kg！
            </p>
          </div>
        </section>

        {/* Skills Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-gradient mb-6">技术栈</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {skills.map((skill) => (
              <div
                key={skill.category}
                className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]"
              >
                <h3 className="text-sm font-semibold text-[var(--accent)] mb-3">{skill.category}</h3>
                <ul className="space-y-1">
                  {skill.items.map((item) => (
                    <li key={item} className="text-sm text-[var(--text-secondary)]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Hobbies Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-gradient mb-6">兴趣爱好</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-xl glass glow">
              <div className="flex items-center gap-3 mb-4">
                <DumbbellIcon size={24} className="text-[var(--accent)]" />
                <h3 className="text-lg font-semibold">力量举</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gradient">172.5kg</div>
                  <div className="text-xs text-[var(--text-muted)]">深蹲</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gradient">130kg</div>
                  <div className="text-xs text-[var(--text-muted)]">卧推</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gradient">187.5kg</div>
                  <div className="text-xs text-[var(--text-muted)]">硬拉</div>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]">
              <div className="flex items-center gap-3 mb-4">
                <PlaneIcon size={24} className="text-[var(--accent)]" />
                <h3 className="text-lg font-semibold">旅行</h3>
              </div>
              <p className="text-[var(--text-secondary)] text-sm">
                喜欢和家人一起探索世界。已去过日本、泰国、美国等地。
              </p>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-gradient mb-6">职业旅程</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--surface-border)]" />
            <ul className="space-y-6">
              {timeline.map((item, index) => (
                <li key={item.year} className="relative pl-12">
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-[var(--surface)] border-2 border-[var(--accent)] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                  </div>
                  <div className="text-sm text-[var(--accent)] font-medium">{item.year}</div>
                  <div className="text-[var(--text-secondary)]">{item.event}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contact Section */}
        <section className="text-center">
          <h2 className="text-xl font-bold text-gradient mb-6">联系我</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            如果你有任何问题、合作意向或只是想打个招呼，欢迎通过以下方式联系我。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://github.com/sponsors/meathill"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              ❤️ 赞助我
            </a>
            <a
              href="https://blog.meathill.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
            >
              📝 阅读博客
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
