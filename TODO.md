# TODO

长期维护计划（按优先级）。

## P1

- [x] 提升 `src/lib/**` 与 `src/app/api/**` 的覆盖率阈值
- [x] 抽离并统一文章列表展示组件，减少页面重复
- [x] 为后台 action（apps/tags/upload）补测试

## P2

- [x] 拆分 `src/components/layout/Header.tsx`（导航数据、桌面菜单、移动菜单）
- [x] 检查并清理遗留无效样式变量与 class
- [x] 为同步链路增加失败重试与幂等日志

## P3

- [ ] 评估搜索方案升级（站内索引/离线索引）
- [ ] 增加 e2e 冒烟测试（关键页面 + 同步入口）
