# 当前开发任务 (WIP)

任务完成后，请清理本项目，将重要约定并入 `DEV_NOTE.md` 或 `README.md`。

## TiDB 降载:blog.meathill.com 边缘收口 + wp-json 缓存(2026-06-11)

计划全文:`~/.claude/plans/tidb-spicy-flute.md`。约定已并入 DEV_NOTE「TiDB 降载」节。

- [x] 1-8 全部完成:Caddy 静态化止血、scripts/cloudflare/(inventory/apply/rollback)、
  wp-json 边缘缓存(已提至 24h)、wp-content WAF、feed 修复(含 OpenNext edge runtime 根因)、
  Access 全量收口(匿名 401)、Smart Tiered Cache、文档/memory
- [x] **purge-on-publish** 已上线(2026-06-11):发文成功 → purge_everything +
  revalidatePath('/','/posts','/feed');purge 失败不阻断发布,toast 提示手动 purge。
  token(仅 Zone.Cache Purge)已入 Worker secret `CLOUDFLARE_PURGE_TOKEN`
- [x] 第二轮(2026-06-12):APCu 对象缓存(SQL 92K→1.8K RU/30min)+ 持久连接
  (wp-json 1.3s→0.3s)+ 扫描器 WAF + feed 30d 缓存。RU 基线 110-120 → ~20
- [ ] **静默实验判读**(2026-06-12 16:43:40–16:54:40 UTC 停 FPM,已自动恢复):
  TiDB 控制台 Metrics → Request Units 看该窗口——归零 ⇒ ~20 RU/s 地板与集群唤醒
  状态绑定(下一步:修边缘缓存让源站真正静默 + 考虑撤持久连接让集群休眠);
  仍 ~20 ⇒ 平台固定开销,拿证据链开 PingCAP ticket。当时 RU 面板故障没读成
- [ ] 边缘缓存未解之谜:同 URL 曾 10 分钟回源 30 次(疑似 Access 给响应加
  Set-Cookie 阻止缓存存储),需 Worker 的 CF_ACCESS 凭证做两发 curl 实测 cf-cache-status
- [ ] 观察:下月 run-rate 预计 55-65M RU(超 50M 免费额度 $1-3);爆炸前是 250M+
- [ ] 可选:恢复 wp-cron(服务器 system cron 打 127.0.0.1:8080/wp-cron.php),定时发布依赖它

## 遗留:Issue #4 SEO(代码与服务器侧已完成)

仍需用户手动:
- [ ] **GSC**:删 6 份历史 sitemap 条目(Search Console UI;API 不支持删除);重新提交活跃 sitemap
- [ ] 可选:Jetpack 关掉 XML sitemaps(origin 已 410,非必须)

待验证:
- [ ] 端到端:Rich Results Test 校验 BlogPosting/Breadcrumb/(FAQ);tag/search 有 noindex;`/sitemap.xml` 不含 `/tag/`
- [ ] 部署后 GSC:活跃 sitemap 0 error 且被抓取;blog.* 重复 URL 递减
- [ ] 指标(28 天窗口,至 2026-07-03):Top 技术文回到 4%+ CTR
