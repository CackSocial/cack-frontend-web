import { Link } from 'react-router-dom';
import { Avatar, Button } from '.';
import type { SuggestedUser } from '../../types';
import styles from './SuggestedUserCard.module.css';

interface SuggestedUserCardProps {
  user: SuggestedUser;
  isFollowing: boolean;
  onFollow: (username: string) => void;
  onUnfollow: (username: string) => void;
}

export function SuggestedUserCard({
  user,
  isFollowing,
  onFollow,
  onUnfollow,
}: SuggestedUserCardProps) {
  return (
    <div className={styles.card}>
      <Link to={`/profile/${user.username}`}>
        <Avatar src={user.avatarUrl} alt={user.displayName} size="lg" />
      </Link>
      <div className={styles.info}>
        <Link to={`/profile/${user.username}`} className={styles.displayName}>
          {user.displayName}
        </Link>
        <span className={styles.username}>@{user.username}</span>
        {user.mutualFollowerCount > 0 && (
          <span className={styles.mutual}>
            <span className={styles.mutualDot} />
            {user.mutualFollowerCount} mutual
          </span>
        )}
      </div>
      {isFollowing ? (
        <Button
          variant="secondary"
          size="sm"
          className={styles.followingBtn}
          onClick={() => onUnfollow(user.username)}
        >
          Following
        </Button>
      ) : (
        <Button
          variant="primary"
          size="sm"
          className={styles.followBtn}
          onClick={() => onFollow(user.username)}
        >
          Follow
        </Button>
      )}
    </div>
  );
}
