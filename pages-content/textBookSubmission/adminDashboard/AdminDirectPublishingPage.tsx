'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import TextBookPublishingForm from '../publishing/TextBookPublishingForm';
import { submitTextBook, publishTextBook } from '../../../services/textBookService';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';
import type { PublishingFormData } from '../types/publishingTypes';
import type { SubmitTextBookRequest } from '../types/textBookTypes';
import Link from 'next/link';

const AdminDirectPublishingPage: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: AlertType;
        title: string;
        message: string;
    }>({ isOpen: false, type: 'info', title: '', message: '' });

    const handlePublish = async (formData: PublishingFormData) => {
        setLoading(true);
        try {
            // Step 1: Submit the text book (create the record)
            const mainAuthor = typeof formData.mainAuthor !== 'string' ? formData.mainAuthor : {
                title: '', firstName: '', lastName: '', email: '', phoneNumber: '', institute: '', city: '', state: '', country: ''
            };

            const coAuthors = formData.coAuthors.map((ca: PublishingFormData['coAuthors'][number]) => {
                if (typeof ca !== 'string') return ca;
                return { title: '', firstName: '', lastName: '', email: '', phoneNumber: '', institute: '', city: '', state: '', country: '' };
            });

            const processedMainAuthor = {
                ...mainAuthor,
                title: mainAuthor.title || 'Mr/Ms.',
                firstName: mainAuthor.firstName,
                lastName: mainAuthor.lastName || '',
                email: mainAuthor.email || 'N/A',
                phoneNumber: mainAuthor.phoneNumber || 'N/A',
                instituteName: mainAuthor.institute || 'N/A',
                designation: 'Author',
                departmentName: 'N/A',
                city: mainAuthor.city || 'N/A',
                state: mainAuthor.state || 'N/A',
                country: mainAuthor.country || 'N/A',
                isCorrespondingAuthor: true
            };

            const processedCoAuthors = coAuthors.length > 0 ? coAuthors.map((ca: any) => ({
                ...ca,
                title: ca.title || 'Mr/Ms.',
                firstName: ca.firstName,
                lastName: ca.lastName || '',
                email: ca.email || 'N/A',
                phoneNumber: ca.phoneNumber || 'N/A',
                instituteName: ca.institute || 'N/A',
                designation: 'Co-Author',
                departmentName: 'N/A',
                city: ca.city || 'N/A',
                state: ca.state || 'N/A',
                country: ca.country || 'N/A',
                isCorrespondingAuthor: false
            })) : [];

            // Construct SubmitTextBookRequest
            const submissionData: SubmitTextBookRequest = {
                bookTitle: formData.bookTitle,
                mainAuthor: processedMainAuthor as any,
                coAuthors: processedCoAuthors.length > 0 ? processedCoAuthors as any : null,
                contentFile: formData.contentFile || undefined,
                fullTextFile: formData.fullTextFile || undefined,
                isDirectSubmission: true
            };


            const submissionResponse = await submitTextBook(submissionData);
            const submissionId = submissionResponse.submission?.id;

            if (!submissionId) {
                console.error("Submission response:", submissionResponse);
                throw new Error("Failed to retrieve submission ID from server response.");
            }



            // Step 2: Publish the textbook
            // We need to pass the file object for cover image if it exists
            const coverImageFile = formData.croppedCoverImage ? new File([formData.croppedCoverImage], "cover.png", { type: "image/png" }) : (formData.coverImage || undefined);

            const publicationDetails = {
                bookTitle: formData.bookTitle,
                author: `${processedMainAuthor.firstName} ${processedMainAuthor.lastName}`.trim(),
                mainAuthor: processedMainAuthor,
                coAuthors: processedCoAuthors,
                isbn: formData.isbn,
                isbnNumber: formData.isbn, // Pass both for compatibility
                doi: formData.doi,
                doiNumber: formData.doi,   // Pass both for compatibility
                pages: formData.pages,
                copyright: formData.copyright,
                releaseDate: formData.releaseDate,
                indexedIn: formData.indexedIn,
                keywords: formData.keywords,
                category: formData.category,
                description: formData.description,
                pricing: formData.pricing,
                googleLink: formData.googleLink,
                flipkartLink: formData.flipkartLink,
                amazonLink: formData.amazonLink,
                uid: formData.uid
            };


            await publishTextBook(submissionId, publicationDetails, coverImageFile);

            setAlertConfig({
                isOpen: true,
                type: 'success',
                title: 'Success',
                message: 'Textbook created and published successfully!'
            });

            setTimeout(() => {
                router.push('/dashboard/admin/textbooks?tab=completed');
            }, 2000);

        } catch (error: any) {
            console.error("Direct publishing failed full error details:", error);
            if (error.response) {
                console.error("Server error response data:", error.response.data || error.response);
            }
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to publish textbook.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '12px' }}>
            {/* We reuse the modal form but rendered directly or inside a wrapper. 
                Since TextBookPublishingForm is a portal, it will show as an overlay.
                We can just render it here.
            */}
            <TextBookPublishingForm
                mode="direct_admin"
                onSubmit={handlePublish}
                onCancel={() => router.push('/dashboard/admin/textbooks')}
                loading={loading}
            />

            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default AdminDirectPublishingPage;
