import { Metadata } from "next";
import { CalendarIcon, ClockIcon, TagIcon, ExternalLinkIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "文章归档",
  description: "山维空间所有技术文章和生活记录的归档列表",
};

// 按年份分组的文章数据
const postsByYear = {
  "2025": [
    {
      title: "将 Next.js 项目从 Vercel 迁移到 Cloudflare",
      slug: "https://blog.meathill.com/next-js/migrate-next-js-from-vercel-to-cloudflare.html",
      date: "2025-11-23",
      category: "Next.js",
      readingTime: 12,
    },
    {
      title: "React Native + Expo 入门级实战开发多平台应用 WhiteScreen：3. 深入开发",
      slug: "https://blog.meathill.com/tech/lecture/video-tutorial-build-whitescreen-app-with-react-native-expo-layouting-stat-management-animation-local-storage.html",
      date: "2025-09-27",
      category: "React Native",
      readingTime: 15,
    },
    {
      title: "【视频教程】React Native + Expo 入门级实战：2. 配置模拟器开发环境",
      slug: "https://blog.meathill.com/tech/lecture/video-tutorial-build-whitescreen-app-with-react-native-expo-setup-simulator-build-with-expo.html",
      date: "2025-09-19",
      category: "React Native",
      readingTime: 12,
    },
    {
      title: "【视频教程】React Native + Expo 入门级实战：1. 移动应用开发现状",
      slug: "https://blog.meathill.com/tech/lecture/video-tutorial-build-whitescreen-app-with-react-native-expo.html",
      date: "2025-09-14",
      category: "React Native",
      readingTime: 10,
    },
    {
      title: "跟风吐槽一下小米",
      slug: "https://blog.meathill.com/device/some-bad-memory-about-xiaomi.html",
      date: "2025-09-10",
      category: "生活",
      readingTime: 5,
    },
    {
      title: "解决 React Native + Expo 面对 Google Play 的 16KB memory page 问题",
      slug: "https://blog.meathill.com/react-native/how-to-fix-react-native-expo-google-play-16kb-memory-page-issue.html",
      date: "2025-09-06",
      category: "React Native",
      readingTime: 8,
    },
    {
      title: "感谢赞助商 Mizu Financial，重启我的自媒体之路",
      slug: "https://blog.meathill.com/share/thanks-sponsor-mizu-financial-restarting-my-self-media-journey.html",
      date: "2025-08-31",
      category: "分享",
      readingTime: 4,
    },
    {
      title: "【远程直聘】美国稳定币管理服务公司招聘全栈开发（偏后端）",
      slug: "https://blog.meathill.com/jobs/remote-us-stablecoin-company-hiring-backend-heavy-fullstack-developer.html",
      date: "2025-06-19",
      category: "招聘",
      readingTime: 5,
    },
    {
      title: "从40秒到11毫秒：TiDB Cloud 一次 SQL 深潜优化实战",
      slug: "https://blog.meathill.com/tidb/from-40s-to-11ms-tidb-cloud-sql-optimization.html",
      date: "2025-05-15",
      category: "数据库",
      readingTime: 10,
    },
    {
      title: "计划参加 2025 年 7 月广州 IPL 力量举比赛，诚征赞助商",
      slug: "https://blog.meathill.com/life/sponsors-wanted-2025-july-ipl-powerlifting.html",
      date: "2025-05-03",
      category: "生活",
      readingTime: 3,
    },
  ],
};

export default function ArchivePage() {
  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a));
  const totalPosts = Object.values(postsByYear).flat().length;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-responsive-title mb-4">
            <span className="text-gradient">文章归档</span>
          </h1>
          <p className="text-[var(--text-secondary)]">
            共 {totalPosts} 篇文章，持续更新中...
          </p>
        </header>

        {/* Timeline */}
        <div className="space-y-12">
          {years.map((year) => (
            <section key={year}>
              {/* Year Header */}
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gradient">{year}</h2>
                <div className="flex-1 h-px bg-[var(--surface-border)]" />
                <span className="text-sm text-[var(--text-muted)]">
                  {postsByYear[year as keyof typeof postsByYear].length} 篇
                </span>
              </div>

              {/* Posts List */}
              <ul className="space-y-4">
                {postsByYear[year as keyof typeof postsByYear].map((post) => (
                  <li key={post.slug}>
                    <a
                      href={post.slug}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block p-4 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] hover:border-[var(--accent)]/30 transition-all card-hover"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        {/* Date */}
                        <div className="flex items-center gap-1 text-sm text-[var(--text-muted)] sm:w-24 flex-shrink-0">
                          <CalendarIcon size={14} />
                          {post.date.slice(5)}
                        </div>

                        {/* Title */}
                        <h3 className="flex-1 font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-2">
                          {post.title}
                          <ExternalLinkIcon size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                        </h3>

                        {/* Meta */}
                        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                          <span className="inline-flex items-center gap-1">
                            <TagIcon size={12} />
                            {post.category}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon size={12} />
                            {post.readingTime}分钟
                          </span>
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* More Posts Link */}
        <div className="mt-12 text-center">
          <a
            href="https://blog.meathill.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            查看更多历史文章
            <ExternalLinkIcon size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
