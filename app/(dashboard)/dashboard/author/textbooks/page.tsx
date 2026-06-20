import { Suspense } from 'react';
import AuthorTextBookDashboard from '@/pages-content/textBookSubmission/authorDashboard/authorTextBookDashboard';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <AuthorTextBookDashboard />
    </Suspense>
  );
}
