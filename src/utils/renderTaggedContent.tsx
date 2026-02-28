import { Link } from 'react-router-dom';

/**
 * Renders post content with hashtags and @mentions converted to clickable links.
 * Returns an array of React elements suitable for inline rendering.
 */
export function renderTaggedContent(
  content: string,
  tagClassName: string,
  onTagClick?: (e: React.MouseEvent) => void,
  mentionClassName?: string,
): React.ReactNode[] {
  return content.split(/(#\w+|@\w+)/g).map((part, i) => {
    if (part.startsWith('#')) {
      const tag = part.slice(1).toLowerCase();
      return (
        <Link
          key={i}
          to={`/explore?tag=${tag}`}
          className={tagClassName}
          onClick={onTagClick}
        >
          {part}
        </Link>
      );
    }
    if (part.startsWith('@')) {
      const username = part.slice(1);
      return (
        <Link
          key={i}
          to={`/profile/${username}`}
          className={mentionClassName ?? tagClassName}
          onClick={onTagClick}
        >
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
