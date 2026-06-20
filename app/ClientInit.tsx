'use client';
import { useEffect } from 'react';
import { initAuthInterceptor } from '../utils/authInterceptor';

export default function ClientInit() {
  useEffect(() => {
    // Security: clear any orphaned localStorage auth tokens
    if (localStorage.getItem('user')) localStorage.removeItem('user');
    if (localStorage.getItem('authToken')) localStorage.removeItem('authToken');
    // Initialize auth interceptor
    initAuthInterceptor();
  }, []);
  return null;
}
