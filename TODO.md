# TODO

长期维护计划（按优先级）。

## P1

- [ ] 优化 Admin 编辑器的图片粘贴与拖拽体验
- [x] 补充 BlockNote 自定义 Block 的渲染测试（`tests/lib/blog-code-block.test.ts` 等，2026-07-20）

## P2

- [ ] 评估搜索方案升级（站内索引/离线索引）
- [ ] 增加 e2e 冒烟测试（关键页面 + 同步入口）
- [ ] Ahrefs 遗留（已在各仓库开 issue）：[evertools#1 死链](https://github.com/meathill/evertools/issues/1)、[evertools#2 结构化数据](https://github.com/meathill/evertools/issues/2)、[hsm#1](https://github.com/meathill/hsm/issues/1)、[mui-ad#2](https://github.com/meathill/mui-ad/issues/2)
- [ ] Ahrefs 复查（重跑后）：broken-redirect 清零、4xx 仅剩预期 410、本仓 meta-long 清零；tools 站 83 条跟进 evertools 侧 issue（见 `docs/seo-ahrefs-2026-09.md`）。

## P3

- [ ] 接入更多 AI 能力（如根据正文自动补全标签、文章摘要推特分享语生成）
- [ ] 首页 Hero 动画性能极致优化
