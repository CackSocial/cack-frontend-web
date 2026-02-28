import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as tagsAPI from '../../api/tags';
import { mapTag } from '../../api/mappers';
import { formatCount } from '../../utils/format';
import type { Tag } from '../../types';
import styles from './RightPanel.module.css';

export function RightPanel() {
  const [topTags, setTopTags] = useState<Tag[]>([]);

  useEffect(() => {
    tagsAPI.getTrendingTags().then((res) => {
      setTopTags((res.data ?? []).map(mapTag).slice(0, 7));
    }).catch(() => {});
  }, []);

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

      <div className={styles.footer}>
        © 2025 Cack Social · All rights reserved
      </div>
    </aside>
  );
}
