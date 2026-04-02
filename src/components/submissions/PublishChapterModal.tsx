import React from 'react';
import type { BookChapterSubmission } from '../../types/submissionTypes';
import PublishChapterWizard from './PublishChapterWizard';

interface PublishChapterModalProps {
    isOpen: boolean;
    onClose: () => void;
    submission: BookChapterSubmission;
    onSuccess: (submission?: BookChapterSubmission) => void;
    allSubmissions?: BookChapterSubmission[];
    allBookChapters?: { title: string; chapterNumber: string }[];
}

/**
 * PublishChapterModal is now a thin wrapper around the
 * 9-step PublishChapterWizard component.
 */
const PublishChapterModal: React.FC<PublishChapterModalProps> = (props) => {
    return <PublishChapterWizard {...props} />;
};

export default PublishChapterModal;