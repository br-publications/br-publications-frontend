import { Suspense } from 'react';
import BookChapterSubmissions from '@/pages-content/bookChapterSubmission/bookChapterSubmissions';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <BookChapterSubmissions />
    </Suspense>
  );
}
