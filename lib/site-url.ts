/**
 * Origins used in Supabase email / recovery redirects.
 * Ignores NEXT_PUBLIC_SITE_URL when it still points at localhost so a bad
 * Vercel env copy-paste does not override the real browser origin on deploys.
 */
export function getBrowserAuthRedirectOrigin(): string {
  if (typeof window === "undefined") {
    return "http://localhost:3000";
  }

  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw && shouldUseConfiguredSiteUrl(raw)) {
    try {
      return new URL(raw).origin;
    } catch {
      // fall through
    }
  }
  return window.location.origin;
}

function shouldUseConfiguredSiteUrl(urlString: string): boolean {
  try {
    const u = new URL(urlString);
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return false;
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
