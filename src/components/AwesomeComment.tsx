'use client';

import { useEffect, useRef } from 'react';
import { toastManager } from '@/components/ui/toast';

const SITE_ID = '8a576462-a61c-492a-ad36-33fc48e281b3';
const API_URL = 'https://awesomecomment.org';
const GOOGLE_CLIENT_ID = '553490336811-e0lmqt2vkb0nqfc4fbm83lc6mjo4ahbf.apps.googleusercontent.com';

interface AwesomeAuthModule {
  getInstance: (config: { googleId: string; root: string; prefix: string }) => unknown;
}

interface AwesomeCommentModule {
  default: {
    init: (
      selector: string | HTMLElement,
      config: { postId: string; apiUrl: string; awesomeAuth: unknown; locale: string },
    ) => void;
  };
}

export default function AwesomeComment() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function loadAndInit() {
      // 动态加载 CSS
      const cssUrl = 'https://unpkg.com/@roudanio/awesome-comment@0.10.3/dist/style.css';
      if (!document.querySelector(`link[href="${cssUrl}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);
      }

      try {
        // 使用 ESM 动态导入
        const [authModule, commentModule] = await Promise.all([
          // @ts-expect-error ESM 动态导入远程模块
          import(
            /* webpackIgnore: true */ 'https://unpkg.com/@roudanio/awesome-auth@0.1.5/dist/awesome-auth.js'
          ) as Promise<AwesomeAuthModule>,
          // @ts-expect-error ESM 动态导入远程模块
          import(
            /* webpackIgnore: true */ 'https://unpkg.com/@roudanio/awesome-comment@0.10.3/dist/awesome-comment.js'
          ) as Promise<AwesomeCommentModule>,
        ]);

        const auth = authModule.getInstance({
          googleId: GOOGLE_CLIENT_ID,
          root: `${API_URL}/api/site/auth`,
          prefix: 'acSaas',
        });

        commentModule.default.init(containerRef.current!, {
          postId: `${SITE_ID}:${location.pathname}`,
          apiUrl: API_URL,
          awesomeAuth: auth,
          locale: navigator.language,
        });
      } catch (error) {
        console.error('Failed to load Awesome Comment:', error);
        toastManager.add({
          type: 'error',
          title: '评论组件加载失败',
          description: error instanceof Error ? error.message : '请刷新页面重试',
        });
      }
    }

    loadAndInit();
  }, []);

  return (
    <section className="mt-12 pt-8 border-t border-[var(--surface-border)]">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">评论</h2>
      <div id="awesome-comment" ref={containerRef} />
    </section>
  );
}
