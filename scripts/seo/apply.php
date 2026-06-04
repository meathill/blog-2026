<?php
/**
 * Issue #4 — 在服务器上用 wp-cli 更新 5(+1) 篇技术文章的 SEO 文案。
 *
 * 用法（在 WordPress 根目录、能跑 wp-cli 的服务器上）：
 *   wp eval-file scripts/seo/apply.php                 # dry-run，仅打印将变更内容
 *   SEO_APPLY=1 wp eval-file scripts/seo/apply.php      # 实际写入
 *
 * 行为：按 manifest.json 更新 post_title / post_excerpt，并幂等插入
 *   - FAQ 区块（<h2>常见问题（FAQ）</h2> + h3/p，与前端 extractFaq 约定一致 → FAQPage 富结果）
 *   - 延伸阅读 区块（cluster 站内互链）
 * 两个区块都用 HTML 注释 marker 包裹，重复运行只替换区块内部，不会重复追加。
 * 不修改 slug（post_name），保护既有 URL 与排名。建议先 export-current.php 备份。
 */

if (!defined('ABSPATH') || !class_exists('WP_CLI')) {
    fwrite(STDERR, "必须通过 `wp eval-file` 运行。\n");
    exit(1);
}

$args = isset($args) && is_array($args) ? $args : [];
$apply = getenv('SEO_APPLY') === '1' || in_array('--apply', $args, true) || in_array('apply', $args, true);

$manifestPath = __DIR__ . '/manifest.json';
if (!file_exists($manifestPath)) {
    WP_CLI::error("找不到 manifest: {$manifestPath}");
}
$data = json_decode(file_get_contents($manifestPath), true);
if (!is_array($data) || empty($data['posts'])) {
    WP_CLI::error('manifest.json 解析失败或缺少 posts');
}
$posts = $data['posts'];

$FAQ_START = '<!-- seo:faq:start -->';
$FAQ_END = '<!-- seo:faq:end -->';
$REL_START = '<!-- seo:related:start -->';
$REL_END = '<!-- seo:related:end -->';

$splice = function ($content, $start, $end, $block) {
    $s = strpos($content, $start);
    $e = strpos($content, $end);
    if ($s !== false && $e !== false && $e > $s) {
        $before = substr($content, 0, $s);
        $after = substr($content, $e + strlen($end));
        return rtrim($before) . "\n" . $block . "\n" . ltrim($after);
    }
    return rtrim($content) . "\n\n" . $block . "\n";
};

$postUrl = function ($name) use ($posts) {
    $cat = isset($posts[$name]['category']) ? $posts[$name]['category'] : 'uncategorized';
    return "/posts/{$cat}/{$name}";
};

$findPost = function ($name) {
    $q = get_posts([
        'name' => $name,
        'post_type' => 'post',
        'post_status' => 'any',
        'numberposts' => 1,
    ]);
    return $q ? $q[0] : null;
};

WP_CLI::line($apply ? '== APPLY 模式（将写入数据库）==' : '== DRY-RUN 模式（不写入；加 SEO_APPLY=1 实际执行）==');

$updated = 0;
$missing = 0;

foreach ($posts as $name => $cfg) {
    $post = $findPost($name);
    if (!$post) {
        WP_CLI::warning("未找到文章: {$name}");
        $missing++;
        continue;
    }

    $faqHtml = '';
    if (!empty($cfg['faq'])) {
        $faqHtml = $FAQ_START . "\n<h2>常见问题（FAQ）</h2>\n";
        foreach ($cfg['faq'] as $qa) {
            $faqHtml .= '<h3>' . esc_html($qa['q']) . "</h3>\n<p>" . esc_html($qa['a']) . "</p>\n";
        }
        $faqHtml .= $FAQ_END;
    }

    $relHtml = '';
    if (!empty($cfg['related'])) {
        $relHtml = $REL_START . "\n<h2>延伸阅读</h2>\n<ul>\n";
        foreach ($cfg['related'] as $rel) {
            $label = isset($posts[$rel]['linkLabel']) ? $posts[$rel]['linkLabel'] : $rel;
            $relHtml .= '<li><a href="' . esc_url($postUrl($rel)) . '">' . esc_html($label) . "</a></li>\n";
        }
        $relHtml .= "</ul>\n" . $REL_END;
    }

    $newContent = $post->post_content;
    if ($faqHtml !== '') {
        $newContent = $splice($newContent, $FAQ_START, $FAQ_END, $faqHtml);
    }
    if ($relHtml !== '') {
        $newContent = $splice($newContent, $REL_START, $REL_END, $relHtml);
    }

    $newTitle = isset($cfg['title']) ? $cfg['title'] : $post->post_title;
    $newExcerpt = isset($cfg['excerpt']) ? $cfg['excerpt'] : $post->post_excerpt;

    WP_CLI::line("\n--- {$name} (ID {$post->ID}) ---");
    WP_CLI::line("title:   {$post->post_title}");
    WP_CLI::line("      => {$newTitle}");
    WP_CLI::line('excerpt: ' . mb_substr((string) $post->post_excerpt, 0, 70));
    WP_CLI::line('      => ' . mb_substr((string) $newExcerpt, 0, 70));
    WP_CLI::line('FAQ: ' . count($cfg['faq'] ?? []) . ' 条；延伸阅读: ' . count($cfg['related'] ?? []) . ' 链接；内容 '
        . strlen($post->post_content) . ' => ' . strlen($newContent) . ' 字节');

    if ($apply) {
        $res = wp_update_post([
            'ID' => $post->ID,
            'post_title' => $newTitle,
            'post_excerpt' => $newExcerpt,
            'post_content' => $newContent,
        ], true);
        if (is_wp_error($res)) {
            WP_CLI::warning('更新失败: ' . $res->get_error_message());
        } else {
            WP_CLI::success("已更新 {$name}");
            $updated++;
        }
    }
}

WP_CLI::line("\n完成。" . ($apply ? "已更新 {$updated} 篇" : 'dry-run（未写入）') . "，未找到 {$missing} 篇。");
if (!$apply) {
    WP_CLI::line('确认无误后执行：SEO_APPLY=1 wp eval-file scripts/seo/apply.php');
}
