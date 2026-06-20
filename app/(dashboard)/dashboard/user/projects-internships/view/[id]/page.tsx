import { Suspense } from 'react';
import ProjectDetailView from '@/pages-content/projectsInternshipSubmission/ProjectDetailView';
export default function Page() {
  return (
    <Suspense fallback={<div className="suspense-loading">Loading...</div>}>
      <ProjectDetailView />
    </Suspense>
  );
}
