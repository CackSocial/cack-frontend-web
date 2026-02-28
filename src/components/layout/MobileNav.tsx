import { NavLink } from 'react-router-dom';
import { Home, Search, Mail, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useMessagesStore } from '../../stores/messagesStore';
import styles from './MobileNav.module.css';

export function MobileNav() {
  const user = useAuthStore((s) => s.user);
  const unreadTotal = useMessagesStore((s) => s.getUnreadTotal());

  const items = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/explore', icon: Search, label: 'Explore' },
    { to: '/messages', icon: Mail, label: 'Messages', showUnread: true },
    { to: `/profile/${user?.username ?? ''}`, icon: User, label: 'Profile' },
  ];

  return (
    <nav className={styles.mobileNav}>
      <div className={styles.navList}>
        {items.map(({ to, icon: Icon, label, showUnread }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            <Icon size={22} />
            <span className={styles.navItemLabel}>{label}</span>
            {showUnread && unreadTotal > 0 && (
              <span className={styles.unreadDot} />
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
