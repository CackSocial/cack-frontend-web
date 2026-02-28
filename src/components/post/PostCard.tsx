import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Avatar } from '../common';
import { usePostsStore } from '../../stores/postsStore';
import { timeAgo, formatCount } from '../../utils/format';
import { renderTaggedContent } from '../../utils/renderTaggedContent';
import type { Post } from '../../types';
import styles from './PostCard.module.css';

interface PostCardProps {
  post: Post;
  index?: number;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const toggleLike = usePostsStore((s) => s.toggleLike);
  const [animating, setAnimating] = useState(false);
  const animationTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    return () => clearTimeout(animationTimer.current);
  }, []);

  const handleLike = useCallback(() => {
    toggleLike(post.id);
    if (!post.isLiked) {
      setAnimating(true);
      clearTimeout(animationTimer.current);
      animationTimer.current = setTimeout(() => setAnimating(false), 600);
    }
  }, [toggleLike, post.id, post.isLiked]);

  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={styles.cardInner}>
        <div className={styles.avatarCol}>
          <Link to={`/profile/${post.author.username}`}>
            <Avatar
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              size="md"
            />
          </Link>
        </div>

        <div className={styles.body}>
          <div className={styles.header}>
            <Link
              to={`/profile/${post.author.username}`}
              className={styles.displayName}
            >
              {post.author.displayName}
            </Link>
            <span className={styles.username}>@{post.author.username}</span>
            <span className={styles.dot}>·</span>
            <span className={styles.time}>{timeAgo(post.createdAt)}</span>
          </div>

          <div
            className={styles.contentLink}
            onClick={() => navigate(`/post/${post.id}`)}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/post/${post.id}`); }}
          >
            <div className={styles.content}>
              {renderTaggedContent(post.content, styles.tag, (e) => {
                e.stopPropagation();
              })}
            </div>
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Post attachment"
                className={styles.image}
                loading="lazy"
              />
            )}
          </div>

          <div className={styles.actions}>
            <button
              className={`${styles.action} ${post.isLiked ? styles.liked : ''}`}
              onClick={handleLike}
              aria-label={post.isLiked ? 'Unlike' : 'Like'}
            >
              <Heart
                size={18}
                fill={post.isLiked ? 'currentColor' : 'none'}
                className={`${styles.likeIcon} ${animating ? styles.animate : ''}`}
              />
              <span>{formatCount(post.likesCount)}</span>
            </button>

            <button
              className={styles.action}
              onClick={() => navigate(`/post/${post.id}`)}
              aria-label="Comments"
            >
              <MessageCircle size={18} />
              <span>{formatCount(post.commentsCount)}</span>
            </button>

            <button className={styles.action} aria-label="Share">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
