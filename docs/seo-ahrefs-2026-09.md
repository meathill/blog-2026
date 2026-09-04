# Ahrefs Site Audit 修复记录（2026-09，Issue #11）

> 数据源：2026-08-21 crawl 导出（4xx-page / broken-redirect / image-file-size / meta-description-too-long 四份 CSV）。
> 项目是 `*.meathill.com/*` 全域，先按下表分组，只有 `meathill.com` 属本仓。

## 分组

| 组 | 归属 | 本次动作 |
|---|---|---|
| `meathill.com`（主站） | 本仓 | 修（见下） |
| `tools.meathill.com`（约 83 条 meta 过长） | `evertools` 仓库 | 转交，不在本仓改（模板级问题，见 §4） |
| `blog.meathill.com`（6 张 2017 大图 1.3~4.2MB，0 引用） | 历史媒体源 | 不动：0 IMG inlinks，前端走 `/cdn-cgi/image` 代理已 cover |
| `www/seo/shop` | 历史别名 / DNS 消亡 | 维持 301 归一 / 淡出（#7 结论） |
| 23.5K blocked | 预期禁止（`/api /_next /search`、CF Access 后的 `/wp-json`、WAF 拦截、Ahrefs UA 对 `/tag` 的额外禁爬） | **保持禁止，不为降数开放内部入口** |

## 本仓修复（已上线待重跑验证）

### 1. Broken（32）→ 按“删”决策处理

线上实测三个旧 slug 的 post 形态全部 404（WP 内已无对应文章），`img_*` 经 `getMediaBySlug` 回退必然落空。
通用 legacy 301 会先跳到 `/posts/...` 再 404，形成 301→404 的 broken redirect 链，
因此在 `src/middleware.ts` 的通用分支**之前**拦截（`LEGACY_REDIRECT_MAP` / `GONE_SLUGS` / `GONE_ATTACHMENT_PATTERN`）：

| 旧 URL（+ `/en`、`/posts/`、`.html` 形态一并覆盖） | 处理 | 依据 |
|---|---|---|
| `/honey-moon-in-phu-guoc-vietenam`（拼写错误的重复文） | 301 → `/posts/travel/second-time-to-phu-quoc-island`（同主题存活文，线上 200） | 保外链权重 |
| `/internet/wp/wordpressmysql8[.html]` | 301 → `/posts/serverside/setting-lnmp-on-ubuntu-16-04`（LNMP 同主题存活文，线上 200） | 保外链权重 |
| `/gitbook-webpack-for-multi-pages`（sitemap 无存活对等文） | 直接 **410 Gone** | 无继任页，诚实信号 |
| `/img_0215`~`/img_0227`（附件残留 slug，13 个，+ `/posts/img_*` 形态） | 直接 **410 Gone** | 媒体库无对应 media |

回归测试：`tests/unit/middleware.test.ts`（Issue #11 用例组）。

### 2. Broken 中的 3 个 403（WAF 预期行为，修引用不断链）

`meathill.com/wp-content` 被 WAF 403 是 by design（防扫描）。旧文里 3 个
`<a href>`（`2012/08/list.png`、`2011/08/msvcr100.dll`、`2011/08/MG_87421.jpg`）原样打出即 403。
修法：`processContent`（`src/lib/wordpress/content.ts`）把主站/站内相对的
`/wp-content/uploads` **href** 改指到边缘放行的 blog 源
（`https://blog.meathill.com/wp-content/uploads/...`），保留下载/看图能力。
（已有 `<img src>` 走 Image Resizing 管线；`blog.meathill.com/wp-content` 的 href 仍按旧策略解链，不动。）
测试：`tests/lib/wordpress/posts.test.ts` Issue #11 用例。

### 3. Meta 过长（88）→ 本仓 5 条改短，其余转交

本仓 5 条（`buildPostDescription` 文章页天然 ≤160，不在内）：

| URL | 来源 | 改后长度 |
|---|---|---|
| `/en` | `src/lib/seo/root-metadata.ts` en description | 143 |
| `/en/about` | `messages/en.json` `about_description` | 141 |
| `/en/skills/code-maintenance` 等 3 个 | `src/lib/skills.ts` en description（详情页 meta 直用） | 113 / 115 / 122 |

中文版原本就短，不动。长度守卫：`tests/unit/seo-meta-length.test.ts`（≤160 断言）。

## 转交（未在本仓改）

- **`tools.meathill.com` 约 83 条多语言 description 超长**（`es/html-to-markdown` 390、`vi/html-to-markdown` 404 等，
  全是 `/{locale}/tools/*` 模板级问题）：请到 `evertools` 仓库开 issue 修（模板截断到 ≤160 或按语言重写短版）。
  建议标题：`[SEO] 83 个工具页多语言 meta description 超长（Ahrefs 2026-08 crawl）`，附件带 meta 那份 CSV。

## 待你操作（部署后）

1. **WP 侧**：三个旧 slug 的 post 已确认不存在，无需再删；若回收站里还留着，清空即可（不改 slug，不影响收录）。
2. **Ahrefs Re-crawl**：部署 24h 后手动重跑（免费 credits 省着用，`/tag` 已对 Ahrefs UA 禁爬）。
   预期：broken-redirect 清零；4xx 仅剩带历史外链的 410（`img_*`/gitbook，属预期）；本仓 meta-long 清零；
   tools 站的 83 条在 evertools 修完之前仍会挂着。
3. 把重跑后的按主站分组截图贴回 Issue #11 关单。
