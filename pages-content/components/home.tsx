'use client';
import { lazy, Suspense } from 'react';

// ─── Critical path (render immediately — these make up the LCP) ───────────────
import HeroBanner from "../HomePageComponents/heroBanner";
import WelcomeBanner from "../HomePageComponents/welcomeBanner";

// ─── Below-the-fold (load after initial paint) ────────────────────────────────
const PubBanner = lazy(() => import("../HomePageComponents/pubBanner"));
const Subjects = lazy(() => import("../HomePageComponents/subjects"));
const TextBookCarousel = lazy(() => import("../HomePageComponents/textBookCarousel"));
const BookCarousel = lazy(() => import("../HomePageComponents/bookCarousel"));

import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
export default function Home() {
  // For static pages like Home, dispatch prerender-ready immediately on mount
  useEffect(() => {
    setTimeout(() => document.dispatchEvent(new Event('prerender-ready')), 300);
  }, []);
  const orgSchema = {
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
  };

  const websiteSchema = {
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
  };

  return (
    <>
      <Helmet>
        <title>BR Publications | Academic Books &amp; Research</title>
        <meta name="description" content="BR Publications is dedicated to publishing a diverse range of high-quality academic and professional works across multidisciplinary domains including Sciences, Engineering, and Humanities." />
        <meta name="keywords" content="academic books, book chapters, research publications, BR Publications, academic publisher" />
        <meta property="og:title" content="BR Publications | Academic Books & Research" />
        <meta property="og:description" content="BR Publications is dedicated to publishing a diverse range of high-quality academic and professional works across multidisciplinary domains including Sciences, Engineering, and Humanities." />
        <meta property="og:site_name" content="BR Publications" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.brpublications.com/" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.brpublications.com/" />
        <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      </Helmet>
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
