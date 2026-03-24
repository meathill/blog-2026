import { getAboutContent, saveAboutContent } from '@/actions/about';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTab as TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function AboutAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string; saved?: string }>;
}) {
  const { locale: localeParam, saved } = await searchParams;
  const locale = localeParam === 'en' ? 'en' : 'zh';
  const aboutContent = await getAboutContent(locale);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">关于我管理</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-muted p-1">
            <a
              href="/admin/about?locale=zh"
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                locale === 'zh' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              中文
            </a>
            <a
              href="/admin/about?locale=en"
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                locale === 'en' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              English
            </a>
          </div>
        </div>
      </div>

      {saved === '1' && (
        <Alert variant="success">
          <CheckCircle2Icon className="h-4 w-4" />
          <AlertTitle>保存成功</AlertTitle>
          <AlertDescription>关于我内容已更新。</AlertDescription>
        </Alert>
      )}

      <form action={saveAboutContent}>
        <input type="hidden" name="locale" value={locale} />

        <Tabs defaultValue="main" className="space-y-4">
          <TabsList>
            <TabsTrigger value="main">主内容</TabsTrigger>
            <TabsTrigger value="github">GitHub README</TabsTrigger>
            <TabsTrigger value="sponsor">赞助页</TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            <Card>
              <CardHeader>
                <CardTitle>关于我 - 主内容</CardTitle>
                <CardDescription>这部分内容将显示在关于页面的“关于我”板块。</CardDescription>
              </CardHeader>
              <CardContent>
                <MarkdownEditor name="content" defaultValue={aboutContent?.content || ''} rows={15} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="github">
            <Card>
              <CardHeader>
                <CardTitle>GitHub Profile README</CardTitle>
                <CardDescription>管理你的 GitHub 个人页 (README.md) 内容。</CardDescription>
              </CardHeader>
              <CardContent>
                <MarkdownEditor name="githubContent" defaultValue={aboutContent?.githubContent || ''} rows={15} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sponsor">
            <Card>
              <CardHeader>
                <CardTitle>赞助页面内容</CardTitle>
                <CardDescription>管理 GitHub Sponsors 或其他平台的赞助说明。</CardDescription>
              </CardHeader>
              <CardContent>
                <MarkdownEditor name="sponsorContent" defaultValue={aboutContent?.sponsorContent || ''} rows={15} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button type="submit" size="lg">
            保存更改
          </Button>
        </div>
      </form>
    </div>
  );
}
