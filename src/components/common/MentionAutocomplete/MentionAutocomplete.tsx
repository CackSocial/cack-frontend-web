import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar } from '../Avatar';
import { useDebounce } from '../../../hooks/useDebounce';
import { lookupUser } from '../../../api/users';
import { mapUser } from '../../../api/mappers';
import type { User } from '../../../types';
import styles from './MentionAutocomplete.module.css';

interface MentionAutocompleteProps {
  inputValue: string;
  cursorPosition: number;
  onSelect: (username: string) => void;
  onClose: () => void;
}

/** Extract the partial username being typed after @ (looking backwards from cursor). */
function extractMentionQuery(value: string, cursor: number): string | null {
  const before = value.slice(0, cursor);
  const match = before.match(/@(\w+)$/);
  return match ? match[1] : null;
}

export function MentionAutocomplete({
  inputValue,
  cursorPosition,
  onSelect,
  onClose,
}: MentionAutocompleteProps) {
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const query = extractMentionQuery(inputValue, cursorPosition);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    lookupUser(debouncedQuery)
      .then((res) => {
        if (!cancelled && res.data) {
          setResults([mapUser(res.data)]);
          setActiveIndex(0);
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!query) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (results.length > 0) {
          e.preventDefault();
          onSelect(results[activeIndex].username);
        }
      }
    },
    [query, results, activeIndex, onSelect, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Don't render if no active mention query
  if (!query) return null;

  return (
    <div ref={dropdownRef} className={styles.dropdown}>
      {loading && <div className={styles.loading}>Searching…</div>}
      {!loading && results.length === 0 && debouncedQuery && (
        <div className={styles.noResults}>No users found</div>
      )}
      {results.map((user, i) => (
        <div
          key={user.id}
          className={`${styles.item} ${i === activeIndex ? styles.active : ''}`}
          onMouseEnter={() => setActiveIndex(i)}
          onMouseDown={(e) => {
            e.preventDefault(); // prevent input blur
            onSelect(user.username);
          }}
        >
          <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
          <div className={styles.itemInfo}>
            <span className={styles.displayName}>{user.displayName}</span>
            <span className={styles.username}>@{user.username}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
