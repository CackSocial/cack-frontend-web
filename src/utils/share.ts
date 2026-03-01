/**
 * Share a post URL using the Web Share API with clipboard fallback.
 * Returns true if the share/copy succeeded.
 */
export async function sharePost(postId: string): Promise<boolean> {
  const url = `${window.location.origin}/post/${postId}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Check out this post', url });
      return true;
    } catch {
      // User cancelled or share failed — fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
