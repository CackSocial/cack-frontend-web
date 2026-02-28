import { Link } from 'react-router-dom';
import { Avatar } from '../common';
import { timeAgo } from '../../utils/format';
import type { Comment, FlatComment } from '../../types';
import styles from './CommentThread.module.css';

interface CommentThreadProps {
  comments: Comment[] | FlatComment[];
}

export function CommentThread({ comments }: CommentThreadProps) {
  return (
    <div>
      {(comments as FlatComment[]).map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}

function CommentItem({ comment }: { comment: FlatComment }) {
  return (
    <div className={styles.comment}>
      <div className={styles.commentInner}>
        <Link to={`/profile/${comment.author.username}`}>
          <Avatar
            src={comment.author.avatarUrl}
            alt={comment.author.displayName}
            size="sm"
          />
        </Link>
        <div className={styles.commentBody}>
          <div className={styles.commentHeader}>
            <Link
              to={`/profile/${comment.author.username}`}
              className={styles.commentAuthor}
            >
              {comment.author.displayName}
            </Link>
            <span className={styles.commentUsername}>
              @{comment.author.username}
            </span>
            <span className={styles.commentTime}>
              · {timeAgo(comment.createdAt)}
            </span>
          </div>
          <p className={styles.commentContent}>{comment.content}</p>
        </div>
      </div>
    </div>
  );
}
