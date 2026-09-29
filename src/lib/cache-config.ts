// Issue #14：公开页面（文章/首页/归档）的缓存时长与失效 tag 集中在这里。
//
// 页面的 ISR revalidate 取「段配置」与「本次渲染里 fetch / unstable_cache 的最小值」，
// 所以 WP fetch、导航、首页推荐应用这些数据源的 revalidate 都必须对齐，否则任何一个短 TTL
// 都会把整页压回去（修复前 WP fetch 是 300s → 文章页 s-maxage≤300，OpenNext 再减条目年龄 → 77~195s）。
//
// 时效不靠 TTL：发布走 revalidateTag(WP_CACHE_TAG, { expire: 0 })，导航/应用变更有各自的 tag。
// TTL 只兜底 WP 后台直接改文（不经本站发布流程）的情况。
export const PUBLIC_REVALIDATE_SECONDS = 86400;

// 所有 WordPress 读请求（文章、列表、分类、标签、媒体、作者）共用的 fetch cache tag。
// 页面缓存条目会继承渲染中 fetch 的 tag，所以失效它 = 失效 WP 数据 + 所有用到 WP 数据的页面。
export const WP_CACHE_TAG = 'wp';
