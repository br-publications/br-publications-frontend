import { Suspense } from 'react';
import EditorDashboard from '@/pages-content/bookChapterSubmission/editor/editorDashboard';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <EditorDashboard />
    </Suspense>
  );
}
