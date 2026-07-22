# TODO

长期维护计划（按优先级）。

## P1

- [ ] 优化 Admin 编辑器的图片粘贴与拖拽体验
- [x] 补充 BlockNote 自定义 Block 的渲染测试（`tests/lib/blog-code-block.test.ts` 等，2026-07-20）

## P2

- [ ] 评估搜索方案升级（站内索引/离线索引）
- [ ] 增加 e2e 冒烟测试（关键页面 + 同步入口）
- [ ] Ahrefs 遗留（其他仓库）：tools.meathill.com image-converter 页 13 个格式转换死链（webp-to-jpg 等，全 locale ×7）+ 全站结构化数据 Google 富结果校验错误 ×50+；hsm/muiad SoftwareApplication 结构化数据错误。需在各自仓库修复。
- [ ] Ahrefs 复查（7-27 定时爬取后）：确认 hreflang 两大项清零、sitemap /en 条目生效（部署后 24h 内 ISR 自愈）、404/redirect 明显下降。

## P3

- [ ] 接入更多 AI 能力（如根据正文自动补全标签、文章摘要推特分享语生成）
- [ ] 首页 Hero 动画性能极致优化
