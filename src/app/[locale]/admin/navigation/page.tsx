import { getNavigationEditorData, resetNavigationConfig, saveNavigationConfig } from '@/actions/navigation';

interface NavigationAdminPageProps {
  searchParams: Promise<{
    locale?: string;
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
  const status = buildStatusMessage(params);
  const editorData = await getNavigationEditorData(locale);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Navigation</h2>
          <p className="text-sm text-zinc-500">在这里编辑站点导航 JSON。保存后，前台 Header 会优先使用 D1 配置。</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/admin/navigation?locale=zh`}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              editorData.locale === 'zh'
                ? 'border-amber-600 bg-amber-50 text-amber-700'
                : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            中文
          </a>
          <a
            href={`/admin/navigation?locale=en`}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              editorData.locale === 'en'
                ? 'border-amber-600 bg-amber-50 text-amber-700'
                : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            English
          </a>
        </div>
      </div>

      {status && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {status.text}
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <form action={saveNavigationConfig} className="space-y-4">
          <input type="hidden" name="locale" value={editorData.locale} />
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              当前语言：<span className="font-medium text-zinc-700">{editorData.locale.toUpperCase()}</span>
              {editorData.hasCustomConfig ? '（使用自定义配置）' : '（使用默认配置）'}
            </p>
          </div>
          <textarea
            name="itemsJson"
            defaultValue={editorData.itemsJson}
            className="min-h-[420px] w-full rounded-md border border-zinc-300 bg-zinc-50 p-3 font-mono text-sm leading-6 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            spellCheck={false}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
            >
              保存导航配置
            </button>
            <p className="text-xs text-zinc-500">
              支持字段：`href`、`label`、`external`、`children`。`children` 需为数组。
            </p>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <form action={resetNavigationConfig} className="flex items-center justify-between gap-4">
          <input type="hidden" name="locale" value={editorData.locale} />
          <div>
            <h3 className="font-medium">恢复默认配置</h3>
            <p className="text-sm text-zinc-500">删除当前语言的自定义导航，回退到代码内置默认值。</p>
          </div>
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            恢复默认
          </button>
        </form>
      </div>
    </div>
  );
}
