import { getNavigationEditorData, resetNavigationConfig, saveNavigationConfig } from '@/actions/navigation';
import { NavigationEditor } from '@/components/admin/navigation-editor';
import { getDefaultNavigationItems, parseNavigationItemsJson, resolveNavigationSection } from '@/lib/navigation-config';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2Icon, AlertCircleIcon } from 'lucide-react';

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

function SegmentedControl({
  items,
}: {
  items: { label: string; href: string; active: boolean }[];
}) {
  return (
    <div className="flex rounded-lg bg-muted p-1">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
            item.active
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Navigation</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            所见即所得编辑导航，支持拖拽排序。可切换编辑 Header / Footer，保存后前台会优先使用 D1 配置。
          </p>
        </div>
        <SegmentedControl
          items={[
            { label: '中文', href: `/admin/navigation?locale=zh&section=${editorData.section}`, active: editorData.locale === 'zh' },
            { label: 'English', href: `/admin/navigation?locale=en&section=${editorData.section}`, active: editorData.locale === 'en' },
          ]}
        />
      </div>

      <SegmentedControl
        items={[
          { label: 'Header', href: `/admin/navigation?locale=${editorData.locale}&section=header`, active: editorData.section === 'header' },
          { label: 'Footer', href: `/admin/navigation?locale=${editorData.locale}&section=footer`, active: editorData.section === 'footer' },
        ]}
      />

      {status && (
        <Alert variant={status.type === 'success' ? 'success' : 'error'}>
          {status.type === 'success' ? <CheckCircle2Icon /> : <AlertCircleIcon />}
          <AlertDescription>{status.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <form action={resetNavigationConfig} className="flex items-center justify-between gap-4">
            <input type="hidden" name="locale" value={editorData.locale} />
            <input type="hidden" name="section" value={editorData.section} />
            <div>
              <h3 className="font-medium text-foreground">恢复默认配置</h3>
              <p className="text-sm text-muted-foreground">
                将当前语言的 {editorData.section} 导航回退到代码内置默认值。
              </p>
            </div>
            <Button type="submit" variant="outline">
              恢复默认
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
