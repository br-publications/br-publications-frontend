import { useEffect, lazy, Suspense } from 'react';

// ─── Critical path (render immediately — these make up the LCP) ───────────────
import HeroBanner from "../HomePageComponents/heroBanner";
import WelcomeBanner from "../HomePageComponents/welcomeBanner";

// ─── Below-the-fold (load after initial paint) ────────────────────────────────
const PubBanner = lazy(() => import("../HomePageComponents/pubBanner"));
const Subjects = lazy(() => import("../HomePageComponents/subjects"));
const TextBookCarousel = lazy(() => import("../HomePageComponents/textBookCarousel"));
const BookCarousel = lazy(() => import("../HomePageComponents/bookCarousel"));

import { setPageTitle, setMetaDescription, setJsonLd } from '../../utils/seoUtils';

export default function Home() {
  useEffect(() => {
    setPageTitle('BR Publications | Academic Books & Research');
    setMetaDescription('Explore peer-reviewed academic books, book chapters, and research publications across engineering, science, management, and more. Published by BR Publications.');

    // Organization Schema — tells Google "BR Publications" is a real organization
    // This enables the Knowledge Panel when someone searches "BR Publications"
    setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'BR Publications',
      'url': 'https://www.brpublications.com',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://www.brpublications.com/src/assets/BR_logo.png'
      },
      'description': 'BR Publications is an academic publisher offering peer-reviewed books, book chapters, and research publications across engineering, science, and management.',
      'sameAs': [],
      'contactPoint': {
        '@type': 'ContactPoint',
        'contactType': 'customer service',
        'availableLanguage': 'English'
      }
    }, 'org-structured-data');

    // WebSite Schema — can trigger a Google Sitelinks Searchbox directly in search results
    setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'BR Publications',
      'url': 'https://www.brpublications.com',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': 'https://www.brpublications.com/books?search={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }
    }, 'website-structured-data');
  }, []);

  return (
    <>
      {/* Critical above-the-fold content — loads immediately */}
      <HeroBanner />
      <WelcomeBanner />

      {/* Non-critical below-the-fold content — loads after initial paint */}
      <Suspense fallback={null}>
        <PubBanner />
        <Subjects />
        <TextBookCarousel />
        <BookCarousel />
      </Suspense>
    </>
  );
}
