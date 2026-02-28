import { type FormEvent, useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Avatar, IconButton } from '../../components/common';
import { useMessagesStore } from '../../stores/messagesStore';
import { formatMessageTime } from '../../utils/format';
import styles from './ConversationPage.module.css';

export function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const conversations = useMessagesStore((s) => s.conversations);
  const messages = useMessagesStore((s) => s.messages);
  const sendMessage = useMessagesStore((s) => s.sendMessage);
  const setActiveConversation = useMessagesStore((s) => s.setActiveConversation);
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((c) => c.id === conversationId);
  const conversationMessages = conversationId
    ? (messages[conversationId] ?? [])
    : [];

  useEffect(() => {
    if (conversationId) setActiveConversation(conversationId);
    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    messagesEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [conversationMessages.length]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !conversationId) return;
    sendMessage(conversationId, text.trim());
    setText('');
  };

  if (!conversation) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>Conversation not found</div>
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
          src={conversation.participant.avatarUrl}
          alt={conversation.participant.displayName}
          size="sm"
        />
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>
            {conversation.participant.displayName}
          </div>
          <div className={styles.headerHandle}>
            @{conversation.participant.username}
          </div>
        </div>
      </div>

      <div className={styles.messagesArea}>
        {conversationMessages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.bubble} ${msg.senderId === 'u0' ? styles.sent : styles.received}`}
          >
            {msg.imageUrl && (
              <img
                src={msg.imageUrl}
                alt="Shared image"
                className={styles.bubbleImage}
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
    </div>
  );
}
