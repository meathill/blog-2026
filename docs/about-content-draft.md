# About 页「关于我」prose 草稿（待粘贴）

把下面对应语言的 markdown 粘贴到后台 `/admin/about` 的「关于我 / content」字段（中文版进 zh，英文版进 en）。
可自由删改。粘贴后即覆盖页面里的默认占位文案。

---

## 中文（locale: zh）

```markdown
大家好，我是**肉山（Meathill）**，Meathill LLC 的创始人，一名拥有 **19 年+** 全栈开发经验的工程师。

我以「一人公司」的方式工作：从需求沟通、架构设计，到编码、上线、运维，全部亲自负责——没有中间层，也没有销售话术。我习惯远程协作与异步沟通，按里程碑推进，按项目范围报价。

这些年，我把精力集中在几个最常被找上门的方向：

- **Cloudflare 全栈架构与迁移** —— 把 Next.js / Nuxt 稳稳跑在 Workers 上，接入 R2、D1、Hyperdrive，帮团队告别失控的 Vercel 账单。
- **AI 应用与计费系统** —— 从 OpenAI / Claude 接入，到 Stripe + Supabase 的用量计费与订阅，跑通一套真正能收钱的 AI 产品。
- **跨端与移动应用** —— React Native / Expo 开发与上架，包括各种原生构建坑（比如 Google Play 的 16KB page size）。

工作之外，我是一名力量举爱好者，也喜欢和家人一起到处旅行。

如果你有想做的产品，或棘手的工程问题，欢迎 [发邮件给我](mailto:meathill@gmail.com) 聊聊。
```

---

## English（locale: en）

```markdown
Hi, I'm **Meathill**, founder of Meathill LLC and a full-stack engineer with **19+ years** of experience.

I run a one-person studio: from scoping and architecture to coding, shipping, and ops — I do it all myself. No middle layer, no sales pitch. I'm remote-first, comfortable with async work across timezones, and I price by project scope.

Over the years I've focused on a few things people most often come to me for:

- **Cloudflare full-stack & migration** — running Next.js / Nuxt on Workers, wiring up R2, D1, and Hyperdrive, and helping teams leave runaway Vercel bills behind.
- **AI apps & billing systems** — from OpenAI / Claude integration to usage-based billing and subscriptions with Stripe + Supabase, shipping AI products that actually get paid.
- **Cross-platform & mobile** — React Native / Expo development and store submission, including gnarly native build issues (like Google Play's 16KB page size).

Outside of work, I'm a powerlifting enthusiast and love traveling with my family.

If you've got a product to build or a tricky engineering problem, [drop me an email](mailto:meathill@gmail.com).
```

---

> 另：`src/app/[locale]/(public)/about/page.tsx` 里的 timeline 新增了两条里程碑（2023 成立 Meathill LLC、
> 2025 上线 dyqr/Mui Router/Mui CV），**年份是占位，请按实际改正**（文件里有 TODO 注释）。
