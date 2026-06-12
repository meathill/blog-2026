# PingCAP Support Ticket 草稿

> 提交入口:TiDB Cloud 控制台右下角 "?" → Contact Support,或 https://tidb.support.pingcap.com/
> 下面正文直接复制即可;括号内中文是给你自己看的备注,提交前删掉。

---

**Subject:** Starter cluster meters a constant ~20 RU/s with zero connections and zero queries

**Cluster:** `blog` (ID `1379661944643764243`), Starter plan, AWS Oregon (us-west-2), org Meathill

**Summary**

My Starter cluster consumes a constant ~20 RU/s that is completely independent of my workload. This background floor alone amounts to ~52M RUs/month — by itself exceeding the 50M free quota — while my actual application workload is only 1–3 RU/s.

**Evidence**

1. **Controlled silence test (key evidence).** On **2026-06-12, 16:43:40 – 16:54:40 UTC**, I stopped all clients of this cluster (PHP-FPM shut down; the connection count dropped to 0; the web console was closed). During these 11 minutes there were **zero connections and zero queries**, yet the Request Units chart shows RU staying flat at **~20 RU/s** throughout the window, indistinguishable from the surrounding periods.

2. **SQL-level accounting doesn't add up.** The Diagnosis → SQL Statement page (sorted by Total RU, 30-minute windows) shows all statements combined consuming roughly **1,800 RU per 30 minutes (~1 RU/s)**, with QPS at 1–5. The Request Units chart shows ~20 RU/s over the same windows. About 85–90% of metered RUs are not attributable to any statement.

3. **Connection overhead ruled out.** A controlled A/B test on 2026-06-12 (A: 300 queries over a single connection at 11:39 UTC; B: 60 fresh TLS connections with one query each at 11:41 UTC) produced **no visible RU spike** for either phase.

4. **Workload context.** The cluster serves a single WordPress database (~383 MiB). After adding an APCu object cache and persistent connections on the client side, the real workload dropped to 1–3 RU/s — at which point the constant ~20 RU/s floor became clearly visible. Auto-analyze jobs (SHOW ANALYZE STATUS) are rare and sub-second, so they don't explain a continuous 20 RU/s.

**Questions**

1. What exactly is consuming these ~20 RU/s? Your FAQ mentions background queries (schema sync, privilege refresh, SQL binding refresh, statistics) — is a constant 20 RU/s an expected magnitude for an idle Starter cluster?
2. Is there any configuration on my side that can reduce this background consumption?
3. If this is a metering or platform issue, could the affected RUs be credited? This month the cluster metered 200M+ RUs against a $15 spending limit, and a significant share appears to be this background floor rather than my workload.

Thanks!

---

## 备注(提交前删除)

- 截图建议附上:① Metrics → Request Units 的 Past 1 hour 视图(含 16:43–16:55 UTC 静默窗口);② 同窗口的 Query Per Second(显示 0);③ Diagnosis → SQL Statement 按 Total RU 排序的 30 分钟视图。
- 如果 support 回复说「这是预期行为」,追问第 2 题的具体项:能否关闭/降频 SQL binding refresh、统计收集等。
- 票据结果(解释/降低/credit)记得回填到 DEV_NOTE「TiDB 降载」节。
