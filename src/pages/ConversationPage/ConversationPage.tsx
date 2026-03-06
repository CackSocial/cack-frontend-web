import { type FormEvent, useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Avatar, IconButton, ImageViewer } from '../../components/common';
import { useMessagesStore } from '../../stores/messagesStore';
import { useAuthStore } from '../../stores/authStore';
import * as usersAPI from '../../api/users';
import { mapUser } from '../../api/mappers';
import { formatMessageTime } from '../../utils/format';
import type { User } from '../../types';
import styles from './ConversationPage.module.css';

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
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationMessages = username ? (messages[username] ?? []) : [];

  useEffect(() => {
    if (!username) return;
    usersAPI.getProfile(username).then((res) => setPartner(mapUser(res.data!))).catch(() => {});
    fetchConversation(username);
    setActiveConversation(username);
    return () => setActiveConversation(null);
  }, [username, fetchConversation, setActiveConversation]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    messagesEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [conversationMessages.length]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !username) return;
    const content = text.trim();
    setText('');
    await sendMessage(username, content);
  };

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

      <form className={styles.inputArea} onSubmit={handleSend}>
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
          disabled={!text.trim()}
        >
          <Send size={18} />
        </IconButton>
      </form>

      <ImageViewer
        src={viewerImage ?? ''}
        alt="Shared image"
        isOpen={!!viewerImage}
        onClose={() => setViewerImage(null)}
      />
    </div>
  );
}

