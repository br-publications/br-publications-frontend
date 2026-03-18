import React from 'react';
import type { BookChapterSubmission } from '../../types/submissionTypes';
import IndividualPublishChapterWizard from './IndividualPublishChapterWizard';

interface IndividualPublishChapterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (submission?: BookChapterSubmission) => void;
}

/**
 * IndividualPublishChapterModal is a wrapper around the
 * IndividualPublishChapterWizard component for manual data entry.
 */
const IndividualPublishChapterModal: React.FC<IndividualPublishChapterModalProps> = (props) => {
    return <IndividualPublishChapterWizard {...props} />;
};

export default IndividualPublishChapterModal;
