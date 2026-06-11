# Cloudflare 配置脚本(TiDB 降载)

屏蔽 blog.meathill.com 非必要请求 + wp-json 边缘缓存。背景与完整决策记录见 `DEV_NOTE.md`。

## 准备:创建 API Token

Dashboard → My Profile → API Tokens → Create Custom Token(建议 TTL 7 天,用完作废):

**Account 权限**(meathill 账号):

| Permission group | 级别 |
|---|---|
| Access: Apps and Policies | Edit |
| Access: Service Tokens | Read |
| Account Rulesets | Read |
| Account Filter Lists | Read |
| Workers Scripts | Read(可选) |

**Zone 权限**(Zone Resources → Specific zone → meathill.com):

| Permission group | 级别 |
|---|---|
| Zone | Read |
| Cache Rules | Edit |
| Single Redirect | Edit |
| Zone WAF | Edit |
| Page Rules | Read |
| Zone Settings | Edit(可选,Smart Tiered Cache 用) |

## 用法

```bash
export CLOUDFLARE_API_TOKEN=xxx
# 机器走代理时 node fetch 不读代理变量,需再加 NODE_USE_ENV_PROXY=1

# 0) 只读盘点(改任何东西之前必跑)
node scripts/cloudflare/inventory.ts

# 1) wp-json 边缘缓存 600s(先 --dry-run 看 diff)
node scripts/cloudflare/apply.ts --step cache --dry-run
node scripts/cloudflare/apply.ts --step cache

# 2) block 非 uploads 的 /wp-content/*
node scripts/cloudflare/apply.ts --step waf

# 3) feed 例外,修复 meathill.com/feed(多条候选规则时用 --rule-id 指定)
node scripts/cloudflare/apply.ts --step redirect

# 4) /wp-json 全量收口进 Access(最后做;有 bypass policy 时需 --confirm)
node scripts/cloudflare/apply.ts --step access --dry-run
node scripts/cloudflare/apply.ts --step access

# 回滚(快照目录在 apply 输出里)
node scripts/cloudflare/rollback.ts --step cache --snapshot <目录>
```

每次 apply 自动把现状落盘到 `snapshots/<时间戳>-<step>/`(已 gitignore)。

## 各步验证

```bash
# cache:二连发,第二次应 cf-cache-status: HIT
curl -sD- -o /dev/null 'https://blog.meathill.com/wp-json/wp/v2/posts?per_page=1' | grep -i cf-cache-status

# waf:插件路径 403,uploads 仍 200
curl -so /dev/null -w '%{http_code}\n' https://blog.meathill.com/wp-content/plugins/akismet/readme.txt
curl -so /dev/null -w '%{http_code}\n' 'https://blog.meathill.com/wp-content/uploads/<真实图片>'

# redirect:feed 通,其他路径仍 301
curl -so /dev/null -w '%{http_code}\n' https://meathill.com/feed
curl -sI https://blog.meathill.com/about | grep -i location

# access:匿名被拒,前台正常
curl -so /dev/null -w '%{http_code}\n' 'https://blog.meathill.com/wp-json/wp/v2/posts?per_page=1'
curl -so /dev/null -w '%{http_code}\n' https://meathill.com/
```

## 注意事项

- **PUT entrypoint 会替换整个 rules 数组**,脚本已做 GET→按 ref 合并→PUT;不要手工 PUT。
- **缓存不生效(一直 BYPASS)**:先查响应是否带 Set-Cookie;仍不行则走源站 fallback——
  WP mu-plugin 在 `rest_post_dispatch` 里对匿名 GET 改发 `Cache-Control: public, s-maxage=600`。
- **wp-content 红线**:`/wp-content/uploads/*` 必须公开(meathill.com 封面经 /cdn-cgi/image/ 匿名拉取);
  将来要用 wp-admin 后台需先撤 waf 规则(后台依赖 plugins/includes 静态资源)。
- **Access 红线**:destinations 不得覆盖 `/feed*`、`/wp-content/uploads*`、整个 host
 (feed 代理与图片转码都是匿名 fetch,脚本有断言)。
- 发布时效:边缘 600s + ISR 300s ≈ 新文章最长 15 分钟可见。要立即可见可在 dashboard 清缓存
 (Caching → Purge → Custom Purge → prefix `blog.meathill.com/wp-json/`)。
