import { useState } from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const initial = alt.charAt(0).toUpperCase();

  if (!src || failed) {
    return (
      <div
        className={`${styles.avatar} ${styles.fallback} ${styles[size]} ${className ?? ''}`}
        role="img"
        aria-label={alt}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${styles.avatar} ${styles[size]} ${className ?? ''}`}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
