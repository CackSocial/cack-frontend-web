import type { ReactNode } from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  variant?: 'default' | 'accent';
  interactive?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = 'default',
  interactive = false,
  onClick,
  children,
  className,
}: BadgeProps) {
  const classes = [
    styles.badge,
    styles[variant],
    interactive ? styles.interactive : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  if (interactive) {
    return (
      <button className={classes} onClick={onClick} type="button">
        {children}
      </button>
    );
  }

  return <span className={classes}>{children}</span>;
}
