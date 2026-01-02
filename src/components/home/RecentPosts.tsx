import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import PostCard from "./PostCard";

// 真实文章数据 - 来自 blog.meathill.com
const posts = [
  {
    title: "将 Next.js 项目从 Vercel 迁移到 Cloudflare",
    excerpt: "一起逃离 Vercel 拥抱 Cloudflare 吧！本文详细介绍如何使用 OpenNext 将 Next.js 应用部署到 Cloudflare Workers。",
    slug: "https://blog.meathill.com/next-js/migrate-next-js-from-vercel-to-cloudflare.html",
    date: "2025-11-23",
    category: "Next.js",
    readingTime: 12,
    views: 1200,
    featured: true,
  },
  {
    title: "React Native + Expo 入门级实战开发多平台应用 WhiteScreen：3. 深入开发",
    excerpt: "使用 Zustand 管理状态、原生组件布局、实现动画和本地数据存储。帮大家补上全栈开发的最后一块拼图。",
    slug: "https://blog.meathill.com/tech/lecture/video-tutorial-build-whitescreen-app-with-react-native-expo-layouting-stat-management-animation-local-storage.html",
    date: "2025-09-27",
    category: "React Native",
    readingTime: 15,
    views: 890,
  },
  {
    title: "【视频教程】React Native + Expo 入门级实战：2. 配置模拟器开发环境",
    excerpt: "继续分享 React Native + Expo 应用开发，配置 iOS/Android 模拟器环境并开发 Expo 应用。",
    slug: "https://blog.meathill.com/tech/lecture/video-tutorial-build-whitescreen-app-with-react-native-expo-setup-simulator-build-with-expo.html",
    date: "2025-09-19",
    category: "React Native",
    readingTime: 12,
    views: 750,
  },
  {
    title: "【视频教程】React Native + Expo 入门级实战：1. 移动应用开发现状",
    excerpt: "新系列视频教程：用 React Native + Expo 开发移动应用并上传到应用商店，最大限度利用已有技术积累。",
    slug: "https://blog.meathill.com/tech/lecture/video-tutorial-build-whitescreen-app-with-react-native-expo.html",
    date: "2025-09-14",
    category: "React Native",
    readingTime: 10,
    views: 1100,
  },
  {
    title: "跟风吐槽一下小米",
    excerpt: "小米市场部总经理被辞退在数码媒体圈甚嚣尘上。我跟小米有些过节，所以赶紧跟风吐槽一下。",
    slug: "https://blog.meathill.com/device/some-bad-memory-about-xiaomi.html",
    date: "2025-09-10",
    category: "生活",
    readingTime: 5,
    views: 2300,
  },
  {
    title: "解决 React Native + Expo 面对 Google Play 的 16KB memory page 问题",
    excerpt: "详细解析 Google Play 新的 16KB memory page 要求，以及如何在 React Native + Expo 项目中解决。",
    slug: "https://blog.meathill.com/react-native/how-to-fix-react-native-expo-google-play-16kb-memory-page-issue.html",
    date: "2025-09-06",
    category: "React Native",
    readingTime: 8,
    views: 560,
  },
  {
    title: "感谢赞助商 Mizu Financial，重启我的自媒体之路",
    excerpt: "感谢 Mizu Financial 成为本站的新赞助商。接下来会保持直播和博客周更，对得起赞助商的支持。",
    slug: "https://blog.meathill.com/share/thanks-sponsor-mizu-financial-restarting-my-self-media-journey.html",
    date: "2025-08-31",
    category: "分享",
    readingTime: 4,
    views: 420,
  },
  {
    title: "从40秒到11毫秒：TiDB Cloud 一次 SQL 深潜优化实战",
    excerpt: "将一个 40 多秒的查询逐步优化到 11 毫秒的完整过程。通过分析执行计划、添加索引、改写 SQL 等手段。",
    slug: "https://blog.meathill.com/tidb/from-40s-to-11ms-tidb-cloud-sql-optimization.html",
    date: "2025-05-15",
    category: "数据库",
    readingTime: 10,
    views: 2100,
  },
  {
    title: "计划参加 2025 年 7 月广州 IPL 力量举比赛，诚征赞助商",
    excerpt: "报名参加今年 7 月在广州举办的 IPL 力量举三项赛，大师组 100KG。预测成绩 510KG。",
    slug: "https://blog.meathill.com/life/sponsors-wanted-2025-july-ipl-powerlifting.html",
    date: "2025-05-03",
    category: "生活",
    readingTime: 3,
    views: 680,
  },
  {
    title: "【远程直聘】美国稳定币管理服务公司招聘全栈开发（偏后端）",
    excerpt: "Mizu Financial 是一家硅谷初创企业，为中小型传统企业提供稳定币与比特币的财务管理 SaaS 服务。",
    slug: "https://blog.meathill.com/jobs/remote-us-stablecoin-company-hiring-backend-heavy-fullstack-developer.html",
    date: "2025-06-19",
    category: "招聘",
    readingTime: 5,
    views: 1500,
  },
];

export default function RecentPosts() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-responsive-title mb-2">
              <span className="text-gradient">最新文章</span>
            </h2>
            <p className="text-[var(--text-secondary)]">
              技术干货与生活感悟
            </p>
          </div>
          <a
            href="https://blog.meathill.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all group"
          >
            查看全部
            <ArrowRightIcon size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Featured Post - Full Width on Mobile, Half on Desktop */}
          <div className="md:col-span-2 lg:col-span-1">
            <PostCard {...posts[0]} isExternal />
          </div>

          {/* Regular Posts */}
          <div className="space-y-6 lg:col-span-1">
            {posts.slice(1, 3).map((post) => (
              <PostCard key={post.slug} {...post} isExternal />
            ))}
          </div>
        </div>

        {/* More Posts - 3 columns grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.slice(3, 10).map((post) => (
            <PostCard key={post.slug} {...post} isExternal />
          ))}
        </div>

        {/* Mobile "View All" Button */}
        <div className="mt-8 text-center sm:hidden">
          <a
            href="https://blog.meathill.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            查看全部文章
            <ArrowRightIcon size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
