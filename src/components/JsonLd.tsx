// JSON-LD 结构化数据注入（2026-09 维护收口：此前 7 个页面共 14 处各写一份
// script + dangerouslySetInnerHTML，biome-ignore 也重复 14 遍，现集中到此一处）。
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD 结构化数据，数据源自服务端 builder
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
