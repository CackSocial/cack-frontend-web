import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Hash } from 'lucide-react';
import { Avatar } from '../../components/common';
import { PostCard } from '../../components/post';
import { usePostsStore } from '../../stores/postsStore';
import { useDebounce } from '../../hooks/useDebounce';
import { mockTrendingTags, mockUsers } from '../../data/mockData';
import { formatCount } from '../../utils/format';
import styles from './ExplorePage.module.css';

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get('tag');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const posts = usePostsStore((s) => s.posts);

  const filteredPosts = useMemo(() => {
    if (activeTag) {
      return posts.filter((p) => p.tags.includes(activeTag.toLowerCase()));
    }
    return [];
  }, [posts, activeTag]);

  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return { users: [], tags: [] };
    const q = debouncedQuery.toLowerCase();
    const users = mockUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q)
    );
    const tags = mockTrendingTags.filter((t) =>
      t.name.toLowerCase().includes(q)
    );
    return { users: users.slice(0, 5), tags: tags.slice(0, 5) };
  }, [debouncedQuery]);

  const hasSearchResults =
    searchResults.users.length > 0 || searchResults.tags.length > 0;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Explore</h1>

      <div className={styles.searchWrap}>
        <Search size={18} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search users or tags…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {debouncedQuery.trim() && hasSearchResults && (
          <div className={styles.dropdown}>
            {searchResults.users.map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.username}`}
                className={styles.dropdownItem}
                onClick={() => setQuery('')}
              >
                <Avatar
                  src={user.avatarUrl}
                  alt={user.displayName}
                  size="sm"
                />
                <div>
                  <div>{user.displayName}</div>
                  <div className={styles.dropdownLabel}>
                    @{user.username}
                  </div>
                </div>
              </Link>
            ))}
            {searchResults.tags.map((tag) => (
              <Link
                key={tag.name}
                to={`/explore?tag=${tag.name}`}
                className={styles.dropdownItem}
                onClick={() => setQuery('')}
              >
                <Hash size={16} />
                <div>
                  <div>#{tag.name}</div>
                  <div className={styles.dropdownLabel}>
                    {formatCount(tag.postsCount)} posts
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {activeTag ? (
        <>
          <div className={styles.activeTag}>
            <span className={styles.activeTagName}>#{activeTag}</span>
            <button
              className={styles.clearTag}
              onClick={() => setSearchParams({})}
            >
              Clear
            </button>
          </div>
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))
          ) : (
            <div className={styles.noResults}>
              No posts found with #{activeTag}
            </div>
          )}
        </>
      ) : (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Trending Tags</h2>
          <div className={styles.tagsGrid}>
            {mockTrendingTags.map((tag) => (
              <Link
                key={tag.name}
                to={`/explore?tag=${tag.name}`}
                className={styles.tagChip}
              >
                #{tag.name}
                <span className={styles.tagChipCount}>
                  {formatCount(tag.postsCount)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
