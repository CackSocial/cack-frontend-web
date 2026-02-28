import { type TextareaHTMLAttributes, forwardRef } from 'react';
import styles from './Textarea.module.css';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  noBorder?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ noBorder = false, className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`${styles.textarea} ${noBorder ? styles.noBorder : ''} ${className ?? ''}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
