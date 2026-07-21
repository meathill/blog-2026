<?php
/**
 * Issue #5 — 导出全部已发布文章的 SEO 元信息，供本地 analyze-meta.ts 分析
 * title / description 过短问题（Bing Webmaster 反馈）。
 *
 * 用法（服务器）：wp eval-file scripts/seo/export-meta.php
 * 输出：scripts/seo/backup/meta-<date>.json，把它传回本地仓库使用。
 */

if (!defined('ABSPATH') || !class_exists('WP_CLI')) {
    fwrite(STDERR, "必须通过 `wp eval-file` 运行。\n");
    exit(1);
}

$backup = __DIR__ . '/backup';
if (!is_dir($backup) && !mkdir($backup, 0755, true) && !is_dir($backup)) {
    WP_CLI::error("无法创建备份目录: {$backup}");
}

$posts = get_posts([
    'post_type' => 'post',
    'post_status' => 'publish',
    'numberposts' => -1,
    'orderby' => 'ID',
    'order' => 'ASC',
]);

$rows = [];
foreach ($posts as $p) {
    $cats = array_map(
        static function ($term) {
            return $term->slug;
        },
        wp_get_post_categories($p->ID, ['fields' => 'all'])
    );
    $plain = trim(preg_replace('/\s+/u', ' ', wp_strip_all_tags($p->post_content)));
    $rows[] = [
        'id' => $p->ID,
        'slug' => $p->post_name,
        'category' => $cats ? $cats[0] : 'uncategorized',
        'title' => $p->post_title,
        'excerpt' => $p->post_excerpt,
        'contentLength' => strlen($p->post_content),
        'contentHead' => mb_substr($plain, 0, 200),
        'modified' => $p->post_modified_gmt,
    ];
}

$file = $backup . '/meta-' . date('Ymd') . '.json';
file_put_contents($file, json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
WP_CLI::success('已导出 ' . count($rows) . " 篇到 {$file}");
WP_CLI::line('把该文件传回本地后运行：node scripts/seo/analyze-meta.ts <文件路径>');
