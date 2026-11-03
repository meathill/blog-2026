/**
 * 已发布 app 的英文翻译数据（2026-11 起草，用户审校后可通过脚本导入 D1）。
 * - slug 必须与 apps 表一致，导入脚本按 slug 反查 app_id；
 * - awesome-comment 本身已是英文、muiad 已 archived，均不翻译；
 * - content 中的封面图沿用中文版 URL（英文版封面后续可替换）。
 */
export interface AppTranslationInput {
  slug: string;
  name: string;
  description: string;
  content: string;
}

export const APP_TRANSLATIONS_EN: AppTranslationInput[] = [
  {
    slug: 'muicv',
    name: 'MuiCV',
    description:
      'MuiCV is an AI resume and job-prep tool for job seekers. It turns your experience into a maintainable material library, then generates resumes, cover letters, and interview prep for each position.',
    content: `![MuiCV cover](https://i.meathill.com/320ea7eb-0757-4d71-acf3-faf300be4d35-01-infographic-muicv-cover.png)

## MuiCV

MuiCV is an AI resume and job-prep tool for job seekers. It helps you turn scattered work experience, project outcomes, and skills into a personal library you can maintain over time. Instead of starting from a blank document for every application, you build from a long-term collection of material and tailor each application to the role.

Resume material is stored as Markdown with YAML frontmatter in your own project directory — easy to read, easy to edit, and version-controlled with git. Work experience, projects, education, skills, and achievements are maintained independently; update once and future versions keep reusing it.

Facing a new job description, MuiCV helps you break down the JD, analyze how it matches your experience, and generate a resume tailored to that role. It also reviews drafts for STAR structure, quantified outcomes, keyword coverage, and length, then continues with cover letters — turning "what I did" into results recruiters can actually read.

For PDFs, the server handles browser rendering and other tasks awkward to do locally. Skills for Claude Code, Codex, Cursor, and OpenCode let the whole job-search flow run inside your familiar AI workspace. MuiCV is for people who want to treat their career history seriously and turn every application into a reusable workflow.

Visit: [https://muicv.com](https://muicv.com)`,
  },
  {
    slug: 'muirouter',
    name: 'MuiRouter',
    description:
      'MuiRouter gives you one OpenAI-compatible API in front of multiple model providers, with unified routing, credentials, usage, quotas, and billing — for developers who compare and switch models often.',
    content: `![MuiRouter cover](https://i.meathill.com/b57a0083-ff9b-4326-9fff-d3ca33f442d1-02-infographic-muirouter-cover.png)

## MuiRouter

MuiRouter is an OpenAI-compatible gateway for AI, LLM, and MCP traffic. It puts multiple model providers behind a single entry point, so your app no longer maintains separate SDKs, keys, and billing logic for each one — handy when you experiment with models quickly, build AI features, or serve several models at once.

Call the unified endpoint with one gateway API key or an OAuth 2.0 token, and route requests by model name to OpenAI, Google, Anthropic, Moonshot AI, xAI Grok, Cloudflare Workers AI, Xiaomi MiMo, and more. The gateway exposes familiar chat, images, videos, and models endpoints, plus an MCP server for scripts and AI agents.

Beyond routing, MuiRouter centralizes upstream credentials, token usage, long-context and cache billing, spend quotas, concurrency control, and limit alerts, with a free-tier whitelist and Stripe self-serve top-up. Your app keeps a stable calling convention while provider swaps, cost tracking, and usage governance stay in one service layer.

For individual developers it lowers the cost of multi-model experiments; for product teams it keeps provider replacements and usage governance maintainable over time.

Visit: [https://muirouter.com](https://muirouter.com)`,
  },
  {
    slug: 'dyqr',
    name: 'DYQR',
    description:
      'DYQR creates dynamic short links and QR codes you can retarget anytime, with access control, smart routing, campaign tags, and analytics — for products, marketing, and everyday sharing.',
    content: `![DYQR cover](https://i.meathill.com/3161a7fa-b23e-4805-811a-2117a589e2c3-06-infographic-dyqr-cover.png)

## DYQR

DYQR.me is a dynamic short link and QR code service. Create one link or QR code, put it on posters, menus, packaging, or social media, and still change the destination later — no need to redo all your materials when a landing page changes.

Links support auto and custom aliases, with direct redirects, an interstitial page, or auto mode. Password protection, expiry dates, click limits, and manual disabling help you control access; Smart Routing can send different visitors to more suitable pages based on country, region, device, language, time, and click count.

DYQR carries more than plain URLs — files, R2 objects, and Google Drive or OneDrive share links too. Campaigns, tags, and a UTM builder mark up channels, while dashboards and per-link stats show traffic and performance.

If you work in a terminal or with AI agents, DYQR also ships a CLI, MCP endpoint, Skill, and shared SDK to create and maintain links, QR codes, and campaign data after authorization.

Visit: [https://dyqr.me](https://dyqr.me)`,
  },
  {
    slug: 'taomenu',
    name: 'TaoMenu',
    description:
      'TaoMenu is a QR menu and ordering tool for small restaurants in Vietnam, supporting dine-in, counter pickup, staff collaboration, and multilingual menus — run orders from a phone.',
    content: `![TaoMenu cover](https://i.meathill.com/3fb54817-812e-446b-b606-4e7dc4b09410-07-infographic-taomenu-cover.png)

## TaoMenu

TaoMenu is a lightweight QR menu and ordering tool for small restaurants in Vietnam — restaurants, cafés, drink stands, banh mi shops, and street stalls with few or no seats. Owners build the menu on a phone, generate QR codes, and share them with customers; menu updates never require reprinting codes.

Customers don't need an account: scan the table code to view the menu, submit orders, call staff, or ask for the bill. Dine-in venues assign a QR to each table; takeaway-first shops use a public pickup code so every order gets a same-day pickup number that staff update from their phones.

The staff side collaborates across devices on new orders, while customer and staff flows each stay simple. Free usage covers basic menus and a single staff terminal; Pro adds multi-staff, multilingual menus, photo/PDF menu building, AI translation, and Vietnamese voice input.

TaoMenu lets small shops start from their own payment habits, without buying complex POS or kitchen hardware first.

Visit: [https://menu.dyqr.me](https://menu.dyqr.me)`,
  },
  {
    slug: 'my-playlist',
    name: 'My Playlist',
    description:
      'My Playlist helps you organize public videos into personal collections and download tasks — submit links from multiple platforms, track progress, and revisit your media library.',
    content: `![My Playlist cover](https://i.meathill.com/dd53f699-4e43-46b3-9fe0-fc0d871a0122-10-infographic-my-playlist-cover.png)

## My Playlist

My Playlist is a personal media collection and download tool that brings public videos scattered across platforms into one clear workflow. Copy public links from X, YouTube, Instagram, TikTok, and more into your playlist or download queue, then review results in one place.

Beyond one-off downloads, My Playlist focuses on long-term organization: a media library, task list, and result review make learning material, research clips, or show segments easier to keep and find again. After submitting a task, the page shows queued, running, progress, completed, or failed states, so you spend less time guessing whether it worked.

The system handles downloads, necessary transcoding, and file delivery in the background; a browser extension, CLI, and MCP Server bring task submission into your daily workflow. Platform login states, access limits, and content rights affect availability — only save content you are allowed to download and use.

My Playlist is for anyone who wants to connect "I saw it" with "I saved it, organized it, and can watch it again."

Visit: [https://my-playlist.app](https://my-playlist.app)`,
  },
  {
    slug: 'free-ai-api',
    name: 'Free AI API',
    description:
      'Free AI API is a developer-facing directory of free AI services — models, APIs, trial quotas, and how to get started, so you spend less time hunting and more time building.',
    content: `![Free AI API cover](https://i.meathill.com/bfb44a44-d7df-4222-9062-5878210b7f27-05-infographic-free-ai-api-cover.png)

## Free AI API

Free AI API is a developer-facing directory of free AI services, helping you find APIs and models you can try without paying first — while learning, experimenting, or prototyping. It gathers information scattered across docs, pricing pages, and application forms into one comparable place.

The directory covers text generation and LLMs, image generation, speech synthesis and recognition, embeddings, vision, code, and more. Each listing describes the API protocol, how to apply, and the boundaries of free tiers or trials, so you know what to prepare before your first call.

The site also tracks availability, with health checks and multilingual pages to reduce stale info and reading friction. Start from the directory, drill into the details, then filter by language, model capability, region, and budget; quotas, regions, and model status always defer to the provider's current page.

Beyond the website directory, the project offers a playground and a browser extension for browsing resources, applying for API keys, managing tokens, and trying services directly. Free AI API is for developers who would rather spend time on real experiments than on collecting links.

Visit: [https://freeaiapi.org](https://freeaiapi.org)`,
  },
  {
    slug: 'mui-gamebook',
    name: 'MuiStory',
    description:
      'MuiStory is an AI-powered interactive story platform. Creators build stories with branches, state, and mini-games; readers shape the plot through their own choices.',
    content: `![MuiStory cover](https://i.meathill.com/e928315f-b6ae-48ff-bef3-bf5f4fa07126-03-infographic-muistory-cover.png)

## MuiStory

MuiStory is an interactive fiction platform for writers and players. Readers are not passive — they shape the plot through choices, sending the story into different branches, a fit for visual novels, text adventures, and interactive narrative.

Creators describe ideas in natural language and refine scripts with AI. A Markdown-like story language organizes scenes, options, images, sound, video, and global state; variables like affinity, inventory, and character attributes give the plot a memory that evolves.

Scenes can embed click, memory, reaction, and puzzle mini-games, jumping to different endings based on results. Finished works publish to web pages that fit desktop and mobile — no installs needed to read or play — with PWA support and account sync to continue across devices.

MuiStory is for anyone who wants to turn a story into something playable, and for readers who enjoy exploring different choices and endings.

Visit: [https://muistory.com](https://muistory.com)`,
  },
  {
    slug: 'evertools',
    name: 'EverTools',
    description:
      'EverTools is a set of browser-local utilities for images, PDF, JSON, Markdown, and site checks — processing happens on your device, files stay local, built for quick everyday tasks.',
    content: `![EverTools cover](https://i.meathill.com/dd75e07a-df1f-4478-ba6d-7e07655da77e-04-infographic-evertools-cover.png)

## EverTools

EverTools is a set of utilities that run right in your browser, for the image, PDF, JSON, Markdown, and page-check tasks that keep coming up in daily work. The core principle: processing happens locally in the browser, and your original files stay on your device.

Image tools cover HEIC, AVIF, GIF, BMP and more — conversion, resizing, and quality control, plus free-form and ratio-preset cropping. PDF tools can replace text locally or generate a password-free copy after you enter the password; handy for one-off tasks without installing full desktop software.

The JSON viewer formats data into a collapsible, searchable tree. For website and content workflows, EverTools also offers Open Graph card checks, Markdown to PDF, sitemap validation, page content to Markdown, and Simplified/Traditional Chinese conversion.

Open a tool as needed, drag in a file or paste content, and download the result. Each page documents its input formats and browser support — a toolbox built for quick, lightweight, privacy-conscious everyday use.

Visit: [https://tools.meathill.com](https://tools.meathill.com)`,
  },
  {
    slug: 'baifo',
    name: 'Baifo',
    description:
      'Baifo is an open-and-use digital devotion tool — online incense, a wooden fish, mantra counters, and wish notes, giving you a quiet moment in a busy day.',
    content: `![Baifo cover](https://i.meathill.com/f74d75cb-bb4f-4c81-bc48-0c1c173f6b06-11-infographic-baifo-cover.png)

## Baifo

Baifo (Baifo Life) is an open-and-use digital devotion tool for worship, blessings, or simply a quiet moment in a busy day. The web version needs no download — open the page and begin.

Inside you will find online incense, a wooden fish, and mantra counting. The wooden fish supports multiple instrument tones; taps, sound, and visual feedback together create a focused moment. Counting is local-first and works offline, syncing to your account after sign-in.

You can also write down wishes, revisit and edit your worship records, and generate posters to share with family or friends. A daily fortune draw, email digest, and Simplified/Traditional Chinese toggle keep the experience close to daily habits.

Baifo asks for no steep learning curve — light interactions carry blessings, records, and a moment of calm.

Visit: [https://baifo.life](https://baifo.life)`,
  },
  {
    slug: 'mui-memo',
    name: 'MuiMemo',
    description:
      'MuiMemo is a voice-driven to-do app. Hold to speak one sentence and AI sorts it into tasks by time and context — capture a thought the moment it appears.',
    content: `![MuiMemo cover](https://i.meathill.com/2272c387-955c-4143-97c4-5fa47b6e1ea1-09-infographic-muimemo-cover.png)

## MuiMemo

MuiMemo solves the moment when a thought appears but opening a full to-do app feels like too much. Hold the microphone, say one sentence, release — it is captured. No typing, no manual sorting, no picking between lists.

AI extracts tasks, time expectations, context, and priority from what you said, filing things into "Now", "Today", or "Later". It also recognizes contexts like home, at your desk, or out; when you switch context, what you are most likely to finish right now floats up first instead of one flat list.

MuiMemo will not invent deadlines you never stated, cutting down expired reminders from wrong dates. The web app is a PWA with voice capture, Today, All, Completed, detail pages, attachments, and an offline shell — good for capturing thoughts while walking, working, or doing chores.

It does not try to replace full project management software; it just makes the distance from "I thought of it" to "it is written down" as short as possible.

Visit: [https://muimemo.meathill.com](https://muimemo.meathill.com)`,
  },
  {
    slug: 'hsm',
    name: 'Meathill HSM',
    description:
      'Meathill HSM is a local-first secrets manager that keeps keys and sensitive config safe to store and use, reducing the risk of credentials leaking into code, files, and clipboards.',
    content: `![Meathill HSM cover](https://i.meathill.com/5fcf9bd5-7af3-4eb9-83ad-d5e7171896a4-12-infographic-hsm-cover.png)

## Meathill HSM

Meathill HSM is a software-defined key management tool built on Cloudflare Workers and KV. It helps developers store and use API tokens, client secrets, and other sensitive config, reducing the risk of them leaking into repos, config files, and clipboards.

It combines envelope encryption, key sharding, HMAC-SHA256 index blinding, and AES-GCM-256 AEAD. The server holds only part of the key derivation; the client provides the other part via an X-HSM-Secret header, so the hosted service itself cannot decrypt your data, and integrity checks block overwrites with wrong keys.

HSM supports CORS out of the box — frontends can call store, read, update, and delete endpoints directly without handing client secrets to a relay backend. The project also ships llms.txt, SKILL.md, and MCP config so Codex, Claude, Cursor, and Copilot can understand and adopt the API.

Deploy your own instance with one-click Cloudflare deploy, or use it as a secrets store for small automation projects.

Visit: [https://hsm.meathill.com](https://hsm.meathill.com)`,
  },
];
