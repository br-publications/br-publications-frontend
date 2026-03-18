import React, { useEffect } from 'react';
import { X, Download, AlertCircle, FileText } from 'lucide-react';
import styles from './filePreviewModal.module.css';

interface FilePreviewModalProps {
    url: string;
    fileType: string;
    fileName: string;
    onClose: () => void;
    onDownload: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
    url,
    fileType,
    fileName,
    onClose,
    onDownload,
}) => {
    // Prevent scrolling on body when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const isPdf = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="preview-title"
            >
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <FileText size={16} className={styles.headerIcon} />
                        <h2 id="preview-title" className={styles.title}>{fileName}</h2>
                    </div>
                    <div className={styles.actions}>
                        <button
                            className={styles.downloadButton}
                            onClick={onDownload}
                            title="Download File"
                        >
                            <Download size={14} />
                            <span className={styles.buttonText}>Download</span>
                        </button>
                        <button
                            className={styles.closeButton}
                            onClick={onClose}
                            title="Close Preview"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className={styles.content}>
                    {isPdf ? (
                        <iframe
                            src={`${url}#toolbar=0`}
                            title={fileName}
                            className={styles.previewFrame}
                        />
                    ) : (
                        <div className={styles.noPreview}>
                            <AlertCircle size={32} className={styles.icon} />
                            <h3>Preview not available for this file type</h3>
                            <p>Please download the file to view its contents.</p>
                            <button className={styles.primaryDownloadBtn} onClick={onDownload}>
                                <Download size={14} /> Download {fileName}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;
