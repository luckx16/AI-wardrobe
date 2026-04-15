import Link from 'next/link';
import React from 'react';

import styles from './SidebarNav.module.css';

export type SidebarNavItem = {
  key: string;
  label: string;
  href?: string;
  active?: boolean;
};

type SidebarNavProps = {
  title?: string;
  items: ReadonlyArray<SidebarNavItem>;
  className?: string;
  onItemClick?: (key: string) => void;
};

export function SidebarNav({ title, items, className, onItemClick }: SidebarNavProps): React.JSX.Element {
  return (
    <nav className={`${styles.nav}${className ? ` ${className}` : ''}`} aria-label={title ?? 'Profile navigation'}>
      {title ? <p className={styles.title}>{title}</p> : null}
      <ul className={styles.list}>
        {items.map((item) => {
          const cn = `${styles.item}${item.active ? ` ${styles.active}` : ''}`;
          return (
            <li key={item.key} className={styles.li}>
              {item.href ? (
                // Для якорей (#...) используем обычный <a>, чтобы скролл был нативным.
                item.href.startsWith('#') ? (
                  <a href={item.href} className={cn} onClick={() => onItemClick?.(item.key)}>
                    {item.label}
                  </a>
                ) : (
                  // Для "настоящих" роутов — Next Link.
                  <Link href={item.href} className={cn} onClick={() => onItemClick?.(item.key)}>
                    {item.label}
                  </Link>
                )
              ) : (
                <button type="button" className={cn} onClick={() => onItemClick?.(item.key)}>
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

