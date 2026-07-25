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
| A | TiDB 账单爆炸之后 | TiDB RU、serverless 账单、WP 对象缓存 | （已发布，草稿已清理） | 复盘 RU 曲线 / APCu | **published** |
| B | OG 图在 CF Workers + 2026 预热 | nextjs og cloudflare | manifest + 线上正文 | 短录屏：snippet + 预热 | **published** |

并行：SEO 技术债 A1–A3 代码收口（description / attachment 301 / 规范内链）——已完成。

## 第 2 周（07-21 ~ 07-27）

| 槽 | 题目 | 主词 | 文源 | 直播 | 状态 |
|----|------|------|------|------|------|
| A | Serverless DB 2026：Hyperdrive+Supabase vs D1 vs Turso | hyperdrive、d1、turso | `docs/blog-draft-serverless-db-2026.md` | 三种存储延迟手测 | **draft** |
| B | OpenAI 兼容计费网关：MuiRouter 架构复盘 | AI gateway、token 计费 | `docs/blog-draft-muirouter-architecture.md` + `../mui-api` | 请求到扣费路径 | **draft** |

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

### 文 A（TiDB）— published

- [x] 草稿 + FAQ + 互链  
- [x] 发布（草稿文件已从仓库移除）  

### 文 B（OG）— published

- [x] manifest title/excerpt/FAQ + 2026 预热叙事  

## 第 2 周执行清单（2026-07-25）

### 文 A（Serverless DB）

- [x] 草稿：`docs/blog-draft-serverless-db-2026.md`（决策树 + 三项目对照 + FAQ）  
- [x] MCP 入箱：id `52660a07-2b9e-4c24-ab18-ce557b20f47e`，slug `serverless-db-2026-hyperdrive-d1-turso`  
- [x] 信息图 4 张已插入（拓扑 / 三列决策 / 存储分层 / 延迟手测）  

- [ ] 与第 1 周 TiDB 文、Hyperdrive 旧文规范路径互链  
- [ ] 直播：三存储延迟手测；发布后嵌回放  
- [ ] URL Inspection + purge-on-publish  

### 文 B（MuiRouter）

- [x] 草稿：`docs/blog-draft-muirouter-architecture.md`（路径图 + WalletDO + 定价矩阵 + 事故复盘）  
- [x] MCP 入箱：id `744d4140-072c-4188-badd-1058c2b2f68f`，slug `muirouter-openai-compatible-billing-gateway`  
- [x] 信息图 3 张已插入（请求泳道 / 账本权威 / 定价矩阵）；脱敏无真实 key  

- [ ] 与文 A、产品页 `/app` 或 muirouter.com 互链  
- [ ] 直播：请求到扣费走读；发布后嵌回放  
- [ ] URL Inspection + purge-on-publish  

## 每周五检查

- [ ] 2 篇已发布  
- [ ] ≥1 篇链到直播回放  
- [ ] 规范 URL 互链（带分类）  
- [ ] purge-on-publish 正常  
