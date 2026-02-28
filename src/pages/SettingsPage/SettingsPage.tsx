import { type FormEvent, useState } from 'react';
import { Avatar, Button, Input } from '../../components/common';
import { ThemeToggle } from '../../components/theme/ThemeToggle';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const { user, updateProfile, logout } = useAuthStore();
  const theme = useThemeStore((s) => s.theme);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    updateProfile({ displayName: displayName.trim(), bio: bio.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Settings</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile</h2>
        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.avatarSection}>
            <Avatar
              src={user?.avatarUrl}
              alt={user?.displayName ?? 'User'}
              size="lg"
            />
            <span className={styles.avatarInfo}>
              Avatar changes are not supported in demo mode
            </span>
          </div>
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people about yourself"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Button type="submit" size="sm">
              Save Changes
            </Button>
            {saved && <span className={styles.saved}>Saved!</span>}
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Appearance</h2>
        <div className={styles.themeRow}>
          <span className={styles.themeLabel}>
            Theme: {theme === 'light' ? 'Light' : 'Dark'}
          </span>
          <ThemeToggle />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <div className={styles.dangerZone}>
          <div className={styles.dangerTitle}>Danger Zone</div>
          <p className={styles.dangerText}>
            Logging out will end your current session.
          </p>
          <Button variant="danger" size="sm" onClick={logout}>
            Log Out
          </Button>
        </div>
      </section>
    </div>
  );
}
