import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../../components/common';
import { ThemeToggle } from '../../components/theme/ThemeToggle';
import { useAuthStore } from '../../stores/authStore';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    if (!username.trim() || !password.trim()) return;
    await login(username.trim(), password);
    if (!useAuthStore.getState().error) {
      navigate('/');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.themeToggleWrap}>
        <ThemeToggle />
      </div>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>Cack Social</h1>
          <p className={styles.subtitle}>Welcome back. Sign in to continue.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          <Input
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Sign In
          </Button>
        </form>

        <div className={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.footerLink}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
