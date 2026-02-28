import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Avatar } from '../common';
import { usePostsStore } from '../../stores/postsStore';
import { timeAgo, formatCount } from '../../utils/format';
import type { Post } from '../../types';
import styles from './PostCard.module.css';

interface PostCardProps {
  post: Post;
  index?: number;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const toggleLike = usePostsStore((s) => s.toggleLike);
  const [animating, setAnimating] = useState(false);
  const navigate = useNavigate();

  const handleLike = useCallback(() => {
    toggleLike(post.id);
    if (!post.isLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 600);
    }
  }, [toggleLike, post.id, post.isLiked]);

  const renderContent = () => {
    const parts = post.content.split(/(#\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        const tag = part.slice(1).toLowerCase();
        return (
          <Link
            key={i}
            to={`/explore?tag=${tag}`}
            className={styles.tag}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

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

          <Link to={`/post/${post.id}`} className={styles.contentLink}>
            <div className={styles.content}>{renderContent()}</div>
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Post attachment"
                className={styles.image}
                loading="lazy"
              />
            )}
          </Link>

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
