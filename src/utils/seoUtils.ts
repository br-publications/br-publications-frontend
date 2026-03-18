/**
 * SEO Utility Functions
 * Call these after page data is loaded to set SEO-relevant metadata.
 */

/**
 * Set the page <title> tag
 */
export const setPageTitle = (title: string): void => {
  document.title = title;
};

/**
 * Set or update a <meta> tag by name
 */
const setMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name'): void => {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

/**
 * Set meta description
 */
export const setMetaDescription = (description: string): void => {
  const truncated = description.length > 160 ? description.slice(0, 157) + '...' : description;
  setMetaTag('description', truncated);
  // OpenGraph & Twitter
  setMetaTag('og:description', truncated, 'property');
  setMetaTag('twitter:description', truncated, 'name');
};

/**
 * Set Open Graph (og:) and Twitter card meta tags for rich social sharing
 */
export const setOpenGraph = (options: {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}): void => {
  setMetaTag('og:title', options.title, 'property');
  setMetaTag('og:type', options.type || 'website', 'property');
  setMetaTag('og:site_name', 'BR Publications', 'property');
  setMetaTag('twitter:title', options.title, 'name');
  setMetaTag('twitter:card', 'summary_large_image', 'name');

  if (options.description) {
    setMetaTag('og:description', options.description, 'property');
    setMetaTag('twitter:description', options.description, 'name');
  }
  if (options.image) {
    setMetaTag('og:image', options.image, 'property');
    setMetaTag('twitter:image', options.image, 'name');
  }
  if (options.url) {
    setMetaTag('og:url', options.url, 'property');
  }
};

/**
 * Set canonical URL - tells Google the "official" URL for the page
 */
export const setCanonicalUrl = (path: string): void => {
  const url = path.startsWith('http') ? path : `${window.location.origin}${path}`;
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
};

/**
 * Inject JSON-LD Structured Data (schema.org)
 * This enables Google rich results — like book info in search snippets.
 */
export const setJsonLd = (data: object, id = 'structured-data'): void => {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
};

/**
 * Reset page to default SEO state (call on unmount if needed)
 */
export const resetSeo = (): void => {
  document.title = 'BR Publications | Academic Books & Research';
  setMetaTag('description', 'BR Publications is an academic publisher offering peer-reviewed books, book chapters, and research publications across engineering, science, and management.');
};
