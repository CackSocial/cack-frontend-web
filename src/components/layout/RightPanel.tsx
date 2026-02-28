import { Link } from 'react-router-dom';
import { Avatar } from '../common';
import { mockTrendingTags, mockUsers } from '../../data/mockData';
import { formatCount } from '../../utils/format';
import styles from './RightPanel.module.css';

export function RightPanel() {
  const topTags = mockTrendingTags.slice(0, 7);
  const suggestedUsers = mockUsers.slice(0, 4);

  return (
    <aside className={styles.panel}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Trending</h3>
        <div className={styles.tagList}>
          {topTags.map((tag) => (
            <Link
              key={tag.name}
              to={`/explore?tag=${tag.name}`}
              className={styles.tagItem}
            >
              <span className={styles.tagName}>#{tag.name}</span>
              <span className={styles.tagCount}>
                {formatCount(tag.postsCount)} posts
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Who to follow</h3>
        <div className={styles.userList}>
          {suggestedUsers.map((user) => (
            <Link
              key={user.id}
              to={`/profile/${user.username}`}
              className={styles.suggestedUser}
            >
              <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
              <div className={styles.suggestedInfo}>
                <div className={styles.suggestedName}>{user.displayName}</div>
                <div className={styles.suggestedHandle}>@{user.username}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className={styles.footer}>
        © 2025 Cack Social · All rights reserved
      </div>
    </aside>
  );
}
