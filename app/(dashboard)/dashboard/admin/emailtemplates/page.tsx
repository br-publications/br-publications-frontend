import { Suspense } from 'react';
import CommunicationTemplatesPage from '@/pages-content/dashboard/admin/CommunicationTemplatesPage';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <CommunicationTemplatesPage />
    </Suspense>
  );
}
