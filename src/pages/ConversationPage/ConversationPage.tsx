import { type FormEvent, useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, ImagePlus, X } from 'lucide-react';
import { Avatar, IconButton, ImageViewer } from '../../components/common';
import { useMessagesStore } from '../../stores/messagesStore';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import * as usersAPI from '../../api/users';
import { mapUser } from '../../api/mappers';
import { formatMessageTime } from '../../utils/format';
import type { User } from '../../types';
import styles from './ConversationPage.module.css';

const MAX_IMAGE_SIZE_MB = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function ConversationPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const messages = useMessagesStore((s) => s.messages);
  const sendMessage = useMessagesStore((s) => s.sendMessage);
  const fetchConversation = useMessagesStore((s) => s.fetchConversation);
  const setActiveConversation = useMessagesStore((s) => s.setActiveConversation);

  const [partner, setPartner] = useState<User | null>(null);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversationMessages = username ? (messages[username] ?? []) : [];

  // Manage object URL lifecycle for image preview
  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      useToastStore.getState().addToast('Only JPEG, PNG, GIF, and WebP images are allowed', 'error');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      useToastStore.getState().addToast(`Image must be under ${MAX_IMAGE_SIZE_MB}MB`, 'error');
      return;
    }
    setImageFile(file);
  }, []);

  const clearImage = useCallback(() => {
    setImageFile(null);
  }, []);

  useEffect(() => {
    if (!username) return;
    usersAPI.getProfile(username)
      .then((res) => {
        if (res.data) setPartner(mapUser(res.data));
      })
      .catch(() => {
        // Profile fetch failed — navigate back
        navigate('/messages');
      });
    fetchConversation(username);
    setActiveConversation(username);
    return () => setActiveConversation(null);
  }, [username, fetchConversation, setActiveConversation, navigate]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    messagesEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [conversationMessages.length]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if ((!content && !imageFile) || !username || sending) return;
    const currentImage = imageFile;
    setText('');
    setImageFile(null);
    setSending(true);
    try {
      await sendMessage(username, content, currentImage);
    } finally {
      setSending(false);
    }
  };

  const canSend = !sending && (!!text.trim() || !!imageFile);

  if (!partner) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>Loading…</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/messages')}>
          <ArrowLeft size={18} />
        </button>
        <Avatar
          src={partner.avatarUrl}
          alt={partner.displayName}
          size="sm"
        />
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>{partner.displayName}</div>
          <div className={styles.headerHandle}>@{partner.username}</div>
        </div>
      </div>

      <div className={styles.messagesArea}>
        {conversationMessages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.bubble} ${msg.senderId === currentUser?.id ? styles.sent : styles.received}`}
          >
            {msg.imageUrl && (
              <img
                src={msg.imageUrl}
                alt="Shared image"
                className={styles.bubbleImage}
                onClick={() => setViewerImage(msg.imageUrl!)}
                style={{ cursor: 'zoom-in' }}
              />
            )}
            <div>{msg.content}</div>
            <div className={styles.bubbleTime}>
              {formatMessageTime(msg.createdAt)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputWrapper}>
        {imagePreviewUrl && (
          <div className={styles.imagePreview}>
            <div className={styles.imagePreviewInner}>
              <img
                src={imagePreviewUrl}
                alt="Selected attachment"
                className={styles.previewThumb}
              />
              <button
                type="button"
                className={styles.removeImage}
                onClick={clearImage}
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
        <form className={styles.inputArea} onSubmit={handleSend}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className={styles.fileInput}
            onChange={handleImageSelect}
          />
          <IconButton
            label="Attach image"
            size="lg"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus size={18} />
          </IconButton>
          <input
            className={styles.messageInput}
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <IconButton
            label="Send message"
            size="lg"
            type="submit"
            disabled={!canSend}
          >
            <Send size={18} />
          </IconButton>
        </form>
      </div>

      <ImageViewer
        src={viewerImage ?? ''}
        alt="Shared image"
        isOpen={!!viewerImage}
        onClose={() => setViewerImage(null)}
      />
    </div>
  );
}

