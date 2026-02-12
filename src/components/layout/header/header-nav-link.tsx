import { Link } from '@/i18n/routing';
import type { NavItem } from './types';

interface HeaderNavLinkProps {
  item: NavItem;
  className: string;
  onClick?: () => void;
}

export function HeaderNavLink({ item, className, onClick }: HeaderNavLinkProps) {
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className} onClick={onClick}>
      {item.label}
    </Link>
  );
}
