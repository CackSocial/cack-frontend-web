import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
}

export function Skeleton({ width, height = 16, circle = false, className }: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${circle ? styles.circle : ''} ${className ?? ''}`}
      style={{
        width: circle ? height : (width ?? '100%'),
        height,
      }}
      aria-hidden="true"
    />
  );
}
