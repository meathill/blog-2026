<?php
/**
 * 备份 manifest.json 涉及文章的当前 title / excerpt / content 到 scripts/seo/backup/，
 * 作为 apply.php 写入前的编辑基线与回滚依据。
 *
 * 用法：wp eval-file scripts/seo/export-current.php
 */

if (!defined('ABSPATH') || !class_exists('WP_CLI')) {
    fwrite(STDERR, "必须通过 `wp eval-file` 运行。\n");
    exit(1);
}

$dir = __DIR__;
$backup = $dir . '/backup';
if (!is_dir($backup) && !mkdir($backup, 0755, true) && !is_dir($backup)) {
    WP_CLI::error("无法创建备份目录: {$backup}");
}

$data = json_decode(file_get_contents($dir . '/manifest.json'), true);
if (!is_array($data) || empty($data['posts'])) {
    WP_CLI::error('manifest.json 解析失败或缺少 posts');
}

$count = 0;
foreach (array_keys($data['posts']) as $name) {
    $q = get_posts(['name' => $name, 'post_type' => 'post', 'post_status' => 'any', 'numberposts' => 1]);
    if (!$q) {
        WP_CLI::warning("未找到: {$name}");
        continue;
    }
    $p = $q[0];
    file_put_contents("{$backup}/{$name}.content.html", $p->post_content);
    file_put_contents(
        "{$backup}/{$name}.meta.json",
        json_encode(
            ['id' => $p->ID, 'title' => $p->post_title, 'excerpt' => $p->post_excerpt],
            JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
        )
    );
    WP_CLI::success("已备份 {$name} (ID {$p->ID})");
    $count++;
}

WP_CLI::line("\n共备份 {$count} 篇到 {$backup}/");
