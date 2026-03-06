import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, Trash2, Repeat2, Quote } from 'lucide-react';
import { Avatar, ConfirmDialog, ImageViewer } from '../common';
import { usePostsStore } from '../../stores/postsStore';
import { useAuthStore } from '../../stores/authStore';
import { timeAgo, formatCount } from '../../utils/format';
import { renderTaggedContent } from '../../utils/renderTaggedContent';
import { sharePost } from '../../utils/share';
import type { Post } from '../../types';
import styles from './PostCard.module.css';

interface PostCardProps {
  post: Post;
  index?: number;
  onQuote?: (post: Post) => void;
  onLike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onRepost?: (postId: string) => void;
}

export function PostCard({ post, index = 0, onQuote, onLike, onBookmark, onRepost }: PostCardProps) {
  const storeToggleLike = usePostsStore((s) => s.toggleLike);
  const storeToggleBookmark = usePostsStore((s) => s.toggleBookmark);
  const storeToggleRepost = usePostsStore((s) => s.toggleRepost);
  const toggleLike = onLike ?? storeToggleLike;
  const toggleBookmark = onBookmark ?? storeToggleBookmark;
  const toggleRepost = onRepost ?? storeToggleRepost;
  const deletePost = usePostsStore((s) => s.deletePost);
  const currentUser = useAuthStore((s) => s.user);
  const [animating, setAnimating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const animationTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      clearTimeout(animationTimer.current);
      clearTimeout(copiedTimer.current);
    };
  }, []);

  // For reposts, display the original post's content
  const displayPost = post.postType === 'repost' && post.originalPost ? post.originalPost : post;

  const handleLike = useCallback(() => {
    toggleLike(displayPost.id);
    if (!displayPost.isLiked) {
      setAnimating(true);
      clearTimeout(animationTimer.current);
      animationTimer.current = setTimeout(() => setAnimating(false), 600);
    }
  }, [toggleLike, displayPost.id, displayPost.isLiked]);

  const handleShare = useCallback(async () => {
    const ok = await sharePost(post.id);
    if (ok) {
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [post.id]);

  const handleDelete = useCallback(async () => {
    await deletePost(post.id);
    setShowDeleteConfirm(false);
  }, [deletePost, post.id]);

  const isOwner = currentUser?.id === post.author.id;

  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {post.postType === 'repost' && (
        <div className={styles.repostHeader}>
          <Repeat2 size={14} />
          <Link to={`/profile/${post.author.username}`} className={styles.repostAuthor}>
            {post.author.displayName}
          </Link>
          <span>reposted</span>
        </div>
      )}

      <div className={styles.cardInner}>
        <div className={styles.avatarCol}>
          <Link to={`/profile/${displayPost.author.username}`}>
            <Avatar
              src={displayPost.author.avatarUrl}
              alt={displayPost.author.displayName}
              size="md"
            />
          </Link>
        </div>

        <div className={styles.body}>
          <div className={styles.header}>
            <Link
              to={`/profile/${displayPost.author.username}`}
              className={styles.displayName}
            >
              {displayPost.author.displayName}
            </Link>
            <span className={styles.username}>@{displayPost.author.username}</span>
            <span className={styles.dot}>·</span>
            <span className={styles.time}>{timeAgo(displayPost.createdAt)}</span>
            {isOwner && (
              <button
                className={styles.deleteBtn}
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Delete post"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <div
            className={styles.contentLink}
            onClick={() => navigate(`/post/${displayPost.id}`)}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/post/${displayPost.id}`); }}
          >
            <div className={styles.content}>
              {renderTaggedContent(displayPost.content, styles.tag, (e) => {
                e.stopPropagation();
              }, styles.mention)}
            </div>
            {displayPost.imageUrl && (
              <img
                src={displayPost.imageUrl}
                alt="Post attachment"
                className={styles.image}
                loading="lazy"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewerOpen(true);
                }}
                style={{ cursor: 'zoom-in' }}
              />
            )}

            {post.postType === 'quote' && post.originalPost && (
              <div className={styles.quotedPost} onClick={(e) => e.stopPropagation()}>
                <div className={styles.quotedHeader}>
                  <Link
                    to={`/profile/${post.originalPost.author.username}`}
                    className={styles.displayName}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {post.originalPost.author.displayName}
                  </Link>
                  <span className={styles.username}>@{post.originalPost.author.username}</span>
                  <span className={styles.dot}>·</span>
                  <span className={styles.time}>{timeAgo(post.originalPost.createdAt)}</span>
                </div>
                <div className={styles.quotedContent}>
                  {renderTaggedContent(post.originalPost.content, styles.tag, (e) => {
                    e.stopPropagation();
                  }, styles.mention)}
                </div>
                {post.originalPost.imageUrl && (
                  <img
                    src={post.originalPost.imageUrl}
                    alt="Original post attachment"
                    className={styles.quotedImage}
                    loading="lazy"
                  />
                )}
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button
              className={`${styles.action} ${displayPost.isLiked ? styles.liked : ''}`}
              onClick={handleLike}
              aria-label={displayPost.isLiked ? 'Unlike' : 'Like'}
            >
              <Heart
                size={18}
                fill={displayPost.isLiked ? 'currentColor' : 'none'}
                className={`${styles.likeIcon} ${animating ? styles.animate : ''}`}
              />
              <span>{formatCount(displayPost.likesCount)}</span>
            </button>

            <button
              className={styles.action}
              onClick={() => navigate(`/post/${displayPost.id}`)}
              aria-label="Comments"
            >
              <MessageCircle size={18} />
              <span>{formatCount(displayPost.commentsCount)}</span>
            </button>

            <button
              className={`${styles.action} ${displayPost.isReposted ? styles.reposted : ''}`}
              onClick={() => toggleRepost(displayPost.id)}
              aria-label={displayPost.isReposted ? 'Undo repost' : 'Repost'}
            >
              <Repeat2 size={18} />
              <span>{formatCount(displayPost.repostCount)}</span>
            </button>

            {onQuote && (
              <button
                className={styles.action}
                onClick={() => onQuote(displayPost)}
                aria-label="Quote"
              >
                <Quote size={18} />
              </button>
            )}

            <button
              className={`${styles.action} ${displayPost.isBookmarked ? styles.bookmarked : ''}`}
              onClick={() => toggleBookmark(displayPost.id)}
              aria-label={displayPost.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              <Bookmark
                size={18}
                fill={displayPost.isBookmarked ? 'currentColor' : 'none'}
              />
            </button>

            <button className={styles.action} onClick={handleShare} aria-label="Share">
              <Share2 size={18} />
              {copied && <span className={styles.copiedToast}>Copied!</span>}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
      />

      {displayPost.imageUrl && (
        <ImageViewer
          src={displayPost.imageUrl}
          alt="Post attachment"
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </article>
  );
}
