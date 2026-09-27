import NotFoundContent from '@/components/NotFoundContent';

// 根 layout 只透传 children（<html>/<body> 在 app/[locale]/layout.tsx），
// 落到这里的是 [locale] 段之外的 404（如非法 locale、middleware 未覆盖的扩展名路径），需要自带 <html>/<body>。
export default function NotFound() {
  return (
    <html lang="zh">
      <body className="antialiased">
        <NotFoundContent />
      </body>
    </html>
  );
}
