import { Suspense } from 'react';
import AuthorDashboard from '@/pages-content/bookChapterSubmission/author/authorDashboard';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <AuthorDashboard />
    </Suspense>
  );
}
