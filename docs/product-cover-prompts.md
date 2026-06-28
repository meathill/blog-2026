# 产品封面图 Prompt（首页 Products 大卡）

## 规格
- 比例 **16:9**（卡片 `ProductCard` 用 `aspect-[16/9]`，`object-cover`）。建议导出 **1600×900** 或 1920×1080，PNG/WebP。
- 通过 `/admin/apps/[id]` 上传，类型选 **cover**。
- 适用模型：GPT-image / Ideogram / Midjourney v6 / Flux 均可。Prompt 用英文效果最好。
- **不要把产品名烤进图里**（卡片本身已显示名称）。每条都带 `No text/typography`。
- 想风格统一：三张都保留「暖色 amber→orange 辉光 + 干净留白 + 柔和阴影」的共同基调，呼应 meathill.com 主色。

通用 negative prompt：
`no text, no watermark, no real brand logos, no distorted faces, not cluttered, no ui gibberish, high quality, clean`

---

## 1. DYQR（dyqr.me）— 动态二维码 / 短链
> 真实定位：可后期修改目标的动态二维码与短链，支持样式自定义、文件转链、数据分析。面向营销/商家。

```
Modern product hero illustration for a dynamic QR-code and short-link tool. Centerpiece: an elegantly styled QR code with rounded modules, a small brand dot in the center and a custom frame, partially morphing into a link-chain / paper-plane motif. A smartphone below emits a soft scan beam toward it; faint glassmorphism cards float nearby showing tiny analytics bar charts. Warm amber-to-orange gradient glow on a clean light studio background with a subtle grid and soft shadows. Flat-modern 3D, crisp, professional marketing aesthetic. 16:9, generous negative space top-left. No text.
```

## 2. Mui CV（muicv.com）— AI 简历生成
> 真实定位：AI 简历生成与优化，按岗位定制、STAR/量化审查、PDF 导出。吉祥物是柯基「Mui」，蓝+中性色。面向求职者。

```
Friendly modern product hero for an AI resume builder. A cute corgi mascot wearing a tiny tie sits beside a clean resume document with highlighted sections, soft green check marks, an AI sparkle, and a PDF export icon. Calm blue and neutral palette with a warm amber accent light, light background, soft 3D / flat-illustration hybrid, gentle shadows. Approachable, trustworthy mood. 16:9. No text.
```
> 注：柯基是该产品真实吉祥物，建议保留；若你有官方吉祥物图，截图/合成会更贴合品牌。

## 3. Mui Router（muirouter.com）— AI API 网关 / LLM 路由
> 真实定位：OpenAI 兼容的多模型 LLM 网关，一个接口接 OpenAI/Claude/Gemini/Workers AI，Cloudflare 边缘、按量计费。面向开发者。

```
Sleek developer-focused product hero for an AI API router / LLM gateway. A central glowing hub node routes colorful light streams out to several abstract model icons (chat bubbles and brain-chip shapes) arranged in an arc, suggesting multi-model routing. Dark navy background with a global edge-network of glowing dots and faint connection arcs, an amber-orange accent gradient as the key light. Modern isometric tech aesthetic, clean terminal/code vibe, high detail. 16:9, dark theme. No text.
```

---

## 如果走截图路线（很多时候更可信）
产品卡用真实 UI 截图通常转化更好。配方：
1. 截产品主界面（最能代表功能的那屏），裁成 16:9。
2. 可选：放进一个简洁浏览器窗口框，背景铺 amber→orange 柔和渐变 + 轻微投影，保持三张风格一致。
3. 导出 1600×900，后台当 cover 上传。

> 截图你来搞定即可；要做「浏览器框 + 渐变背景」的合成模板我也可以给你一份 HTML/SVG 模子。
