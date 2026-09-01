'use client';
import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', margin: '0 0 1rem', color: '#1e5292' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', margin: '0 0 1.5rem', color: '#333' }}>Page Not Found</h2>
      <p style={{ margin: '0 0 2rem', color: '#666', maxWidth: '500px' }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link href="/" style={{
        backgroundColor: '#1e5292',
        color: 'white',
        padding: '0.75rem 1.5rem',
        borderRadius: '4px',
        textDecoration: 'none',
        fontWeight: 'bold',
        transition: 'background-color 0.2s'
      }}>
        Return Home
      </Link>
    </div>
  );
}
