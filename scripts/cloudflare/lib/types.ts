// Cloudflare API 响应与资源类型(只声明本任务用到的字段)

export interface CfError {
  code: number;
  message: string;
}

export interface CfResultInfo {
  page: number;
  per_page: number;
  total_pages?: number;
  count?: number;
  total_count?: number;
}

export interface CfEnvelope<T> {
  success: boolean;
  errors: CfError[];
  messages: CfError[];
  result: T;
  result_info?: CfResultInfo;
}

// ---- Rulesets(Cache Rules / WAF custom / Single Redirects 共用)----

export interface RulesetRule {
  id?: string;
  ref?: string;
  enabled?: boolean;
  description?: string;
  expression: string;
  action: string;
  action_parameters?: Record<string, unknown>;
  version?: string;
  last_updated?: string;
}

export interface Ruleset {
  id: string;
  name: string;
  description?: string;
  kind: string;
  phase: string;
  rules?: RulesetRule[];
  version?: string;
  last_updated?: string;
}

// ---- 旧版 Page Rules(只读盘点用)----

export interface PageRule {
  id: string;
  status: string;
  priority?: number;
  targets: { target: string; constraint: { operator: string; value: string } }[];
  actions: { id: string; value?: unknown }[];
}

// ---- Bulk Redirects(只读盘点用)----

export interface BulkRedirectList {
  id: string;
  name: string;
  kind: string;
  description?: string;
  num_items?: number;
}

export interface BulkRedirectItem {
  id?: string;
  redirect?: {
    source_url: string;
    target_url: string;
    status_code?: number;
    preserve_query_string?: boolean;
    subpath_matching?: boolean;
    preserve_path_suffix?: boolean;
  };
}

// ---- Cloudflare Access ----

export interface AccessDestination {
  type?: string;
  uri: string;
}

// Access app 字段较多且会随产品演进,未知字段以 unknown 透传,PUT 时原样带回
export interface AccessApp {
  id: string;
  uid?: string;
  aud?: string;
  name: string;
  type?: string;
  domain?: string;
  destinations?: AccessDestination[];
  self_hosted_domains?: string[];
  session_duration?: string;
  service_auth_401_redirect?: boolean;
  policies?: AccessPolicy[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface AccessRuleServiceToken {
  service_token?: { token_id: string };
  any_valid_service_token?: Record<string, never>;
  everyone?: Record<string, never>;
  [key: string]: unknown;
}

export interface AccessPolicy {
  id: string;
  uid?: string;
  name?: string;
  decision: string;
  precedence?: number;
  include?: AccessRuleServiceToken[];
  exclude?: AccessRuleServiceToken[];
  require?: AccessRuleServiceToken[];
  [key: string]: unknown;
}

export interface ServiceToken {
  id: string;
  name?: string;
  client_id: string;
  expires_at?: string;
  duration?: string;
  [key: string]: unknown;
}

export interface Zone {
  id: string;
  name: string;
}

export interface TieredCacheSetting {
  id?: string;
  value: string;
  editable?: boolean;
  modified_on?: string;
}
