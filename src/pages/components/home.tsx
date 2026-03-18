import { useEffect, lazy, Suspense } from 'react';

// ─── Critical path (render immediately — these make up the LCP) ───────────────
import HeroBanner from "../HomePageComponents/heroBanner";
import WelcomeBanner from "../HomePageComponents/welcomeBanner";

// ─── Below-the-fold (load after initial paint) ────────────────────────────────
const PubBanner = lazy(() => import("../HomePageComponents/pubBanner"));
const Subjects = lazy(() => import("../HomePageComponents/subjects"));
const TextBookCarousel = lazy(() => import("../HomePageComponents/textBookCarousel"));
const BookCarousel = lazy(() => import("../HomePageComponents/bookCarousel"));

import { setPageTitle, setMetaDescription } from '../../utils/seoUtils';

export default function Home() {
  useEffect(() => {
    setPageTitle('BR Publications | Academic Books & Research');
    setMetaDescription('Explore peer-reviewed academic books, book chapters, and research publications across engineering, science, management, and more. Published by BR Publications.');
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
