import { type FormEvent, useState, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Avatar, Button, IconButton } from '../common';
import { useAuthStore } from '../../stores/authStore';
import { usePostsStore } from '../../stores/postsStore';
import styles from './PostComposer.module.css';

const MAX_CHARS = 500;

export function PostComposer() {
  const user = useAuthStore((s) => s.user);
  const addPost = usePostsStore((s) => s.addPost);
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isNearLimit = charCount > MAX_CHARS * 0.9;
  const canSubmit = content.trim().length > 0 && !isOverLimit;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    addPost(content.trim(), imagePreview ?? undefined);
    setContent('');
    setImagePreview(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.onerror = () => setImagePreview(null);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!user) return null;

  return (
    <div className={styles.composer}>
      <div className={styles.composerInner}>
        <div className={styles.avatarCol}>
          <Avatar src={user.avatarUrl} alt={user.displayName} size="md" />
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.textareaWrap}>
            <textarea
              className={styles.textarea}
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
            />
          </div>

          {imagePreview && (
            <div className={styles.imagePreview}>
              <img src={imagePreview} alt="Upload preview" />
              <button
                type="button"
                className={styles.removeImage}
                onClick={removeImage}
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className={styles.footer}>
            <div className={styles.footerActions}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.imageInput}
                onChange={handleImageSelect}
              />
              <IconButton
                label="Add image"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <ImagePlus size={18} />
              </IconButton>
            </div>

            <div className={styles.submitRow}>
              {content.length > 0 && (
                <span
                  className={`${styles.charCount} ${isOverLimit ? styles.over : isNearLimit ? styles.near : ''}`}
                >
                  {charCount}/{MAX_CHARS}
                </span>
              )}
              <Button type="submit" size="sm" disabled={!canSubmit}>
                Post
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
