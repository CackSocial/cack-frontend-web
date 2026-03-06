import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../common/Toast/ToastContainer';
import { useAuthStore } from '../../stores/authStore';
import { useMessagesStore } from '../../stores/messagesStore';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initWS = useMessagesStore((s) => s.initWS);
  const disconnectWS = useMessagesStore((s) => s.disconnectWS);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('sc-token');
    if (token) initWS(token);
    return () => disconnectWS();
  }, [isAuthenticated, initWS, disconnectWS]);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
      <RightPanel />
      <MobileNav />
      <ToastContainer />
    </div>
  );
}
