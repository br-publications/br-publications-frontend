import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TextBookPublishingForm from '../publishing/TextBookPublishingForm';
import { submitTextBook, publishTextBook } from '../../../services/textBookService';
import AlertPopup, { type AlertType } from '../../../components/common/alertPopup';
import type { PublishingFormData } from '../types/publishingTypes';
import type { SubmitTextBookRequest } from '../types/textBookTypes';

const AdminDirectPublishingPage: React.FC = () => {
    const navigate = useNavigate();
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

            // Construct SubmitTextBookRequest
            // Note: casting to any for Author fields as the API might expect slightly different structure than our form
            // ideally we should map strictly to the Author type
            const submissionData: SubmitTextBookRequest = {
                bookTitle: formData.bookTitle,
                mainAuthor: {
                    ...mainAuthor,
                    // Ensure required fields for creation are present
                    title: mainAuthor.title || 'Mr/Ms.',
                    firstName: mainAuthor.firstName,
                    lastName: mainAuthor.lastName,
                    email: mainAuthor.email,
                    phoneNumber: mainAuthor.phoneNumber || 'N/A',
                    instituteName: mainAuthor.institute,
                    designation: 'Author',
                    departmentName: 'N/A',
                    city: mainAuthor.city || 'N/A',
                    state: mainAuthor.state || 'N/A',
                    country: mainAuthor.country || 'N/A',
                    isCorrespondingAuthor: true
                } as any,
                coAuthors: coAuthors.length > 0 ? coAuthors.map((ca: any) => ({
                    ...ca,
                    title: ca.title || 'Mr/Ms.',
                    firstName: ca.firstName,
                    lastName: ca.lastName,
                    email: ca.email,
                    phoneNumber: ca.phoneNumber || 'N/A',
                    instituteName: ca.institute,
                    designation: 'Co-Author',
                    departmentName: 'N/A',
                    city: ca.city || 'N/A',
                    state: ca.state || 'N/A',
                    country: ca.country || 'N/A',
                    isCorrespondingAuthor: false
                } as any)) : null,
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
                isbnNumber: formData.isbn,
                doiNumber: formData.doi,
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
                amazonLink: formData.amazonLink
            };


            await publishTextBook(submissionId, publicationDetails, coverImageFile);

            setAlertConfig({
                isOpen: true,
                type: 'success',
                title: 'Success',
                message: 'Textbook created and published successfully!'
            });

            setTimeout(() => {
                navigate('/dashboard/admin/textbooks?tab=completed');
            }, 2000);

        } catch (error: any) {
            console.error("Direct publishing failed:", error);
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
                onCancel={() => navigate('/dashboard/admin/textbooks')}
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
