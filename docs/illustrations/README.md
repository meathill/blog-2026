# 博文信息图（第 2 周）

技术信息图用 **HTML/CSS（Meathill 暖色）→ Chrome headless PNG → R2**，保证中文标签与结构准确，不用抽象装饰图。

## 重渲

```bash
node docs/illustrations/render.mjs
```

源文件在各专题 `html/` 下；PNG 输出到专题根目录。

## 清单

### serverless-db-2026（文 A）

| 文件 | 用途 |
|------|------|
| `01-hyperdrive-topology.png` | Hyperdrive 拓扑 |
| `02-three-way-decision.png` | 三列决策表 + 决策树 |
| `03-storage-layers.png` | KV / DO / D1 分层 |
| `04-latency-protocol.png` | 延迟手测协议 |

### muirouter-architecture（文 B）

| 文件 | 用途 |
|------|------|
| `01-request-path.png` | 请求泳道 |
| `02-wallet-authority.png` | 权威账本 + 事故 |
| `03-pricing-matrix.png` | 定价矩阵 |

Admin 草稿已用 MCP `update_blog_post` 把 `[图:…]` 换成 `i.meathill.com` 图片 Markdown。
