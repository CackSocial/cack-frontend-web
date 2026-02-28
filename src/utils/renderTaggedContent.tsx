import { Link } from 'react-router-dom';

/**
 * Renders post content with hashtags converted to clickable links.
 * Returns an array of React elements suitable for inline rendering.
 */
export function renderTaggedContent(
  content: string,
  tagClassName: string,
  onTagClick?: (e: React.MouseEvent) => void
): React.ReactNode[] {
  return content.split(/(#\w+)/g).map((part, i) => {
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
    return <span key={i}>{part}</span>;
  });
}
