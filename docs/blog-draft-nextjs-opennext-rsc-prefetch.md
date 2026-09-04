# 博文草稿：Next.js + OpenNext 优化后半段 —— `_rsc` Prefetch 请求风暴

> 定位：这是整篇优化记录的**后半截**。前半截写 ISR / Incremental Cache / OpenNext 缓存优化，这一段只记录后续发现的 Worker Request 暴涨问题。
>
> 元数据建议（发布时用）:
> - **标题**: Next.js + OpenNext 优化踩坑：小心 `_rsc` Prefetch 把 Worker 请求量打爆
> - **slug**: `nextjs-opennext-rsc-prefetch-worker-requests`
> - **分类**: cloudflare-worker
> - **标签**: Next.js, OpenNext, Cloudflare Workers, RSC, Prefetch, ISR
> - **摘要**: ISR 优化完成后，我又发现 Cloudflare Worker 请求量异常暴涨。最后定位到 Next.js 16.3 + OpenNext Cache Interception 下的 `_rsc` prefetch 死循环，并顺手重新梳理了一遍 Link prefetch 策略。

---

前半段主要在处理 ISR、Incremental Cache 和 OpenNext 的缓存策略。

效果不错，但优化完以后我又发现一个更隐蔽的问题：**Worker 请求量突然暴涨**。

其中一个项目两天跑出了接近 **1000 万次请求**。

## `_rsc` 请求一直在重复

打开浏览器 Network 后，很快就发现大量请求长这样：

```text
/?_rsc=xxxx
/contact?_rsc=xxxx
/models?_rsc=xxxx
/providers?_rsc=xxxx
```

这是 Next.js App Router 的 React Server Components 请求。

正常的 `<Link>` prefetch 会产生一些 `_rsc`，这本身没问题。真正异常的是：**这些请求没有停下来，而是在后台不断重复。**

页面完全不操作，几个 Link target 仍然持续发请求，于是一个正常访问就会不断放大成新的 Worker invocation。

这也解释了为什么 Cloudflare Dashboard 里看起来 `/contact`、`/models`、`/providers` 的请求量非常离谱——并不是用户真的在不停访问这些页面，而是浏览器在重复 prefetch。

## `optimisticRouting: false` 没解决

出问题时项目刚好在 Next.js 16.3.x，所以第一反应是先关掉：

```ts
experimental: {
  optimisticRouting: false,
}
```

重新 build、deploy、清缓存，问题依然存在。

后来继续排查 OpenNext 配置，最终真正有效的是关闭 Cache Interception：

```ts
export default defineCloudflareConfig({
  enableCacheInterception: false,
})
```

重新部署之后，Network 里的 `_rsc` 请求终于从“无限循环”恢复成了正常的“加载一批，然后停止”。

需要说明的是：我不会把所有 `_rsc` 循环都归因于这个配置，但在我这次 **Next 16.3 + OpenNext + Cloudflare Workers** 的实际环境里，它就是关键变量。

## 顺手减少不必要的 Prefetch

这次事故也让我重新检查了一遍项目里的 `<Link>`。

Next.js 默认 prefetch 很方便，但 footer、Terms、Privacy、Contact 之类低点击率链接，其实没必要提前加载：

```tsx
<Link href="/privacy" prefetch={false}>
  Privacy
</Link>
```

现在我的策略比较简单：

- 主导航、用户很可能马上点击的链接，保留默认 prefetch；
- footer、secondary navigation、低意图链接，优先 `prefetch={false}`；
- 页面一次展示大量链接时，尤其要注意请求放大。

目标不是禁用 Next.js prefetch，而是不要为了用户大概率不会访问的页面浪费 Worker Request。

## 顺便扫了一遍所有 Next + OpenNext 项目

因为我手上很多项目都是同一套：

```text
Next.js + OpenNext + Cloudflare Workers
```

发现这个问题后，我把相关项目统一加了几个检查项：

1. Next.js 升级到 **16.3.3+**；
2. 检查并关闭 `enableCacheInterception`；
3. 减少不必要的 `<Link>` prefetch；
4. 部署后观察 `_rsc` 是否会持续重复；
5. 再检查 Cloudflare Worker Request 曲线。

尤其是刚好停在 Next 16.3.0 / 16.3.1 的项目，我会优先处理。

## 最后的提醒

做 Serverless 优化时，很容易只盯着：

```text
CPU Time
Cache Hit
ISR
数据库查询
```

但 **Request Count 本身也是成本和风险**。

一次 Worker 请求可能只运行几毫秒，看起来很便宜；但如果浏览器因为框架行为不停地重复请求，几百万、几千万次以后一样会变成事故。

所以现在我会在做完 ISR / Cache 优化后，再补一个非常简单的检查：

```text
Cloudflare Worker Requests
        ↓
浏览器 Network
        ↓
确认 _rsc / prefetch 没有异常放大
```

Cloudflare Dashboard 告诉你“请求很多”，而浏览器 Network 往往才会告诉你：**这些请求为什么会这么多。**
