import { Suspense } from 'react';
import PublishedChapterManager from '@/pages-content/bookChapterSubmission/bookChapterManager/PublishedChapterManager';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <PublishedChapterManager />
    </Suspense>
  );
}
