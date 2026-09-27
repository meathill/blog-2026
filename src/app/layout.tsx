import './globals.css';

// 真正的根 layout（<html>/<body>、字体、NextIntlClientProvider）在 `app/[locale]/layout.tsx`：
// 那里能从 params 拿到 locale 并调用 setRequestLocale，next-intl 就不必读 middleware 写的请求头。
// 这里若调用 getLocale()（→ headers()），全站所有页面都会被迫动态渲染，ISR 完全失效（ISR 改造，2026-09-27）。
// 不在 [locale] 段下的请求（app/not-found.tsx）自己输出 <html>/<body>。
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
