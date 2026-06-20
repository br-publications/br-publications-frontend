import { Suspense } from 'react';
import type { Metadata } from 'next';
import Component from '@/pages-content/ProjectsComponents/studentsInternshipProgram';

export const metadata: Metadata = {
    title: 'Internship Program',
};

export default function Page() { return <Suspense fallback={<div className="suspense-loading">Loading...</div>}><Component /></Suspense>; }
