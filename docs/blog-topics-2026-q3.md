# 2026 Q3 发文日历（一周两篇 + 直播联动）

Issue #4 内容轨。数据依据：GSC（2026-04～07）+ Bing 评论快照（2026-07-05）+ 本地 `../` 活跃项目。

## 节奏

| 节点 | 动作 |
|------|------|
| 周一 | 定本周 2 题 + 直播 demo |
| 周二 | **文 A**（深案例 / SEO 基本盘） |
| 周三或周四晚 | **直播**（`live-screen` OBS） |
| 周五 | **文 B**（产品 / skill / 录播衍生） |
| 周末 | B 站 + YouTube 切片；文内嵌回放；互链旧文 |

状态：`planned` → `draft` → `live`（已直播）→ `published`

---

## 第 1 周（2026-07-14 ~ 07-20）

| 槽 | 题目 | 主词 | 文源 | 直播 | 状态 |
|----|------|------|------|------|------|
| A | TiDB 账单爆炸之后 | TiDB RU、serverless 账单、WP 对象缓存 | `docs/blog-draft-tidb-ru-optimization.md` | 复盘 RU 曲线 / APCu | draft（FAQ/互链已齐，待配图发布） |
| B | OG 图在 CF Workers + 2026 预热 | nextjs og cloudflare | `docs/blog-draft-og-image-2026-refresh.md` + manifest | 短录屏：snippet + 预热 | draft（snippet 已入 manifest） |

并行：SEO 技术债 A1–A3 代码收口（description / attachment 301 / 规范内链）。

## 第 2 周（07-21 ~ 07-27）

| 槽 | 题目 | 主词 | 文源 | 直播 | 状态 |
|----|------|------|------|------|------|
| A | Serverless DB 2026：Hyperdrive+Supabase vs D1 vs Turso | hyperdrive、d1、turso | Hyperdrive 旧文 + free-ai-api / mui-api D1 | 三种存储延迟手测 | planned |
| B | OpenAI 兼容计费网关：MuiRouter 架构复盘 | AI gateway、token 计费 | `../mui-api` | 请求到扣费路径 | planned |

## 第 3 周（07-28 ~ 08-03）

| 槽 | 题目 | 主词 | 文源 | 直播 | 状态 |
|----|------|------|------|------|------|
| A | Payload + D1 + OpenNext：免费 AI API 目录 | payload cloudflare、d1 | `../free-ai-api` | CMS + service binding | planned |
| B | Vibe Coding Skill #2：PR Review / 维护技能 | coding skill、vibecoding | `../meathill` skills、`../muicv` | 当场写 skill | planned |

## 第 4 周（08-04 ~ 08-10）

| 槽 | 题目 | 主词 | 文源 | 直播 | 状态 |
|----|------|------|------|------|------|
| A | 控制面 CF、执行面在家：Queue + R2 下载系统 | cloudflare queue | `../x-downloader` | 架构 + 真实任务 | planned |
| B | 直播录像剪成片：livestream-to-podcast 实战 | 直播剪辑、ffmpeg、whisper | video skill + 本场录像 | 吃自己的狗粮 | planned |

## 第 5 周（08-11 ~ 08-17）

| 槽 | 题目 | 主词 | 文源 | 直播 | 状态 |
|----|------|------|------|------|------|
| A | 动态短链与 Smart Routing：DYQR | 短链、geo routing | `../dyqr` | 配分流规则 | planned |
| B | getCloudflareContext 与 OpenNext 边界（含 feed 500） | getcloudflarecontext、opennext | blog-2026 feed 修复 | 复现 edge 不进产物 | planned |

## 第 6 周（08-18 ~ 08-24）

| 槽 | 题目 | 主词 | 文源 | 直播 | 状态 |
|----|------|------|------|------|------|
| A | MCP 时代自建广告网：MuiAD | MCP ads | `../mui-ad` | MCP 创建广告 | planned |
| B | 从个人博客到 Meathill LLC | 品牌 + SEO 收敛 | 公司站 + issue #4 | 逛首页 + sitemap 清单 | planned |

## 候补

| 题 | 文源 |
|----|------|
| gazou：Email Worker + cron 召回 | `../gazou` |
| Mr.Hype 壁纸导出坑 | `../mr-hype` |
| MuiCV Skill 管简历 | `../muicv` |
| AI 3D 队列 worker | `../3D`、`3d-opensource` |
| evertools 本地工具 SEO | `../evertools` |
| live-screen OBS overlay | `../live-screen` |
| vibesite 一键上线 | `../vibesite` |

## 明确不写

- 科学上网类、Backbone 考古、主站灌 tools 图片转换多语词

## 第 1 周执行清单

### 文 A（TiDB）

- [ ] 补齐草稿中 `[图:...]` 截图  
- [ ] 核对 DEV_NOTE 最终结论（平台内部开销 / 迁本地 MariaDB 选项）  
- [ ] 加 FAQ + 延伸阅读（Workers / Hyperdrive / R2）  
- [ ] 排直播档期；发布后嵌回放链接  

### 文 B（OG）

- [ ] 部署本仓库 description 修复后，用 `scripts/seo` 对 `nextjs-cloudflare-workers-og-image` 跑 apply（manifest 已写 title/excerpt/FAQ）  
- [ ] 可选：正文开头补 2026 预热缓存 1～2 段  
- [ ] URL Inspection  

## 每周五检查

- [ ] 2 篇已发布  
- [ ] ≥1 篇链到直播回放  
- [ ] 规范 URL 互链（带分类）  
- [ ] purge-on-publish 正常  
