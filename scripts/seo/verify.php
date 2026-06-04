<?php
/**
 * 只读校验：确认 apply 后的文章已含 FAQ / 延伸阅读 区块且 excerpt 已填。
 * 用法：sudo -u www-data php runner.php verify.php
 */

$data = json_decode(file_get_contents(__DIR__ . '/manifest.json'), true);
foreach (array_keys($data['posts']) as $name) {
    $q = get_posts(['name' => $name, 'post_type' => 'post', 'post_status' => 'any', 'numberposts' => 1]);
    if (!$q) {
        WP_CLI::warning("missing {$name}");
        continue;
    }
    $c = $q[0]->post_content;
    WP_CLI::line(sprintf(
        '%-56s faq-h2:%s marker:%s related:%s excerpt-len:%d',
        $name,
        strpos($c, '常见问题（FAQ）') !== false ? 'Y' : 'N',
        strpos($c, 'seo:faq:start') !== false ? 'Y' : 'N',
        strpos($c, 'seo:related:start') !== false ? 'Y' : 'N',
        mb_strlen((string) $q[0]->post_excerpt)
    ));
}
