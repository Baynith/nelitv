/**
 * Dynamic SEO & Metadata Synchronizer
 * Automatically synchronizes Canonical URL, OpenGraph tags, Twitter cards,
 * and Schema.org JSON-LD with any custom domain deployed to Firebase Hosting.
 */

export function syncDynamicDomainMetadata() {
  if (typeof window === 'undefined') return;

  const currentOrigin = window.location.origin;
  const currentUrl = currentOrigin + window.location.pathname;

  // 1. Update Canonical Link
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = currentUrl;

  // 2. Update OpenGraph og:url
  let ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
  if (!ogUrl) {
    ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrl);
  }
  ogUrl.content = currentUrl;

  // 3. Update og:image and twitter:image to absolute URLs using the active custom domain
  const ogImg = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
  if (ogImg) {
    ogImg.content = `${currentOrigin}/logo.svg`;
  }
  const twImg = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement | null;
  if (twImg) {
    twImg.content = `${currentOrigin}/logo.svg`;
  }

  // 4. Update Schema.org Structured Data (JSON-LD)
  const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
  if (jsonLdScript) {
    try {
      const data = JSON.parse(jsonLdScript.textContent || '{}');
      data.url = currentOrigin;
      jsonLdScript.textContent = JSON.stringify(data, null, 2);
    } catch {}
  }
}
