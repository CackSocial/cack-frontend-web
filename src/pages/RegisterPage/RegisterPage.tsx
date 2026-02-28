import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../../components/common';
import { ThemeToggle } from '../../components/theme/ThemeToggle';
import { useAuthStore } from '../../stores/authStore';
import styles from './RegisterPage.module.css';

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    if (!username.trim() || !displayName.trim() || !password.trim()) {
      setValidationError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    await register(username.trim(), displayName.trim(), password);
    if (!useAuthStore.getState().error) {
      navigate('/');
    }
  };

  const displayError = validationError || error;

  return (
    <div className={styles.page}>
      <div className={styles.themeToggleWrap}>
        <ThemeToggle />
      </div>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>Cack Social</h1>
          <p className={styles.subtitle}>Create your account</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {displayError && <div className={styles.error}>{displayError}</div>}
          <Input
            label="Display Name"
            placeholder="Your full name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoFocus
          />
          <Input
            label="Username"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Create Account
          </Button>
        </form>

        <div className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.footerLink}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
