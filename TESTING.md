# 测试指南

本项目使用 Vitest 作为测试框架。


## 运行测试

```bash
# 监听模式（开发时使用）
pnpm test

# 单次运行
pnpm test:run

# 生成覆盖率报告
pnpm test:coverage
```


## 测试文件结构

测试文件与源文件同目录，使用 `.test.ts` 或 `.test.tsx` 后缀：

```
src/
├── lib/
│   ├── utils.ts
│   ├── utils.test.ts      # 工具函数测试
│   ├── wordpress.ts
│   └── wordpress.test.ts  # WordPress API 测试
└── components/
    └── home/
        ├── PostCard.tsx
        └── PostCard.test.tsx  # 组件测试（可选）
```


## 编写测试

### 工具函数测试

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./my-module";

describe("myFunction", () => {
  it("应该正确处理输入", () => {
    expect(myFunction("input")).toBe("expected");
  });
});
```

### 组件测试

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  it("应该渲染标题", () => {
    render(<MyComponent title="测试标题" />);
    expect(screen.getByText("测试标题")).toBeInTheDocument();
  });
});
```


## 覆盖率要求

- 工具函数：80%+
- 核心组件：60%+
- 页面组件：可选


## Mock 配置

常用 mock 已在 `vitest.setup.ts` 中配置：
- `next/navigation` - 路由 mock
- `next/image` - 图片组件 mock
- `next/link` - 链接组件 mock
