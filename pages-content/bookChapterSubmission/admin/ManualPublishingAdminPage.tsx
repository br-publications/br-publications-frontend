'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import IndividualPublishChapterModal from '../../../components/submissions/IndividualPublishChapterModal';

const ManualPublishingAdminPage: React.FC = () => {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(true);

    const handleClose = () => {
        setIsModalOpen(false);
        // Navigate back to the book management page
        router.push('/dashboard/admin/book-chapters');
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        router.push('/dashboard/admin/book-chapters');
    };

    return (
        <div className="manual-publishing-page-wrapper">
            {/* 
                This page serves as a route-based entry point for the manual publishing wizard.
                It automatically opens the modal when navigated to.
            */}
            <IndividualPublishChapterModal
                isOpen={isModalOpen}
                onClose={handleClose}
                onSuccess={handleSuccess}
            />

            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', margin: '0 0 8px 0', color: '#1f2937' }}>Manual Publishing Wizard</h3>
                <p style={{ fontSize: '14px', margin: '0', color: '#6b7280' }}>Redirecting to Book Management if the wizard is closed...</p>
                <button
                    className="btn btn-navy"
                    onClick={() => setIsModalOpen(true)}
                    style={{ marginTop: '1rem', fontSize: '13px', padding: '8px 16px' }}
                >
                    Re-open Wizard
                </button>
            </div>
        </div>
    );
};

export default ManualPublishingAdminPage;
