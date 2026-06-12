<?php
/**
 * APCu 对象缓存 drop-in(blog.meathill.com TiDB 降载)
 *
 * 背景:WP 无对象缓存时,每个请求都从远程 TiDB 重复读 options/terms/postmeta
 *(实测 ~100+ RU/请求,autoload 全量读单次 30 RU)。本文件让这些重复读走本机
 * APCu 共享内存,DB 只在真正变更/未命中时被访问。
 *
 * 部署:cp 到 /var/www/blog/wp-content/object-cache.php(www-data 所有)。
 * 依赖:php8.5-apcu(apt),FPM 重启生效。
 * 回滚:删除本文件 + systemctl restart php8.5-fpm,WP 自动回到无缓存模式。
 * 注意:CLI(runner.php)下 APCu 默认禁用,本实现自动退化为请求内运行时缓存,
 *       行为与 WP 核心默认一致,脚本照常可用;但 CLI 对 DB 的写入不会使 FPM
 *       侧缓存失效,跑过 runner.php 改库后请 systemctl restart php8.5-fpm。
 */

defined('ABSPATH') || exit;

// phpcs:disable WordPress.NamingConventions -- 必须按 WP 核心约定命名

function wp_cache_init() {
	$GLOBALS['wp_object_cache'] = new APCu_Object_Cache();
}

function wp_cache_get( $key, $group = 'default', $force = false, &$found = null ) {
	return $GLOBALS['wp_object_cache']->get( $key, $group, $force, $found );
}

function wp_cache_get_multiple( $keys, $group = 'default', $force = false ) {
	$values = array();
	foreach ( $keys as $key ) {
		$values[ $key ] = wp_cache_get( $key, $group, $force );
	}
	return $values;
}

function wp_cache_set( $key, $data, $group = 'default', $expire = 0 ) {
	return $GLOBALS['wp_object_cache']->set( $key, $data, $group, (int) $expire );
}

function wp_cache_set_multiple( array $data, $group = 'default', $expire = 0 ) {
	$result = array();
	foreach ( $data as $key => $value ) {
		$result[ $key ] = wp_cache_set( $key, $value, $group, $expire );
	}
	return $result;
}

function wp_cache_add( $key, $data, $group = 'default', $expire = 0 ) {
	return $GLOBALS['wp_object_cache']->add( $key, $data, $group, (int) $expire );
}

function wp_cache_add_multiple( array $data, $group = 'default', $expire = 0 ) {
	$result = array();
	foreach ( $data as $key => $value ) {
		$result[ $key ] = wp_cache_add( $key, $value, $group, $expire );
	}
	return $result;
}

function wp_cache_replace( $key, $data, $group = 'default', $expire = 0 ) {
	return $GLOBALS['wp_object_cache']->replace( $key, $data, $group, (int) $expire );
}

function wp_cache_delete( $key, $group = 'default' ) {
	return $GLOBALS['wp_object_cache']->delete( $key, $group );
}

function wp_cache_delete_multiple( array $keys, $group = 'default' ) {
	$result = array();
	foreach ( $keys as $key ) {
		$result[ $key ] = wp_cache_delete( $key, $group );
	}
	return $result;
}

function wp_cache_incr( $key, $offset = 1, $group = 'default' ) {
	return $GLOBALS['wp_object_cache']->incr_decr( $key, (int) $offset, $group );
}

function wp_cache_decr( $key, $offset = 1, $group = 'default' ) {
	return $GLOBALS['wp_object_cache']->incr_decr( $key, -(int) $offset, $group );
}

function wp_cache_flush() {
	return $GLOBALS['wp_object_cache']->flush();
}

function wp_cache_flush_runtime() {
	return $GLOBALS['wp_object_cache']->flush_runtime();
}

function wp_cache_flush_group( $group ) {
	return $GLOBALS['wp_object_cache']->flush_group( $group );
}

function wp_cache_close() {
	return true;
}

function wp_cache_add_global_groups( $groups ) {
	$GLOBALS['wp_object_cache']->add_global_groups( (array) $groups );
}

function wp_cache_add_non_persistent_groups( $groups ) {
	$GLOBALS['wp_object_cache']->add_non_persistent_groups( (array) $groups );
}

function wp_cache_switch_to_blog( $blog_id ) {
	$GLOBALS['wp_object_cache']->switch_to_blog( (int) $blog_id );
}

function wp_cache_supports( $feature ) {
	return in_array(
		$feature,
		array( 'get_multiple', 'set_multiple', 'add_multiple', 'delete_multiple', 'flush_runtime', 'flush_group' ),
		true
	);
}

class APCu_Object_Cache {

	/** 请求内一级缓存(命中后不再触碰 APCu) */
	private array $runtime = array();

	private array $global_groups = array();

	private array $non_persistent_groups = array();

	private int $blog_id = 1;

	private bool $apcu_available;

	/** key 前缀,隔离同一 APCu 池里的其他使用方 */
	private string $prefix = 'wpblog:';

	public function __construct() {
		$enabled              = filter_var( ini_get( 'apc.enabled' ), FILTER_VALIDATE_BOOLEAN );
		$cli_ok               = PHP_SAPI !== 'cli' || filter_var( ini_get( 'apc.enable_cli' ), FILTER_VALIDATE_BOOLEAN );
		$this->apcu_available = function_exists( 'apcu_fetch' ) && $enabled && $cli_ok;
	}

	public function add_global_groups( array $groups ): void {
		foreach ( $groups as $group ) {
			$this->global_groups[ $group ] = true;
		}
	}

	public function add_non_persistent_groups( array $groups ): void {
		foreach ( $groups as $group ) {
			$this->non_persistent_groups[ $group ] = true;
		}
	}

	public function switch_to_blog( int $blog_id ): void {
		$this->blog_id = $blog_id;
	}

	private function build_key( string $key, string $group ): string {
		$blog = isset( $this->global_groups[ $group ] ) ? 0 : $this->blog_id;
		return $this->prefix . $blog . ':' . $group . ':' . $key;
	}

	private function is_persistent( string $group ): bool {
		return $this->apcu_available && ! isset( $this->non_persistent_groups[ $group ] );
	}

	public function get( $key, $group, $force, &$found ) {
		$group   = $group ?: 'default';
		$full    = $this->build_key( (string) $key, $group );
		if ( ! $force && array_key_exists( $full, $this->runtime ) ) {
			$found = true;
			$value = $this->runtime[ $full ];
			return is_object( $value ) ? clone $value : $value;
		}
		if ( $this->is_persistent( $group ) ) {
			$success = false;
			$value   = apcu_fetch( $full, $success );
			if ( $success ) {
				$this->runtime[ $full ] = $value;
				$found                  = true;
				return is_object( $value ) ? clone $value : $value;
			}
		}
		$found = false;
		return false;
	}

	public function set( $key, $data, $group, int $expire ): bool {
		$group = $group ?: 'default';
		$full  = $this->build_key( (string) $key, $group );
		$data  = is_object( $data ) ? clone $data : $data;

		$this->runtime[ $full ] = $data;
		if ( $this->is_persistent( $group ) ) {
			return (bool) apcu_store( $full, $data, $expire );
		}
		return true;
	}

	public function add( $key, $data, $group, int $expire ): bool {
		$group = $group ?: 'default';
		$full  = $this->build_key( (string) $key, $group );
		if ( array_key_exists( $full, $this->runtime ) ) {
			return false;
		}
		if ( $this->is_persistent( $group ) ) {
			if ( ! apcu_add( $full, is_object( $data ) ? clone $data : $data, $expire ) ) {
				return false;
			}
			$this->runtime[ $full ] = is_object( $data ) ? clone $data : $data;
			return true;
		}
		return $this->set( $key, $data, $group, $expire );
	}

	public function replace( $key, $data, $group, int $expire ): bool {
		$group = $group ?: 'default';
		$full  = $this->build_key( (string) $key, $group );
		$found = false;
		$this->get( $key, $group, false, $found );
		if ( ! $found ) {
			return false;
		}
		return $this->set( $key, $data, $group, $expire );
	}

	public function delete( $key, $group ): bool {
		$group = $group ?: 'default';
		$full  = $this->build_key( (string) $key, $group );
		unset( $this->runtime[ $full ] );
		if ( $this->is_persistent( $group ) ) {
			apcu_delete( $full );
		}
		return true;
	}

	public function incr_decr( $key, int $offset, $group ) {
		$group = $group ?: 'default';
		$found = false;
		$value = $this->get( $key, $group, false, $found );
		if ( ! $found || ! is_numeric( $value ) ) {
			return false;
		}
		$value = max( 0, (int) $value + $offset );
		$this->set( $key, $value, $group, 0 );
		return $value;
	}

	public function flush(): bool {
		$this->runtime = array();
		if ( $this->apcu_available ) {
			// 只清本前缀,不影响 APCu 池里的其他使用方
			apcu_delete( new APCUIterator( '/^' . preg_quote( $this->prefix, '/' ) . '/' ) );
		}
		return true;
	}

	public function flush_runtime(): bool {
		$this->runtime = array();
		return true;
	}

	public function flush_group( $group ): bool {
		$group  = (string) $group;
		$needle = ':' . $group . ':';
		foreach ( array_keys( $this->runtime ) as $full ) {
			if ( str_contains( $full, $needle ) ) {
				unset( $this->runtime[ $full ] );
			}
		}
		if ( $this->apcu_available ) {
			$pattern = '/^' . preg_quote( $this->prefix, '/' ) . '\d+:' . preg_quote( $group, '/' ) . ':/';
			apcu_delete( new APCUIterator( $pattern ) );
		}
		return true;
	}
}
