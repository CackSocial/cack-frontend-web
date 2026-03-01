import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Home,
  Search,
  Mail,
  Settings,
  LogOut,
  Bookmark,
  Bell,
} from 'lucide-react';
import { Avatar, IconButton } from '../common';
import { ThemeToggle } from '../theme/ThemeToggle';
import { useAuthStore } from '../../stores/authStore';
import { useMessagesStore } from '../../stores/messagesStore';
import { useNotificationsStore } from '../../stores/notificationsStore';
import styles from './Sidebar.module.css';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/explore', icon: Search, label: 'Explore' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { to: '/messages', icon: Mail, label: 'Messages' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const unreadTotal = useMessagesStore((s) => s.getUnreadTotal());
  const notifUnread = useNotificationsStore((s) => s.unreadCount);
  const fetchUnreadCount = useNotificationsStore((s) => s.fetchUnreadCount);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>Cack Social</div>

      <nav className={styles.nav}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
            end={to === '/'}
          >
            <Icon size={22} />
            <span className={styles.navLabel}>{label}</span>
            {label === 'Messages' && unreadTotal > 0 && (
              <span className={styles.unreadDot} />
            )}
            {label === 'Notifications' && notifUnread > 0 && (
              <span className={styles.unreadBadge}>{notifUnread > 99 ? '99+' : notifUnread}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={styles.bottom}>
        {user && (
          <NavLink
            to={`/profile/${user.username}`}
            className={styles.userSection}
          >
            <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.displayName}</div>
              <div className={styles.userHandle}>@{user.username}</div>
            </div>
          </NavLink>
        )}
        <div className={styles.bottomActions}>
          <ThemeToggle />
          <IconButton label="Logout" onClick={handleLogout} size="md">
            <LogOut size={18} />
          </IconButton>
        </div>
      </div>
    </aside>
  );
}
