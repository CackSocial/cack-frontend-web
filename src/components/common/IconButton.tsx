import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './IconButton.module.css';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  label: string;
  children: ReactNode;
}

export function IconButton({
  size = 'md',
  active = false,
  label,
  children,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={`${styles.iconButton} ${styles[size]} ${active ? styles.active : ''} ${className ?? ''}`}
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  );
}
