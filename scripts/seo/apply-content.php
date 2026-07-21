<?php
/**
 * Issue #5 — 用 scripts/seo/content/<slug>.html 整篇替换对应文章的 post_content
 * （正文加深：2026 现状 / 常见坑 / 代码示例 / 正文互链）。
 *
 * 用法（服务器）：
 *   wp eval-file scripts/seo/apply-content.php                 # dry-run，输出 diff
 *   SEO_APPLY=1 wp eval-file scripts/seo/apply-content.php     # 实际写入
 *   SEO_APPLY=1 SEO_FORCE=1 wp eval-file ...                   # 跳过"变短超 30%"守卫
 *
 * 安全守卫：
 *   1. manifest.json 里该 slug 若有 faq/related，新内容必须保留对应 marker 区块，
 *      否则拒绝（防丢区块 / 防 apply.php 日后重复追加）。
 *   2. 新内容比现有短超 30% 时要求 SEO_FORCE=1（防止拿错基线覆盖）。
 *   3. 写入前务必先跑 export-current.php 备份。
 * 写入用 wp_update_post 且不传 post_modified —— WP 自动 bump，sitemap lastmod 随之更新。
 */

if (!defined('ABSPATH') || !class_exists('WP_CLI')) {
    fwrite(STDERR, "必须通过 `wp eval-file` 运行。\n");
    exit(1);
}

$apply = getenv('SEO_APPLY') === '1';
$force = getenv('SEO_FORCE') === '1';

$contentDir = __DIR__ . '/content';
$files = is_dir($contentDir) ? glob($contentDir . '/*.html') : [];
if (!$files) {
    WP_CLI::error("没有找到内容文件：{$contentDir}/*.html");
}

$manifest = json_decode((string) file_get_contents(__DIR__ . '/manifest.json'), true);
$manifestPosts = is_array($manifest) && !empty($manifest['posts']) ? $manifest['posts'] : [];

$showDiff = function (string $old, string $new, string $slug): void {
    $oldFile = tempnam(sys_get_temp_dir(), "seo-old-{$slug}-");
    $newFile = tempnam(sys_get_temp_dir(), "seo-new-{$slug}-");
    file_put_contents($oldFile, $old);
    file_put_contents($newFile, $new);
    $diff = shell_exec('diff -u ' . escapeshellarg($oldFile) . ' ' . escapeshellarg($newFile) . ' 2>/dev/null');
    unlink($oldFile);
    unlink($newFile);
    if ($diff !== null && $diff !== '') {
        WP_CLI::line($diff);
        return;
    }
    // 无 diff 命令时退化为长度 + 首个差异偏移
    $len = min(strlen($old), strlen($new));
    $offset = 0;
    while ($offset < $len && $old[$offset] === $new[$offset]) {
        $offset++;
    }
    WP_CLI::line('（diff 不可用）长度 ' . strlen($old) . ' => ' . strlen($new) . "，首个差异偏移 {$offset}");
};

WP_CLI::line($apply ? '== APPLY 模式（将写入数据库）==' : '== DRY-RUN 模式（不写入；加 SEO_APPLY=1 实际执行）==');

$updated = 0;

foreach ($files as $file) {
    $slug = basename($file, '.html');
    $newContent = rtrim((string) file_get_contents($file)) . "\n";

    $q = get_posts(['name' => $slug, 'post_type' => 'post', 'post_status' => 'any', 'numberposts' => 1]);
    if (!$q) {
        WP_CLI::warning("未找到文章: {$slug}");
        continue;
    }
    $post = $q[0];
    $oldContent = $post->post_content;

    WP_CLI::line("\n--- {$slug} (ID {$post->ID})，" . strlen($oldContent) . ' => ' . strlen($newContent) . ' 字节 ---');

    // 守卫 1：marker 区块不能丢
    $cfg = isset($manifestPosts[$slug]) ? $manifestPosts[$slug] : [];
    $requiredMarkers = [];
    if (!empty($cfg['faq'])) {
        $requiredMarkers[] = '<!-- seo:faq:start -->';
    }
    if (!empty($cfg['related'])) {
        $requiredMarkers[] = '<!-- seo:related:start -->';
    }
    $markerMissing = false;
    foreach ($requiredMarkers as $marker) {
        if (strpos($newContent, $marker) === false) {
            WP_CLI::warning("新内容缺少 {$marker} 区块，拒绝更新（manifest 中该文有对应配置）");
            $markerMissing = true;
        }
    }
    if ($markerMissing) {
        continue;
    }

    // 守卫 2：明显变短需要 SEO_FORCE=1
    if (strlen($newContent) < strlen($oldContent) * 0.7 && !$force) {
        WP_CLI::warning('新内容比现有短超 30%，疑似基线拿错；确认无误请加 SEO_FORCE=1');
        continue;
    }

    if ($newContent === $oldContent) {
        WP_CLI::line('内容无变化，跳过。');
        continue;
    }

    if (!$apply) {
        $showDiff($oldContent, $newContent, $slug);
        continue;
    }

    $res = wp_update_post(['ID' => $post->ID, 'post_content' => $newContent], true);
    if (is_wp_error($res)) {
        WP_CLI::warning('更新失败: ' . $res->get_error_message());
    } else {
        WP_CLI::success("已更新 {$slug}");
        $updated++;
    }
}

WP_CLI::line("\n完成。" . ($apply ? "已更新 {$updated} 篇" : 'dry-run（未写入）'));
if (!$apply) {
    WP_CLI::line('确认无误后执行：SEO_APPLY=1 wp eval-file scripts/seo/apply-content.php');
}
