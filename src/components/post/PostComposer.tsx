import { type FormEvent, useState, useRef, useCallback } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Avatar, Button, IconButton, MentionAutocomplete } from '../common';
import { useAuthStore } from '../../stores/authStore';
import { usePostsStore } from '../../stores/postsStore';
import { timeAgo } from '../../utils/format';
import { renderTaggedContent } from '../../utils/renderTaggedContent';
import type { Post } from '../../types';
import styles from './PostComposer.module.css';

const MAX_CHARS = 500;

interface PostComposerProps {
  quotePost?: Post | null;
  onClearQuote?: () => void;
}

export function PostComposer({ quotePost: quotingPost, onClearQuote }: PostComposerProps) {
  const user = useAuthStore((s) => s.user);
  const addPost = usePostsStore((s) => s.addPost);
  const storeQuotePost = usePostsStore((s) => s.quotePost);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [mentionOpen, setMentionOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isNearLimit = charCount > MAX_CHARS * 0.9;
  const canSubmit = (content.trim().length > 0 || imageFile !== null) && !isOverLimit && !isSubmitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    if (quotingPost) {
      await storeQuotePost(quotingPost.id, content.trim(), imageFile);
      onClearQuote?.();
    } else {
      await addPost(content.trim(), imageFile);
    }
    setContent('');
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsSubmitting(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.onerror = () => { setImageFile(null); setImagePreview(null); };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateCursorPos = useCallback(() => {
    if (textareaRef.current) {
      setCursorPos(textareaRef.current.selectionStart);
    }
  }, []);

  const handleMentionSelect = useCallback(
    (username: string) => {
      // Find the @ and partial text before cursor, replace with full @username
      const before = content.slice(0, cursorPos);
      const atIndex = before.lastIndexOf('@');
      if (atIndex === -1) return;
      const after = content.slice(cursorPos);
      const newContent = before.slice(0, atIndex) + '@' + username + ' ' + after;
      setContent(newContent);
      setMentionOpen(false);
      // Restore focus and cursor position after the inserted mention
      const newCursorPos = atIndex + username.length + 2; // @username + space
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          setCursorPos(newCursorPos);
        }
      });
    },
    [content, cursorPos],
  );

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
              ref={textareaRef}
              className={styles.textarea}
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setCursorPos(e.target.selectionStart);
                setMentionOpen(true);
              }}
              onSelect={updateCursorPos}
              onClick={updateCursorPos}
              onKeyUp={updateCursorPos}
              rows={2}
            />
            {mentionOpen && (
              <MentionAutocomplete
                inputValue={content}
                cursorPosition={cursorPos}
                onSelect={handleMentionSelect}
                onClose={() => setMentionOpen(false)}
              />
            )}
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

          {quotingPost && (
            <div className={styles.quotePreview}>
              <div className={styles.quotePreviewHeader}>
                <span className={styles.quotePreviewLabel}>Quoting</span>
                <button
                  type="button"
                  className={styles.quotePreviewClose}
                  onClick={onClearQuote}
                  aria-label="Cancel quote"
                >
                  <X size={14} />
                </button>
              </div>
              <div className={styles.quotePreviewCard}>
                <div className={styles.quotePreviewMeta}>
                  <strong>{quotingPost.author.displayName}</strong>
                  <span className={styles.quotePreviewUsername}>@{quotingPost.author.username}</span>
                  <span className={styles.quotePreviewDot}>·</span>
                  <span className={styles.quotePreviewTime}>{timeAgo(quotingPost.createdAt)}</span>
                </div>
                <div className={styles.quotePreviewContent}>
                  {renderTaggedContent(quotingPost.content, styles.quotePreviewTag)}
                </div>
              </div>
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
              <Button type="submit" size="sm" disabled={!canSubmit} isLoading={isSubmitting}>
                {quotingPost ? 'Quote' : 'Post'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
