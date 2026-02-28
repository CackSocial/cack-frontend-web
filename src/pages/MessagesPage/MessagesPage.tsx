import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Avatar } from '../../components/common';
import { useMessagesStore } from '../../stores/messagesStore';
import { formatMessageTime, truncate } from '../../utils/format';
import styles from './MessagesPage.module.css';

export function MessagesPage() {
  const conversations = useMessagesStore((s) => s.conversations);

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Messages</h1>

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
                    {conv.lastMessage.senderId === 'u0' ? 'You: ' : ''}
                    {truncate(conv.lastMessage.content, 60)}
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
