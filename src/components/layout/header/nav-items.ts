import type { NavItem } from './types';

interface HeaderNavLabels {
  about: string;
  apps: string;
  skills: string;
  solutions: string;
  tools: string;
  tech: string;
  techOverview: string;
  techCompare: string;
  techPlatforms: string;
  techStacks: string;
  techGuides: string;
  works: string;
  resources: string;
}

export function getHeaderNavItems(labels: HeaderNavLabels): NavItem[] {
  return [
    { href: '/about', label: labels.about },
    { href: '/solutions', label: labels.solutions },
    { href: '/app', label: labels.apps },
    { href: 'https://tools.meathill.com', label: labels.tools, external: true },
    { href: '/skills', label: labels.skills },
    { href: 'https://mizufinancial.com/', label: 'Mizu Financial', external: true },
    {
      href: '/tech',
      label: labels.tech,
      children: [
        { href: '/tech', label: labels.techOverview },
        { href: '/tech/compare', label: labels.techCompare },
        { href: '/tech/platforms', label: labels.techPlatforms },
        { href: '/tech/stacks', label: labels.techStacks },
        { href: '/tech/guides', label: labels.techGuides },
        {
          href: 'https://github.com/meathill/gitbook-design-patterns-in-jquery',
          label: '从 jQuery 里学习设计模式',
          external: true,
        },
        {
          href: 'https://github.com/meathill/gitbook-javascript-async-tutorial',
          label: 'JavaScript 异步开发全攻略',
          external: true,
        },
      ],
    },
    {
      href: '/works',
      label: labels.works,
      children: [
        { href: 'https://space.bilibili.com/7409098', label: 'B 站视频', external: true },
        { href: 'https://www.youtube.com/channel/UCBeD-XqErDK4tKy5FtZj8vg', label: '油管频道', external: true },
        { href: 'https://github.com/meathill', label: 'GitHub', external: true },
        { href: 'https://baifo.life', label: '拜拜-网上拜佛', external: true },
        { href: 'https://muistory.com', label: '姆伊游戏书', external: true },
        { href: 'https://battleship-game.com', label: 'Battleship', external: true },
        { href: 'https://aigazou.net', label: 'AIGAZOU', external: true },
        { href: 'https://minesweeper.meathill.com', label: '扫雷游戏', external: true },
      ],
    },
    {
      href: '/sponsors',
      label: labels.resources,
      children: [
        { href: 'https://zeabur.com?referralCode=meathill', label: 'Zeabur（Vercel 竞品）', external: true },
        { href: 'https://leancloud.cn/?source=F88KG861', label: '超好用的后端 LeanCloud', external: true },
        { href: 'https://m.do.co/c/87df6b93ec1e', label: 'Digital Ocean', external: true },
        { href: 'https://www.vultr.com/?ref=7124198', label: 'Vultr VPS', external: true },
      ],
    },
  ];
}
