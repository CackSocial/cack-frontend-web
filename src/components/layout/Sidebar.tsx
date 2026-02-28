import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  Mail,
  Settings,
  LogOut,
} from 'lucide-react';
import { Avatar, IconButton } from '../common';
import { ThemeToggle } from '../theme/ThemeToggle';
import { useAuthStore } from '../../stores/authStore';
import { useMessagesStore } from '../../stores/messagesStore';
import styles from './Sidebar.module.css';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/explore', icon: Search, label: 'Explore' },
  { to: '/messages', icon: Mail, label: 'Messages' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const unreadTotal = useMessagesStore((s) => s.getUnreadTotal());
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>Social Connect</div>

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
