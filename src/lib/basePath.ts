/**
 * Helper utility to get the correct path for static assets like the logo
 * dynamically supporting both GitHub Pages (subpath) and Netlify/local (root path).
 */
export function getLogoPath(): string {
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('github.io')) {
      return '/ANIME-TRACKER/logo.png';
    }
  }
  return '/logo.png';
}
