export interface NavItem {
  href: string;
  label: string;
  external?: boolean;
  children?: NavItem[];
}
