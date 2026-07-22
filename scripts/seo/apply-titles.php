<?php
/**
 * Ahrefs 修复（2026-07）— 按 titles-manifest.json 为无标题旧文补 post_title。
 * 仅当线上 post_title 为空时写入（幂等，不会覆盖已有标题）；不动正文与 slug。
 *
 * 用法（服务器）：
 *   wp eval-file scripts/seo/apply-titles.php                 # dry-run
 *   SEO_APPLY=1 wp eval-file scripts/seo/apply-titles.php     # 实际写入
 */

if (!defined('ABSPATH') || !class_exists('WP_CLI')) {
    fwrite(STDERR, "必须通过 `wp eval-file` 运行。\n");
    exit(1);
}

$apply = getenv('SEO_APPLY') === '1';

$manifestPath = __DIR__ . '/titles-manifest.json';
$data = json_decode(file_get_contents($manifestPath), true);
if (!is_array($data) || empty($data['posts'])) {
    WP_CLI::error('titles-manifest.json 解析失败或缺少 posts');
}

WP_CLI::line($apply ? '== APPLY 模式（将写入数据库）==' : '== DRY-RUN 模式（不写入；加 SEO_APPLY=1 实际执行）==');

$updated = 0;
$missing = 0;
$skipped = 0;

foreach ($data['posts'] as $name => $title) {
    $q = get_posts(['name' => (string) $name, 'post_type' => 'post', 'post_status' => 'any', 'numberposts' => 1]);
    if (!$q) {
        WP_CLI::warning("未找到文章: {$name}");
        $missing++;
        continue;
    }
    $post = $q[0];

    if (trim($post->post_title) !== '') {
        WP_CLI::line("已有标题，跳过: {$name} => {$post->post_title}");
        $skipped++;
        continue;
    }

    WP_CLI::line("\n--- {$name} (ID {$post->ID}) ---");
    WP_CLI::line("title: (空) => {$title}");

    if ($apply) {
        $res = wp_update_post(['ID' => $post->ID, 'post_title' => $title], true);
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
    . "，已有标题跳过 {$skipped} 篇，未找到 {$missing} 篇。"
);
if (!$apply) {
    WP_CLI::line('确认无误后执行：SEO_APPLY=1 wp eval-file scripts/seo/apply-titles.php');
}
