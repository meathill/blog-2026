import NotFoundContent from '@/components/NotFoundContent';

// [locale] 段内页面调用 notFound() 时渲染（外层已有 app/[locale]/layout.tsx 的 <html>/<body>）
export default function LocaleNotFound() {
  return <NotFoundContent />;
}
