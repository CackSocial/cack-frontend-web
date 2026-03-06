import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, Trash2, Repeat2 } from 'lucide-react';
import { Avatar, Button, ConfirmDialog, ImageViewer, MentionAutocomplete } from '../../components/common';
import { PostComposer } from '../../components/post/PostComposer';
import { CommentThread } from '../../components/post/CommentThread';
import { usePostsStore } from '../../stores/postsStore';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import * as postsAPI from '../../api/posts';
import * as commentsAPI from '../../api/comments';
import * as likesAPI from '../../api/likes';
import * as bookmarksAPI from '../../api/bookmarks';
import * as repostsAPI from '../../api/reposts';
import { mapPost, mapComment } from '../../api/mappers';
import { formatFullDate, formatCount } from '../../utils/format';
import { renderTaggedContent } from '../../utils/renderTaggedContent';
import { sharePost } from '../../utils/share';
import type { Post, FlatComment } from '../../types';
import styles from './PostDetailPage.module.css';

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const deletePost = usePostsStore((s) => s.deletePost);
  const user = useAuthStore((s) => s.user);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<FlatComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [commentCursorPos, setCommentCursorPos] = useState(0);
  const [commentMentionOpen, setCommentMentionOpen] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(copiedTimerRef.current);
  }, []);

  const refreshPost = useCallback(async (id: string) => {
    try {
      const res = await postsAPI.getPost(id);
      if (res.data) setPost(mapPost(res.data));
    } catch {
      // keep current state if refresh fails
    }
  }, []);

  useEffect(() => {
    if (!postId) return;
    postsAPI.getPost(postId)
      .then((res) => {
        if (res.data) setPost(mapPost(res.data));
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));

    commentsAPI.getComments(postId)
      .then((res) => setComments(res.data.map(mapComment)));
  }, [postId]);

  // Helper: get the display post (unwrap reposts) and update the right part of state
  const getDisplayId = () => {
    if (!post) return null;
    return post.postType === 'repost' && post.originalPost ? post.originalPost.id : post.id;
  };

  const updateDisplayState = (updater: (p: Post) => Post) => {
    setPost((prev) => {
      if (!prev) return prev;
      if (prev.postType === 'repost' && prev.originalPost) {
        return { ...prev, originalPost: updater(prev.originalPost) };
      }
      return updater(prev);
    });
  };

  const handleLike = async () => {
    const displayId = getDisplayId();
    if (!post || !displayId) return;
    const dp = post.postType === 'repost' && post.originalPost ? post.originalPost : post;
    const wasLiked = dp.isLiked;
    const oldCount = dp.likesCount;
    updateDisplayState((p) => ({ ...p, isLiked: !wasLiked, likesCount: wasLiked ? oldCount - 1 : oldCount + 1 }));
    try {
      if (wasLiked) await likesAPI.unlikePost(displayId);
      else await likesAPI.likePost(displayId);
    } catch {
      updateDisplayState((p) => ({ ...p, isLiked: wasLiked, likesCount: oldCount }));
      useToastStore.getState().addToast('Failed to update like', 'error');
    }
  };

  const handleBookmark = async () => {
    const displayId = getDisplayId();
    if (!post || !displayId) return;
    const dp = post.postType === 'repost' && post.originalPost ? post.originalPost : post;
    const wasBookmarked = dp.isBookmarked;
    updateDisplayState((p) => ({ ...p, isBookmarked: !wasBookmarked }));
    try {
      if (wasBookmarked) await bookmarksAPI.unbookmarkPost(displayId);
      else await bookmarksAPI.bookmarkPost(displayId);
    } catch {
      updateDisplayState((p) => ({ ...p, isBookmarked: wasBookmarked }));
      useToastStore.getState().addToast('Failed to update bookmark', 'error');
    }
  };

  const handleRepost = async () => {
    const displayId = getDisplayId();
    if (!post || !displayId) return;
    const dp = post.postType === 'repost' && post.originalPost ? post.originalPost : post;
    const wasReposted = dp.isReposted;
    const oldCount = dp.repostCount;
    updateDisplayState((p) => ({ ...p, isReposted: !wasReposted, repostCount: wasReposted ? oldCount - 1 : oldCount + 1 }));
    try {
      if (wasReposted) await repostsAPI.unrepost(displayId);
      else await repostsAPI.repost(displayId);
    } catch {
      updateDisplayState((p) => ({ ...p, isReposted: wasReposted, repostCount: oldCount }));
      useToastStore.getState().addToast('Failed to update repost', 'error');
    }
  };

  const handleQuoteDone = () => {
    setQuoting(false);
    if (post) refreshPost(post.id);
  };

  const handleShare = useCallback(async () => {
    if (!post) return;
    const ok = await sharePost(post.id);
    if (ok) {
      setCopied(true);
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [post]);

  const handleDelete = async () => {
    if (!post) return;
    await deletePost(post.id);
    setShowDeleteConfirm(false);
    navigate(-1);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !postId) return;
    setSubmitting(true);
    try {
      const res = await commentsAPI.createComment(postId, commentText.trim());
      if (!res.data) throw new Error('No data returned');
      const newComment = mapComment(res.data);
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      setPost((p) => p ? { ...p, commentsCount: p.commentsCount + 1 } : p);
    } catch {
      useToastStore.getState().addToast('Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const updateCommentCursorPos = useCallback(() => {
    if (commentInputRef.current) {
      setCommentCursorPos(commentInputRef.current.selectionStart ?? 0);
    }
  }, []);

  const handleCommentMentionSelect = useCallback(
    (username: string) => {
      const before = commentText.slice(0, commentCursorPos);
      const atIndex = before.lastIndexOf('@');
      if (atIndex === -1) return;
      const after = commentText.slice(commentCursorPos);
      const newText = before.slice(0, atIndex) + '@' + username + ' ' + after;
      setCommentText(newText);
      setCommentMentionOpen(false);
      const newCursorPos = atIndex + username.length + 2;
      requestAnimationFrame(() => {
        if (commentInputRef.current) {
          commentInputRef.current.focus();
          commentInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          setCommentCursorPos(newCursorPos);
        }
      });
    },
    [commentText, commentCursorPos],
  );

  if (notFound) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className={styles.notFound}>Post not found</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
      </div>
    );
  }

  // For reposts, display the original post's content (mirrors PostCard logic)
  const displayPost = post.postType === 'repost' && post.originalPost ? post.originalPost : post;

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Back
      </button>

      <div className={styles.postSection}>
        {post.postType === 'repost' && (
          <div className={styles.repostBanner}>
            <Repeat2 size={14} />
            <Link to={`/profile/${post.author.username}`} className={styles.repostAuthorLink}>
              {post.author.displayName}
            </Link>
            {' '}reposted
          </div>
        )}

        <div className={styles.postHeader}>
          <Link to={`/profile/${displayPost.author.username}`}>
            <Avatar
              src={displayPost.author.avatarUrl}
              alt={displayPost.author.displayName}
              size="lg"
            />
          </Link>
          <div className={styles.authorInfo}>
            <Link
              to={`/profile/${displayPost.author.username}`}
              className={styles.authorName}
            >
              {displayPost.author.displayName}
            </Link>
            <div className={styles.authorHandle}>
              @{displayPost.author.username}
            </div>
          </div>
        </div>

        <div className={styles.postContent}>
          {renderTaggedContent(displayPost.content, styles.tag, undefined, styles.mention)}
        </div>

        {displayPost.imageUrl && (
          <img
            src={displayPost.imageUrl}
            alt="Post attachment"
            className={styles.postImage}
            onClick={() => setViewerOpen(true)}
            style={{ cursor: 'zoom-in' }}
          />
        )}

        {post.postType === 'quote' && post.originalPost && (
          <div className={styles.quotedPost}>
            <div className={styles.quotedHeader}>
              <Link
                to={`/profile/${post.originalPost.author.username}`}
                className={styles.authorName}
              >
                {post.originalPost.author.displayName}
              </Link>
              <span className={styles.authorHandle}>@{post.originalPost.author.username}</span>
            </div>
            <div className={styles.quotedContent}>
              {renderTaggedContent(post.originalPost.content, styles.tag, undefined, styles.mention)}
            </div>
            {post.originalPost.imageUrl && (
              <img
                src={post.originalPost.imageUrl}
                alt="Original post attachment"
                className={styles.quotedImage}
              />
            )}
          </div>
        )}

        <div className={styles.postMeta}>
          {formatFullDate(displayPost.createdAt)}
          {user?.id === post.author.id && (
            <button
              className={styles.deleteBtn}
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Delete post"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className={styles.postActions}>
          <button
            className={`${styles.stat} ${styles.statBtn}`}
            onClick={handleLike}
          >
            <Heart
              size={18}
              fill={displayPost.isLiked ? 'var(--color-like)' : 'none'}
              color={displayPost.isLiked ? 'var(--color-like)' : 'currentColor'}
              className={styles.statIcon}
            />
            <span className={styles.statCount}>
              {formatCount(displayPost.likesCount)}
            </span>{' '}
            likes
          </button>
          <span className={styles.stat}>
            <MessageCircle
              size={18}
              className={styles.statIcon}
            />
            <span className={styles.statCount}>
              {formatCount(displayPost.commentsCount)}
            </span>{' '}
            comments
          </span>
          <button
            className={`${styles.stat} ${styles.statBtn} ${displayPost.isReposted ? styles.statReposted : ''}`}
            onClick={handleRepost}
            aria-label={displayPost.isReposted ? 'Undo repost' : 'Repost'}
          >
            <Repeat2
              size={18}
              className={styles.statIcon}
            />
            <span className={styles.statCount}>
              {formatCount(displayPost.repostCount)}
            </span>{' '}
            reposts
          </button>
          <button
            className={`${styles.stat} ${styles.statBtn}`}
            onClick={() => setQuoting((q) => !q)}
          >
            <MessageCircle
              size={18}
              className={styles.statIcon}
            />
            Quote
          </button>
          <button
            className={`${styles.stat} ${styles.statBtn} ${displayPost.isBookmarked ? styles.statBookmarked : ''}`}
            onClick={handleBookmark}
          >
            <Bookmark
              size={18}
              fill={displayPost.isBookmarked ? 'currentColor' : 'none'}
              className={styles.statIcon}
            />
            {displayPost.isBookmarked ? 'Saved' : 'Save'}
          </button>
          <button
            className={`${styles.stat} ${styles.statBtn}`}
            onClick={handleShare}
          >
            <Share2
              size={18}
              className={styles.statIcon}
            />
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>

        {quoting && (
          <div className={styles.quoteComposer}>
            <PostComposer quotePost={displayPost} onClearQuote={handleQuoteDone} />
          </div>
        )}
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

      <div className={styles.commentsSection}>
        <h3 className={styles.commentsSectionTitle}>Comments</h3>

        <form
          className={styles.commentInput}
          onSubmit={handleCommentSubmit}
        >
          {user && (
            <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
          )}
          <div className={styles.commentInputWrap}>
            <input
              ref={commentInputRef}
              className={styles.commentInputField}
              placeholder="Write a comment…"
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                setCommentCursorPos(e.target.selectionStart ?? 0);
                setCommentMentionOpen(true);
              }}
              onSelect={updateCommentCursorPos}
              onClick={updateCommentCursorPos}
              onKeyUp={updateCommentCursorPos}
            />
            {commentMentionOpen && (
              <MentionAutocomplete
                inputValue={commentText}
                cursorPosition={commentCursorPos}
                onSelect={handleCommentMentionSelect}
                onClose={() => setCommentMentionOpen(false)}
              />
            )}
          </div>
          <Button size="sm" type="submit" disabled={!commentText.trim() || submitting}>
            Post
          </Button>
        </form>

        {comments.length > 0 ? (
          <CommentThread comments={comments} />
        ) : (
          <p className={styles.noComments}>
            No comments yet. Be the first to share your thoughts.
          </p>
        )}
      </div>
    </div>
  );
}

