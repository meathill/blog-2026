import { getNavigationEditorData, resetNavigationConfig, saveNavigationConfig } from '@/actions/navigation';
import { NavigationEditor } from '@/components/admin/navigation-editor';
import { getDefaultNavigationItems, parseNavigationItemsJson, resolveNavigationSection } from '@/lib/navigation-config';

interface NavigationAdminPageProps {
  searchParams: Promise<{
    locale?: string;
    section?: string;
    saved?: string;
    reset?: string;
    error?: string;
  }>;
}

function buildStatusMessage(params: { saved?: string; reset?: string; error?: string }) {
  if (params.error) {
    return {
      type: 'error' as const,
      text: `保存失败：${params.error}`,
    };
  }
  if (params.saved === '1') {
    return {
      type: 'success' as const,
      text: '导航配置已保存',
    };
  }
  if (params.reset === '1') {
    return {
      type: 'success' as const,
      text: '已恢复默认导航配置',
    };
  }
  return null;
}

export default async function NavigationAdminPage({ searchParams }: NavigationAdminPageProps) {
  const params = await searchParams;
  const locale = params.locale ?? 'zh';
  const section = resolveNavigationSection(params.section);
  const status = buildStatusMessage(params);
  const editorData = await getNavigationEditorData(locale, section);
  let parseWarning: string | null = null;
  let initialItems = getDefaultNavigationItems(editorData.locale, editorData.section);

  try {
    initialItems = parseNavigationItemsJson(editorData.itemsJson);
  } catch {
    parseWarning = '检测到数据库中的导航配置格式异常，已自动回退到默认导航。保存后可覆盖异常数据。';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Navigation</h2>
          <p className="text-sm text-zinc-500">
            所见即所得编辑导航，支持拖拽排序。可切换编辑 Header / Footer，保存后前台会优先使用 D1 配置。
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/admin/navigation?locale=zh&section=${editorData.section}`}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              editorData.locale === 'zh'
                ? 'border-amber-600 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            中文
          </a>
          <a
            href={`/admin/navigation?locale=en&section=${editorData.section}`}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              editorData.locale === 'en'
                ? 'border-amber-600 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            English
          </a>
        </div>
      </div>

      <div className="flex gap-2">
        <a
          href={`/admin/navigation?locale=${editorData.locale}&section=header`}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            editorData.section === 'header'
              ? 'border-amber-600 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
          }`}
        >
          Header
        </a>
        <a
          href={`/admin/navigation?locale=${editorData.locale}&section=footer`}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            editorData.section === 'footer'
              ? 'border-amber-600 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
          }`}
        >
          Footer
        </a>
      </div>

      {status && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
          }`}
        >
          {status.text}
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <form action={saveNavigationConfig} className="space-y-4">
          <input type="hidden" name="locale" value={editorData.locale} />
          <input type="hidden" name="section" value={editorData.section} />
          <NavigationEditor
            locale={editorData.locale}
            hasCustomConfig={editorData.hasCustomConfig}
            initialItems={initialItems}
            parseWarning={parseWarning}
            section={editorData.section}
          />
        </form>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <form action={resetNavigationConfig} className="flex items-center justify-between gap-4">
          <input type="hidden" name="locale" value={editorData.locale} />
          <input type="hidden" name="section" value={editorData.section} />
          <div>
            <h3 className="font-medium">恢复默认配置</h3>
            <p className="text-sm text-zinc-500">将当前语言的 {editorData.section} 导航回退到代码内置默认值。</p>
          </div>
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            恢复默认
          </button>
        </form>
      </div>
    </div>
  );
}
