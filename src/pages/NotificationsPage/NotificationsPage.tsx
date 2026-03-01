import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Heart, UserPlus, MessageCircle, AtSign, Repeat2 } from 'lucide-react';
import { Avatar } from '../../components/common';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { timeAgo } from '../../utils/format';
import type { Notification } from '../../types';
import styles from './NotificationsPage.module.css';

const typeConfig: Record<
  Notification['type'],
  { icon: typeof Heart; label: string; className: string }
> = {
  like: { icon: Heart, label: 'liked your post', className: styles.iconLike },
  follow: { icon: UserPlus, label: 'followed you', className: styles.iconFollow },
  comment: { icon: MessageCircle, label: 'commented on your post', className: styles.iconComment },
  mention: { icon: AtSign, label: 'mentioned you', className: styles.iconMention },
  repost: { icon: Repeat2, label: 'reposted your post', className: styles.iconRepost },
};

function getNotificationLink(n: Notification): string {
  switch (n.type) {
    case 'follow':
      return `/profile/${n.actor.username}`;
    case 'like':
    case 'comment':
    case 'mention':
    case 'repost':
      return n.referenceId ? `/post/${n.referenceId}` : '/';
    default:
      return '/';
  }
}

export function NotificationsPage() {
  const notifications = useNotificationsStore((s) => s.notifications);
  const isLoading = useNotificationsStore((s) => s.isLoading);
  const hasMore = useNotificationsStore((s) => s.hasMore);
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications(1, 20, false);
  }, [fetchNotifications]);

  const loadMore = useCallback(async () => {
    const nextPage = Math.floor(notifications.length / 20) + 1;
    await fetchNotifications(nextPage, 20, true);
    return hasMore;
  }, [fetchNotifications, notifications.length, hasMore]);

  const { sentinelRef } = useInfiniteScroll({
    loadMore,
    isLoading,
    hasMore,
  });

  const handleClick = (n: Notification) => {
    if (!n.isRead) {
      markAsRead(n.id);
    }
    navigate(getNotificationLink(n));
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Notifications</h1>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className={styles.list}>
        {!isLoading && notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={48} className={styles.emptyIcon} />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => {
            const config = typeConfig[n.type] ?? typeConfig.like;
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                className={`${styles.notificationItem} ${!n.isRead ? styles.unread : ''}`}
                onClick={() => handleClick(n)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleClick(n);
                }}
              >
                <div className={`${styles.iconWrap} ${config.className}`}>
                  <Icon size={18} />
                </div>
                <Avatar src={n.actor.avatarUrl} alt={n.actor.displayName} size="sm" />
                <div className={styles.notificationBody}>
                  <p className={styles.notificationText}>
                    <span className={styles.actorName}>{n.actor.displayName}</span>{' '}
                    {config.label}
                  </p>
                  <span className={styles.notificationTime}>{timeAgo(n.createdAt)}</span>
                </div>
                {!n.isRead && <span className={styles.unreadDot} />}
              </div>
            );
          })
        )}
        {hasMore && (
          <div ref={sentinelRef} className={styles.loadingMore}>
            {isLoading ? 'Loading…' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
