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
- [x] ~~静默实验判决:20 RU/s 是平台地板~~ **结论被推翻(2026-06-13)**:跨集群对照
  显示别的集群能到 0,说明 20 RU/s 是 `blog` 集群特有,不是平台地板
- [x] **TiFlash 副本已删但不是地板成因(2026-06-13,负结果)**:
  `sample_data.github_events`(TiDB 演示数据)曾挂 TiFlash 列存副本,03:16:06 UTC 执行
  `ALTER TABLE ... SET TIFLASH REPLICA 0` 删除,**Columnar Storage 已归 0**(确认清理)。
  但 03:16 前后 RU 无任何台阶式下降,删后 17 分钟(含真实流量 QPS 0-4)RU 仍 ~20-25
  ⇒ **TiFlash 不是 ~20 RU/s 地板的成因**。`blog` 库真实数据仅 7.6MB。
- [x] **DROP sample_data 整库(03:39:57 UTC)→ 仍无效**:删后 RU 基线 ~22-26,
  与删前一致,无台阶下降 ⇒ **演示数据也不是地板成因**。
- [x] **地板成因排查穷尽(三假设全证伪)**:平台地板✗(别的集群为0)、TiFlash✗
  (删后列存归0、RU不变)、sample_data✗(整库删后RU不变)。已排除:外部连接(静默测试)、
  CLI cron(无)、TiFlash 副本、演示库。**结论:~20 RU/s 是该集群 TiDB 内部后台开销,
  无法从我方(删数据/改配置)消除**。剩余只两条路:
  (b) 开 PingCAP 工单 —— 证据现已铁证:删光所有非应用数据 + 唯一 TiFlash 副本后地板
      仍 20、零连接静默窗口仍 20、别的集群为 0。要么解释要么 credit。
  (c) 7.6MB 的 blog 库迁回 VPS 本地 MariaDB —— 永久终结 RU 计费,DB 极小迁移成本低,
      代价是自己管备份。**这是唯一能从我方彻底解决的办法**。
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
