// [locale] 段之外的 404（非法 locale、middleware matcher 排除的扩展名路径等）落到这里，
// 外层没有 layout 包裹，需要自带 <html>/<body>。
//
// ⚠️ 必须保持零依赖静态渲染：不得引入 next-intl（含 NextIntlClientProvider）、
// 客户端组件或 messages JSON。根级 not-found 会被预渲染进所有 ● ISR 路由的产物骨架，
// 引入请求时上下文（next-intl 读 locale）会让全站 ISR 重渲染抛 DYNAMIC_SERVER_USAGE，
// OpenNext 未接住该降级信号直接 500（2026-11-04 全站 500 事故根因，见 DEV_NOTE）。
// locale 内 404 由 src/app/[locale]/not-found.tsx 渲染，可正常双语。
// 守卫测试：tests/unit/root-not-found-guard.test.ts
export default function NotFound() {
  return (
    <html lang="zh">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#fafaf9',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, margin: 0, opacity: 0.15 }}>404</p>
          <h1 style={{ fontSize: 20, margin: '16px 0 8px' }}>页面不存在</h1>
          <p style={{ color: '#78716c', margin: '0 0 24px' }}>你访问的地址不存在或已被移动。</p>
          <a href="/" style={{ color: '#d97706', textDecoration: 'none', fontWeight: 600 }}>
            返回首页
          </a>
        </div>
      </body>
    </html>
  );
}
