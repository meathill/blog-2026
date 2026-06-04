<?php
/**
 * 在没有 WP-CLI 的服务器上运行本目录的 *.php（apply / export-current / restore）：
 * 直接 bootstrap WordPress 并为 WP_CLI 提供垫片，复用同一套逻辑。
 *
 * 用法（在 WordPress 所在服务器，以能读 wp-config 的用户运行，例如 www-data）：
 *   sudo -u www-data php runner.php export-current.php
 *   sudo -u www-data php runner.php apply.php                      # dry-run
 *   sudo -u www-data env SEO_APPLY=1 php runner.php apply.php      # 实际写入
 *   sudo -u www-data env SEO_APPLY=1 php runner.php restore.php    # 回滚
 *
 * WordPress 路径默认 /var/www/blog，可用 WP_PATH 覆盖。
 */

error_reporting(E_ERROR | E_PARSE); // 屏蔽老插件在 PHP 8.x 下的 deprecation 噪音

$WP_PATH = getenv('WP_PATH') ?: '/var/www/blog';
if (!file_exists($WP_PATH . '/wp-load.php')) {
    fwrite(STDERR, "找不到 WordPress: {$WP_PATH}/wp-load.php（用 WP_PATH 指定）\n");
    exit(1);
}
define('WP_USE_THEMES', false);
require $WP_PATH . '/wp-load.php';

if (!class_exists('WP_CLI')) {
    class WP_CLI
    {
        public static function line($m = '')
        {
            echo $m . "\n";
        }
        public static function success($m)
        {
            echo '✓ ' . $m . "\n";
        }
        public static function warning($m)
        {
            echo '⚠ ' . $m . "\n";
        }
        public static function error($m)
        {
            fwrite(STDERR, '✗ ' . $m . "\n");
            exit(1);
        }
    }
}

$args = [];
$target = isset($argv[1]) ? basename($argv[1]) : '';
if ($target === '' || !file_exists(__DIR__ . '/' . $target)) {
    fwrite(STDERR, "用法: php runner.php <export-current.php|apply.php|restore.php>\n");
    exit(1);
}
require __DIR__ . '/' . $target;
