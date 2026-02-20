'use client';

import { useEffect, useRef } from 'react';
import { toastManager } from '@/components/ui/toast';

const SITE_ID = '8a576462-a61c-492a-ad36-33fc48e281b3';
const API_URL = 'https://awesomecomment.org';
const GOOGLE_CLIENT_ID = '553490336811-e0lmqt2vkb0nqfc4fbm83lc6mjo4ahbf.apps.googleusercontent.com';

export default function AwesomeComment() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  async function loadAndInit() {
    // 动态加载 CSS
    const cssUrl = 'https://unpkg.com/@roudanio/awesome-comment@0.10.7/dist/style.css';
    if (!document.querySelector(`link[href="${cssUrl}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssUrl;
      document.head.appendChild(link);
    }

    try {
      // 使用 ESM 动态导入
      const [authModule, commentModule] = await Promise.all([
        import(/* webpackIgnore: true */ 'https://unpkg.com/@roudanio/awesome-auth@0.1.5/dist/awesome-auth.js'),
        import(/* webpackIgnore: true */ 'https://unpkg.com/@roudanio/awesome-comment@0.10.7/dist/awesome-comment.js'),
      ]);

      const auth = authModule.getInstance({
        googleId: GOOGLE_CLIENT_ID,
        root: `${API_URL}/api/site/auth`,
        prefix: 'acSaas',
      });

      commentModule.default.init(containerRef.current!, {
        apiUrl: API_URL,
        awesomeAuth: auth,
        locale: navigator.language,
        postId: `${location.pathname}`,
        siteId: SITE_ID,
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

  useEffect(() => {
    if (initializedRef.current || !containerRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        initializedRef.current = true;
        loadAndInit();
      }
    });
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="mt-12 pt-8 border-t border-[var(--surface-border)]">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">评论</h2>
      <div id="awesome-comment" ref={containerRef} className="min-h-[200px]" />
    </section>
  );
}
