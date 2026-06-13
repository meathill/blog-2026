# PingCAP Support Ticket 草稿

> 提交入口:TiDB Cloud 控制台右下角 "?" → Contact Support,或 https://tidb.support.pingcap.com/
> 下面正文直接复制即可;末尾中文备注提交前删掉。

---

**Subject:** Starter cluster floors at ~20 RU/s with zero workload — persists after removing all non-application data

**Cluster:** `blog` (ID `1379661944643764243`), Starter plan, AWS Oregon (us-west-2), org Meathill, created 2023-03-07

**Summary**

This cluster meters a constant **~20 RU/s that is independent of my workload**. My actual application load is only 1–3 RU/s. The ~20 RU/s floor alone is ~52M RUs/month, which by itself exceeds the 50M free quota. I have eliminated everything on my side that could explain it — including removing the only TiFlash replica and dropping all non-application data — and the floor does not move. Other Starter clusters in my account drop to 0 RU/s when idle; this one never does.

**What I have already ruled out (with timestamps, all UTC)**

1. **Other clusters hit 0, this one doesn't.** Low-traffic Starter clusters in the same account sit at 0 RU/s when idle. `blog` never drops below ~20, so this is specific to this cluster, not a general platform baseline.

2. **Silence test — zero connections, zero queries, floor unchanged.** On **2026-06-12 16:43:40 – 16:54:40**, I stopped all clients (PHP-FPM down; connection count 0; console closed). For those 11 minutes there were no connections and no queries, yet the Request Units chart stayed flat at **~20 RU/s**.

3. **Removed the only TiFlash replica — no effect.** `sample_data.github_events` had a TiFlash replica. On **2026-06-13 03:16:06** I ran `ALTER TABLE sample_data.github_events SET TIFLASH REPLICA 0`. Columnar Storage dropped to 0 MiB, confirming the replica was gone. The ~20 RU/s floor **did not change** over the following 20+ minutes.

4. **Dropped the entire demo database — no effect.** On **2026-06-13 03:39:57** I ran `DROP DATABASE sample_data` (the preloaded demo dataset: github_events, fortune_500, imdb_movie_ratings, sold_car_orders; ~85 MiB, never queried by my app). The RU floor **stayed at ~22–26** (with light live traffic), no step-down.

5. **Connection churn is not the cause.** An A/B test on 2026-06-12 (single connection × 300 queries at 11:39 vs 60 fresh TLS connections × 1 query at 11:41) produced no visible RU spike for either phase.

6. **SQL-level accounting doesn't add up.** Diagnosis → SQL Statement (sorted by Total RU, 30-min windows) shows all statements combined at ~1,800 RU per 30 minutes (~1 RU/s), QPS 1–5. The Request Units chart shows ~20 RU/s over the same windows — roughly 85–90% of metered RUs are not attributable to any statement.

7. **Workload is tiny.** After client-side fixes (object cache, persistent connections), the real `blog` database is only ~7.6 MiB of data and ~1–3 RU/s of genuine load.

**Questions**

1. What is consuming this constant ~20 RU/s on this specific cluster, given there are zero external connections, no TiFlash replica, and no non-application data?
2. Why does this cluster floor at ~20 RU/s while other Starter clusters in the same account drop to 0 when idle? Is it related to cluster age / internal region or GC state?
3. Is there anything I can do to reduce it, or is it an internal/platform cost outside my control?
4. If it's the latter, can the affected RUs be credited? A large share of this month's 200M+ metered RUs is this background floor rather than my workload.

Thanks!

---

## 备注(提交前删除)

- 建议附截图:① Metrics → Request Units 的 silence 窗口(2026-06-12 16:43–16:55,QPS=0 但 RU≈20);② Overview → Core Metrics 的 RU 图覆盖 03:16(删 TiFlash)和 03:39(删 sample_data)两点,显示无台阶下降;③ 一个能到 0 的对照集群的 RU 图。
- 如果回复「这是内部后台行为,预期如此」,追问问题 2(为什么别的集群是 0)和问题 4(credit)。
- 工单结果回填到 DEV_NOTE「TiDB 降载」节。我方唯一能彻底解决的办法是把 7.6MB 的库迁回 VPS 本地 MariaDB(本次决定暂不做)。
