<?php
/**
 * 从 scripts/seo/backup/ 回滚 apply.php 所做的改动（title / excerpt / content）。
 *
 * 用法：
 *   wp eval-file scripts/seo/restore.php                # dry-run
 *   SEO_APPLY=1 wp eval-file scripts/seo/restore.php    # 实际恢复
 */

if (!defined('ABSPATH') || !class_exists('WP_CLI')) {
    fwrite(STDERR, "必须通过 `wp eval-file` 运行。\n");
    exit(1);
}

$args = isset($args) && is_array($args) ? $args : [];
$apply = getenv('SEO_APPLY') === '1' || in_array('--apply', $args, true);

$dir = __DIR__;
$backup = $dir . '/backup';
$data = json_decode(file_get_contents($dir . '/manifest.json'), true);
if (!is_array($data) || empty($data['posts'])) {
    WP_CLI::error('manifest.json 解析失败或缺少 posts');
}

WP_CLI::line($apply ? '== 恢复（将写入）==' : '== DRY-RUN（加 SEO_APPLY=1 实际恢复）==');

$restored = 0;
foreach (array_keys($data['posts']) as $name) {
    $metaFile = "{$backup}/{$name}.meta.json";
    $contentFile = "{$backup}/{$name}.content.html";
    if (!file_exists($metaFile) || !file_exists($contentFile)) {
        WP_CLI::warning("无备份，跳过: {$name}");
        continue;
    }
    $meta = json_decode(file_get_contents($metaFile), true);
    WP_CLI::line("恢复 {$name} (ID {$meta['id']})");
    if ($apply) {
        $res = wp_update_post([
            'ID' => $meta['id'],
            'post_title' => $meta['title'],
            'post_excerpt' => $meta['excerpt'],
            'post_content' => file_get_contents($contentFile),
        ], true);
        if (is_wp_error($res)) {
            WP_CLI::warning('恢复失败: ' . $res->get_error_message());
        } else {
            WP_CLI::success("已恢复 {$name}");
            $restored++;
        }
    }
}

WP_CLI::line("\n" . ($apply ? "已恢复 {$restored} 篇" : 'dry-run（未写入）'));
