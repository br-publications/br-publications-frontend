import { Suspense } from 'react';
import AuthorSubmissionDetailsPage from '@/pages-content/bookChapterSubmission/author/authorSubmissionDetailsPage';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <AuthorSubmissionDetailsPage />
    </Suspense>
  );
}
