<?php
/**
 * Issue #5 — 按 meta-manifest.json 批量更新文章 post_title / post_excerpt
 * （Bing description 补全）。不动 post_content、不动 slug。
 *
 * 用法（服务器）：
 *   wp eval-file scripts/seo/apply-meta.php                    # dry-run
 *   SEO_APPLY=1 wp eval-file scripts/seo/apply-meta.php        # 实际写入
 *   SEO_APPLY=1 SEO_KEEP_MODIFIED=1 wp eval-file ...           # 写入但保留原 post_modified
 *
 * 默认让 WP 自动 bump post_modified（sitemap lastmod 随之更新，利于重新抓取）。
 */

if (!defined('ABSPATH') || !class_exists('WP_CLI')) {
    fwrite(STDERR, "必须通过 `wp eval-file` 运行。\n");
    exit(1);
}

$apply = getenv('SEO_APPLY') === '1';
$keepModified = getenv('SEO_KEEP_MODIFIED') === '1';

$manifestPath = __DIR__ . '/meta-manifest.json';
$data = json_decode(file_get_contents($manifestPath), true);
if (!is_array($data) || empty($data['posts'])) {
    WP_CLI::error('meta-manifest.json 解析失败或缺少 posts');
}

WP_CLI::line($apply ? '== APPLY 模式（将写入数据库）==' : '== DRY-RUN 模式（不写入；加 SEO_APPLY=1 实际执行）==');

$updated = 0;
$missing = 0;
$skipped = 0;

foreach ($data['posts'] as $name => $cfg) {
    $q = get_posts(['name' => $name, 'post_type' => 'post', 'post_status' => 'any', 'numberposts' => 1]);
    if (!$q) {
        WP_CLI::warning("未找到文章: {$name}");
        $missing++;
        continue;
    }
    $post = $q[0];

    $newTitle = isset($cfg['title']) && $cfg['title'] !== '' ? $cfg['title'] : $post->post_title;
    $newExcerpt = isset($cfg['excerpt']) && $cfg['excerpt'] !== '' ? $cfg['excerpt'] : $post->post_excerpt;

    if ($newTitle === $post->post_title && $newExcerpt === $post->post_excerpt) {
        $skipped++;
        continue;
    }

    WP_CLI::line("\n--- {$name} (ID {$post->ID}) ---");
    WP_CLI::line("title:   {$post->post_title}");
    WP_CLI::line("      => {$newTitle}");
    WP_CLI::line('excerpt: ' . $post->post_excerpt);
    WP_CLI::line('      => ' . $newExcerpt);

    if ($apply) {
        $payload = [
            'ID' => $post->ID,
            'post_title' => $newTitle,
            'post_excerpt' => $newExcerpt,
        ];
        if ($keepModified) {
            // WP ≥5.6 支持显式传 post_modified 覆盖自动 bump
            $payload['post_modified'] = $post->post_modified;
            $payload['post_modified_gmt'] = $post->post_modified_gmt;
        }
        $res = wp_update_post($payload, true);
        if (is_wp_error($res)) {
            WP_CLI::warning('更新失败: ' . $res->get_error_message());
        } else {
            WP_CLI::success("已更新 {$name}");
            $updated++;
        }
    }
}

WP_CLI::line(
    "\n完成。" . ($apply ? "已更新 {$updated} 篇" : 'dry-run（未写入）')
    . "，无变化跳过 {$skipped} 篇，未找到 {$missing} 篇。"
);
if (!$apply) {
    WP_CLI::line('确认无误后执行：SEO_APPLY=1 wp eval-file scripts/seo/apply-meta.php');
}
