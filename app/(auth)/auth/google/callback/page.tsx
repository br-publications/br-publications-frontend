import { Suspense } from 'react';
import Component from '@/pages-content/auth/GoogleCallbackHandler';
export default function Page() { 
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component />
    </Suspense>
  ); 
}
