import { Suspense } from 'react';
import UserRoleManagement from '@/pages-content/dashboard/admin/userRoleManagement';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <UserRoleManagement />
    </Suspense>
  );
}
