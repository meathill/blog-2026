# 草稿：OG 文 2026 刷新（title / excerpt / 增补段落）

> 排期：**2026-07-14 周 · 文 B**（见 `docs/blog-topics-2026-q3.md`）  
> 目标：修 GSC **219 impressions / 0.9% CTR**；slug **不变**  
> 现文：https://meathill.com/posts/cloudflare/nextjs-cloudflare-workers-og-image  
> 发布路径：优先用 `scripts/seo/manifest.json` 的 `nextjs-cloudflare-workers-og-image` 跑 apply（title/excerpt/FAQ）；正文「2026 增补」段可后台粘贴或手改。

---

## 一、建议元数据（已写入 manifest）

- **title**：`Next.js 在 Cloudflare Workers 上生成 OG 图：Satori、缓存与 2026 预热实践`
- **excerpt**：`在 Cloudflare Workers 上为 Next.js 生成 Open Graph 图片：Satori/resvg 限制、冷启动与 CPU 时间、R2/CDN 缓存与发布时预热，附可复制的 route 结构与避坑清单（2026）。`
- **canonical 保持**：`/posts/cloudflare/nextjs-cloudflare-workers-og-image`

---

## 二、开篇可替换（可选，比旧 intro 更贴搜索词）

把现有第一段换成或接在后面：

> OG Image 几乎是社交流量唯一的视觉钩子，但在 **Cloudflare Workers + OpenNext** 上做动态封面，坑比文档里写的多：`next/og` 的 PNG 体积、WebP 封面不被 Satori 吃、子请求 CPU 时间，以及「每次抓取都现渲」带来的延迟。  
> 本文保留 2025 年那套「静态兜底 + 动态 route」骨架，并补上 **2026 我们实际落地的 R2 持久缓存与发文预热**——这是把 1MB 级现渲压成可分享、可缓存资产的关键一步。

---

## 三、正文增补：在「三次返工」之后插入一节

建议标题：

### 3.x 2026 更新：R2 持久化 + 发布时预热

草稿正文：

在 Workers 上每次请求都跑 Satori + resvg，有三个现实问题：

1. **CPU 时间**：合成带封面图的卡片很容易顶到 Worker 限额，间歇性 `Unsupported image type` / timeout 会让社交爬虫缓存失败页。  
2. **体积**：`ImageResponse` 默认 PNG，带照片的图经常 ~1MB，WhatsApp 等平台有 ~300KB 量级上限。  
3. **重复劳动**：同一 slug 被 Twitter / Telegram / iMessage / 国内爬虫轮流抓，没有缓存就是同一张图渲 N 次。

我们现在的生产路径（概念，细节以仓库为准）：

```text
GET /api/og/post?slug=...
  → 读 R2 `og/post/{slug}.jpg`
      命中：直接返回（Cache-Control 长缓存）
      未命中：Satori 渲染 →（可选）Images binding 转 JPEG@82 → 写入 R2 → 返回
发文成功钩子
  → 对当前 slug 强制 refresh，预热 R2，避免「第一位分享者」撞冷启动
```

实现要点：

- **键**：`og/post/{slug}.jpg`（与公开 URL 解耦，换域名不废缓存）。  
- **转码**：PNG 仅作中间态；对外 JPEG，体积目标 150–280KB。  
- **封面输入**：WebP 源图先经 Images/`cdn-cgi` 转成 Satori 能吃的 PNG data URL，再进合成——别再把 WebP 直接塞进 Satori。  
- **刷新**：`?refresh=1` 或内部 purge 钩子覆盖 R2；改标题/换封面后要主动刷，否则社交平台仍可能拿旧 CDN 副本（平台侧缓存另一回事，至少保证源站是新的）。  
- **本地无 R2/Images**：回退现渲 PNG，不阻断开发。

这和「只靠 `s-maxage` 边缘缓存」的差别：边缘缓存吃的是重复 URL 命中；**R2 把结果变成持久对象**，发文预热则把「第一次命中」从读者侧挪到发布流水线。

验证清单：

1. `curl -sI "https://meathill.com/api/og/post?slug=<slug>"` 看 `content-type` / `cf-cache-status` / 体积。  
2. 发文后立刻再 curl 一次，应命中 R2（耗时明显低于冷渲）。  
3. 用 [OG 校验工具](https://tools.meathill.com/tools/og-image-validator) 看卡片预览。  
4. 改标题后带 refresh 再验。

---

## 四、FAQ（manifest 已带，可与正文「常见问题」区块对齐）

1. Workers 上能跑 next/og 吗？→ Satori + resvg-wasm；注意包体积、字体、CPU。  
2. 为什么又慢又贵？→ 每次现渲；上 R2 + 预热。  
3. 如何校验？→ OG validator / 平台 debugger。

---

## 五、延伸阅读（规范路径）

- `/posts/next-js/best-practice-for-nextjs-on-cloudflare-worker-2026`  
- `/posts/infra/upload-file-via-cloudflare-r2`  
- `/posts/cloudflare-worker/best-practice-for-nextjs-supabase-hyperdrive-on-cloudflare-worker`  

---

## 六、发布检查

- [ ] 部署已含 `buildPostDescription` 修复（excerpt 真正进 meta）  
- [ ] 服务器跑 OG 条 `SEO_APPLY=1` apply（或后台手改 title/excerpt）  
- [ ] 正文插入「R2 + 预热」节（可选但推荐）  
- [ ] URL Inspection + OG validator  
- [ ] 直播/录屏：改前后 SERP snippet + 预热 curl（可选）  
