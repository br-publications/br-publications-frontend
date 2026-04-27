import { useEffect } from 'react'
import './App.css'
import AppRoutes from './routes/appRoutes'


import { Helmet } from 'react-helmet-async'

function App() {
  
  useEffect(() => {
    // Phase 3 Hardening: Security sweep for orphaned localStorage objects preventing token theft
    if (localStorage.getItem('user')) localStorage.removeItem('user');
    if (localStorage.getItem('authToken')) localStorage.removeItem('authToken');
  }, []);

  return (
    <>
      <Helmet>
        <title>BR Publications | Academic Books & Research</title>
        <meta name="description" content="BR Publications is dedicated to publishing a diverse range of high-quality academic and professional works across multidisciplinary domains including Sciences, Engineering, and Humanities." />
        <meta name="keywords" content="academic books, book chapters, research publications, BR Publications, academic publisher" />
        <meta property="og:title" content="BR Publications | Academic Books & Research" />
        <meta property="og:description" content="Explore peer-reviewed academic books and research chapters published by BR Publications." />
        <meta property="og:site_name" content="BR Publications" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <AppRoutes />
    </>
  )
}

export default App
