import { Suspense } from 'react';
import TextBookBulkUpload from '@/pages-content/textBookSubmission/bulkUpload/TextBookBulkUpload';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <TextBookBulkUpload />
    </Suspense>
  );
}
