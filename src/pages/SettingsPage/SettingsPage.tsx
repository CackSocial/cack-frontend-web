import { type FormEvent, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { Avatar, Button, Input, Modal } from '../../components/common';
import { ThemeToggle } from '../../components/theme/ThemeToggle';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const { user, updateProfile, logout, deleteAccount } = useAuthStore();
  const navigate = useNavigate();
  const theme = useThemeStore((s) => s.theme);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    return () => {
      clearTimeout(savedTimer.current);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    await updateProfile({
      displayName: displayName.trim(),
      bio: bio.trim(),
      avatar: avatarFile ?? undefined,
    });
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    setSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount(deletePassword);
      navigate('/login');
    } catch {
      setDeleteError('Incorrect password. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Settings</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile</h2>
        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper}>
              <Avatar
                src={avatarPreview ?? user?.avatarUrl}
                alt={user?.displayName ?? 'User'}
                size="lg"
              />
              <button
                type="button"
                className={styles.avatarOverlay}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change avatar"
              >
                <Camera size={20} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={handleAvatarChange}
              />
            </div>
            <span className={styles.avatarInfo}>
              {avatarFile ? avatarFile.name : 'Click the camera icon to change your avatar'}
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
          <div className={styles.saveRow}>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Save Changes'}
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
          <div className={styles.dangerDivider} />
          <p className={styles.dangerText}>
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
            Delete Account
          </Button>
        </div>
      </section>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}
        title="Delete Account"
      >
        <p className={styles.dangerText}>
          This will permanently delete your account, posts, comments, likes, follows, and messages.
          Enter your password to confirm.
        </p>
        <div className={styles.deleteForm}>
          <Input
            label="Password"
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Enter your password"
          />
          {deleteError && <p className={styles.deleteError}>{deleteError}</p>}
          <div className={styles.deleteActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAccount}
              isLoading={deleting}
              disabled={!deletePassword.trim()}
            >
              Delete My Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
