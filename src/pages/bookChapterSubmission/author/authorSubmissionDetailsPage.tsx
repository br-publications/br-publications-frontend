import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BookChapterService from '../../../services/bookChapterSumission.service'; // Check import path
import AuthorSubmissionDetailView from './authorSubmissionDetailView';
import type { BookChapterSubmission } from '../../../types/submissionTypes';

const AuthorSubmissionDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState<BookChapterSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubmission = async () => {
            if (!id) {
                console.error('No ID found in params');
                return;
            }
            try {
                const response = await BookChapterService.getSubmissionById(Number(id));
                if (response.success && response.data) {
                    setSubmission(response.data);
                } else {
                    console.error('Failed to load submission. Response:', response);
                    setError('Failed to load submission details.');
                }
            } catch (err) {
                console.error('Error fetching submission:', err);
                setError('An error occurred while fetching submission details.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubmission();
    }, [id]);

    const handleUpdate = (updated: BookChapterSubmission) => {
        setSubmission(updated);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !submission) {
        return (
            <div className="p-6 text-center text-red-600">
                {error || 'Submission not found'}
                <button onClick={() => navigate(-1)} className="block mx-auto mt-4 text-blue-600 underline">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <AuthorSubmissionDetailView
            submission={submission}
            onClose={() => navigate(-1)}
            onUpdate={handleUpdate}
        />
    );
};

export default AuthorSubmissionDetailsPage;
