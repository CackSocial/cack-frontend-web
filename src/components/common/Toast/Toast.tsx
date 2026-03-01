import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { Toast as ToastType } from '../../../stores/toastStore';
import { useToastStore } from '../../../stores/toastStore';
import styles from './Toast.module.css';

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
} as const;

interface ToastProps {
  toast: ToastType;
}

export function Toast({ toast }: ToastProps) {
  const removeToast = useToastStore((s) => s.removeToast);
  const Icon = ICONS[toast.type];

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`} role="alert">
      <Icon size={18} className={styles.icon} />
      <span className={styles.message}>{toast.message}</span>
      <button className={styles.close} onClick={() => removeToast(toast.id)} aria-label="Dismiss">
        <X size={14} />
      </button>
      <div
        className={styles.progress}
        style={{ animationDuration: `${toast.duration}ms` }}
      />
    </div>
  );
}
