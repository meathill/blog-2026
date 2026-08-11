# meathill.com 历史 sitemap / 主机入口清理(2026-08)

> Issue: [#7](https://github.com/meathill/blog-2026/issues/7)。取代已删除的 `docs/seo-gsc-cleanup.md`(内容可查 `git show a8878d9^:docs/seo-gsc-cleanup.md`)。
> 观测时间 2026-08-11;curl 从 VPS(34.177.119.169,干净网络)执行——本地开发机 DNS 走代理 fake-ip(198.18.x),结果不可信。

## 站点白名单(事实架构)

| 主机 | 角色 | 策略 |
|---|---|---|
| meathill.com | 主站(Workers/OpenNext) | **唯一正式 sitemap 入口** `https://meathill.com/sitemap.xml` |
| tools.meathill.com | 独立子站 | 保留自己的 sitemap |
| blog.meathill.com | **双角色**:历史公开站 + 主站 REST API/媒体源 | 仅 `/wp-json/`(CF Access 后,匿名 401 属预期)、`/wp-content/`(uploads)、`/feed` 放行;其余在 **Cloudflare 边缘 301** 到 meathill.com |
| www.meathill.com | 历史别名 | 边缘 301 → meathill.com |
| seo.meathill.com / shop.meathill.com | 已消亡 | **DNS 记录已删除**(1.1.1.1 NXDOMAIN),任何抓取永久失败 |

## GSC 现状(sc-domain:meathill.com,2026-08-11 实测)

| # | sitemap | 提交时间 | 实测状态 | 处置 |
|---|---|---|---|---|
| 1 | https://meathill.com/sitemap.xml | 2026-07 | 200,432 URLs,0 错误 | **保留(主入口)** |
| 2 | https://tools.meathill.com/sitemap.xml | 2026-05 | 200,203 URLs | **保留(子站)** |
| 3 | https://blog.meathill.com/sitemap.xml | 2023-04 | 301 → 主 sitemap | 淡出(301 归一) |
| 4 | http://blog.meathill.com/sitemap.xml | 2017-04 | 301 https → 301 主 sitemap | 淡出(301 归一) |
| 5 | http://blog.meathill.com/news-sitemap.xml | 2017-04 | 301 链 → meathill.com/news-sitemap.xml(修复后 404) | 淡出 |
| 6 | https://seo.meathill.com/sitemap.xml | 2025-03 | DNS 不存在 | 淡出(永久失败) |
| 7 | https://shop.meathill.com/sitemap.xml | 2018-11 | DNS 不存在 | 淡出(永久失败) |
| 8 | http://www.meathill.com/wp-content/.../sitemap.xml | 2013-01 | 301 链 → 403(WAF) | 淡出(2014 后未再下载) |

**GSC 无删除 sitemap 的界面/API**(2026-07 已验证,GSC MCP 只能 list/submit),历史条目只能靠抓取失败/301 归一自然淡出,无需其他动作。

## 决策记录

1. **旧 blog sitemap 采用 301 归一,不做 410**。`scripts/seo/server/blog-redirect.Caddyfile` 里原设想对 `sitemap*.xml` 返回 410,但 Cloudflare 边缘规则在 Caddy 之前就把这些路径 301 到 meathill.com 了,Caddy 的 410 规则实际不可达。301 到正式 sitemap 让 Google/Bing 跟随并归并旧条目,效果不劣于 410,**保持现状,不改源站**。
2. **seo/shop 靠 DNS 消亡淡出**,不恢复解析。
3. **`/news-sitemap.xml` 软 404 修复**:middleware matcher 排除 `.xml` 等扩展名,这类不存在路径落进 `[locale]` 段被当作 locale 以 200 渲染首页(无限软 404 / 重复内容)。已在 `[locale]` 层校验非法 locale 返回 404(见对应提交)。
4. **Bing Webmaster 侧主动清理**:Bing UI 支持删除 sitemap,删除除主站/tools 外的全部历史条目(见下)。
5. **仓库清理**:`scripts/seo/server/` 中 `blog-redirect.nginx.conf`、`blog-redirect.htaccess`、`blog-noindex.conf` 从未在服务器应用(服务器只跑 Caddy,实测 0 个 nginx/apache 进程),删除;`blog-redirect.Caddyfile` 与服务器 `/etc/caddy/Caddyfile` 保持同步,保留。

## Bing Webmaster 清理清单

保留:`https://meathill.com/sitemap.xml`、`https://tools.meathill.com/sitemap.xml`。
删除:blog(http/https)、news-sitemap、shop、seo、www、其余 http 变体。
(执行记录见本文末尾追加。)

## 验收核对

- [x] GSC/Bing 清单与白名单一致(GSC 靠淡出并记录理由;Bing 主动清)
- [x] 旧入口全部有明确去向:301 归一 / DNS 消亡 / 404(软 404 已修)
- [x] `blog.meathill.com/wp-json/` 正常(401=CF Access 预期,主站文章渲染依赖不受影响)
- [x] 不影响现有文章 URL 与有效收录(未动任何 /posts URL)
