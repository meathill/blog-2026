export interface Skill {
  slug: string;
  name: string;
  package: string;
  description: { zh: string; en: string };
  tags: string[];
}

const SKILLS_REPO = 'https://github.com/meathill/meathill';
const SKILLS_BRANCH = 'master';

const SKILLS: Skill[] = [
  {
    slug: 'code-maintenance',
    name: 'code-maintenance',
    package: 'meathill-coding-skills',
    description: {
      zh: '周期性代码库维护与卫生：清理文档、补测试、抽取公共代码、拆分超大文件、用成熟库替换手写工具、消除重复代码。当我说"维护一下"、"清理"、"refactor"、"DRY 一下"时触发。',
      en: 'Periodic codebase maintenance and hygiene — clean up docs, add tests, extract shared code, split large files, replace hand-rolled utilities, consolidate duplicates. Triggers on "maintain", "clean up", "refactor", "tidy up", "DRY up".',
    },
    tags: ['code', 'maintenance', 'refactor'],
  },
  {
    slug: 'pr-review',
    name: 'pr-review',
    package: 'meathill-coding-skills',
    description: {
      zh: '处理 PR Review 评论：分类、逐条响应、记录决策。粘贴 review 内容或丢一个 PR URL 即可。',
      en: 'Triage and respond to PR review comments one by one. Paste review content or hand over a PR URL.',
    },
    tags: ['github', 'pr', 'review'],
  },
  {
    slug: 'project-quote',
    name: 'project-quote',
    package: 'meathill-coding-skills',
    description: {
      zh: '生成项目报价单和工时评估文档。支持管理技能清单、分析竞品/参考站点并生成报价。当用户说"报价"、"估价"、"工时评估"、"参考这个网站报价"时触发。',
      en: 'Build project quotes and effort estimates. Manages a skills inventory and can analyze a reference site to scope and price the work.',
    },
    tags: ['business', 'estimate', 'quote'],
  },
  {
    slug: 'website-operator-qa',
    name: 'website-operator-qa',
    package: 'meathill-coding-skills',
    description: {
      zh: '从运营/客户视角对公开网站和配套 CMS 做浏览器人工测试（不是 e2e）。列测试用例、跑真实业务流、记问题、清测试数据，再整理成 WIP / 报告 / GitHub issue。',
      en: 'Browser-driven manual QA from an operator/client perspective on a live site and its CMS — not e2e. Lists cases, walks real business flows, logs issues, cleans test data, then writes up a WIP / report / GitHub issue.',
    },
    tags: ['qa', 'manual-test', 'cms'],
  },
  {
    slug: 'livestream-to-podcast',
    name: 'livestream-to-podcast',
    package: 'video-skills',
    description: {
      zh: '把直播录像（或任意未剪辑的长视频）处理成可上传 B 站 / YouTube / 小宇宙 的成片：需求澄清 → 音频诊断 → Whisper 转写定位裁剪点 → ffmpeg 管线试制 → 硬件编码 → 输出上传材料。',
      en: 'Turn a raw livestream recording into a publishable podcast/video cut: requirements → audio diagnostics → Whisper-based cut points → ffmpeg pipeline A/B → hardware encode → upload metadata (title, tags, description, cover prompt).',
    },
    tags: ['video', 'audio', 'ffmpeg', 'whisper'],
  },
];

export function getAllSkills(): Skill[] {
  return [...SKILLS].sort((a, b) => a.name.localeCompare(b.name));
}

export function getSkillBySlug(slug: string): Skill | null {
  return SKILLS.find((s) => s.slug === slug) ?? null;
}

export function getSkillSourceUrl(skill: Pick<Skill, 'package' | 'slug'>): string {
  return `${SKILLS_REPO}/blob/${SKILLS_BRANCH}/skills/${skill.package}/${skill.slug}/SKILL.md`;
}

export function getSkillsRepoUrl(): string {
  return SKILLS_REPO;
}

export function getLocalizedDescription(skill: Skill, locale: string): string {
  return locale === 'en' ? skill.description.en : skill.description.zh;
}
