import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, PenSquare } from 'lucide-react';
import { Avatar } from '../../components/common';
import { useMessagesStore } from '../../stores/messagesStore';
import { formatMessageTime, truncate } from '../../utils/format';
import { useAuthStore } from '../../stores/authStore';
import styles from './MessagesPage.module.css';

export function MessagesPage() {
  const conversations = useMessagesStore((s) => s.conversations);
  const fetchConversations = useMessagesStore((s) => s.fetchConversations);
  const currentUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleNewConversation = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const username = newUsername.trim().replace(/^@/, '');
    if (!username) return;
    navigate(`/messages/${username}`);
  }, [newUsername, navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Messages</h1>
        <button
          className={styles.newMessageBtn}
          onClick={() => setShowNewMessage((v) => !v)}
          aria-label="New message"
        >
          <PenSquare size={20} />
        </button>
      </div>

      {showNewMessage && (
        <form className={styles.newMessageForm} onSubmit={handleNewConversation}>
          <input
            className={styles.newMessageInput}
            placeholder="Enter username…"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className={styles.newMessageSubmit}
            disabled={!newUsername.trim()}
          >
            Chat
          </button>
        </form>
      )}

      <div className={styles.list}>
        {conversations.length === 0 ? (
          <div className={styles.emptyState}>
            <MessageSquare size={48} className={styles.emptyIcon} />
            <p>No conversations yet</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <Link
              key={conv.id}
              to={`/messages/${conv.id}`}
              className={styles.conversationItem}
            >
              <Avatar
                src={conv.participant.avatarUrl}
                alt={conv.participant.displayName}
                size="md"
              />
              <div className={styles.conversationInfo}>
                <div className={styles.conversationTop}>
                  <span className={styles.conversationName}>
                    {conv.participant.displayName}
                  </span>
                  {conv.lastMessage && (
                    <span className={styles.conversationTime}>
                      {formatMessageTime(conv.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className={styles.conversationPreview}>
                    {conv.lastMessage.senderId === currentUser?.id ? 'You: ' : ''}
                    {conv.lastMessage.content
                      ? truncate(conv.lastMessage.content, 60)
                      : conv.lastMessage.imageUrl
                        ? '📷 Photo'
                        : ''}
                  </p>
                )}
              </div>
              {conv.unreadCount > 0 && (
                <span className={styles.unreadBadge}>
                  {conv.unreadCount}
                </span>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
