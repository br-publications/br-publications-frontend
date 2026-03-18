import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import './bookChapterBulkUpload.css';

interface BcpBulkPdfDropzoneProps {
    onPdfsSelected: (files: File[]) => void;
    selectedPdfs: File[];
}

const BcpBulkPdfDropzone: React.FC<BcpBulkPdfDropzoneProps> = ({
    onPdfsSelected,
    selectedPdfs,
}) => {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const allPdfs = [...selectedPdfs, ...acceptedFiles];
            onPdfsSelected(allPdfs);
        },
        [selectedPdfs, onPdfsSelected]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: true,
    });

    const removePdf = (fileName: string) => {
        onPdfsSelected(selectedPdfs.filter((pdf) => pdf.name !== fileName));
    };

    const clearAll = () => {
        onPdfsSelected([]);
    };

    return (
        <div>
            {/* Drop zone */}
            <div
                {...getRootProps()}
                className={`bcp-bulk-dropzone ${isDragActive ? 'bcp-bulk-dropzone-dragging' : ''}`}
            >
                <input {...getInputProps()} />
                <div className="bcp-bulk-dropzone-inner">
                    <svg
                        className="bcp-bulk-dz-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    {isDragActive ? (
                        <p className="bcp-bulk-dz-text">Drop PDFs here…</p>
                    ) : (
                        <>
                            <p className="bcp-bulk-dz-text">
                                Drag &amp; drop PDF files, or click to select
                            </p>
                            <p className="bcp-bulk-dz-sub">
                                For Frontmatter, TOC, Index etc.
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Grid of selected PDFs */}
            {selectedPdfs.length > 0 && (
                <div>
                    <div className="bcp-bulk-img-grid-bar" style={{ marginTop: '16px' }}>
                        <span className="bcp-bulk-img-grid-label">
                            {selectedPdfs.length} PDF{selectedPdfs.length !== 1 ? 's' : ''} selected
                        </span>
                        <button
                            type="button"
                            onClick={clearAll}
                            className="bcp-bulk-clear-all-btn"
                        >
                            Clear All
                        </button>
                    </div>

                    <div className="bcp-bulk-images-grid">
                        {selectedPdfs.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="bcp-bulk-img-card" style={{ padding: '8px' }}>
                                <div className="bcp-bulk-img-preview" style={{ background: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg
                                        style={{ width: '32px', height: '32px', color: '#ef4444' }}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="bcp-bulk-img-info">
                                    <p className="bcp-bulk-img-name" title={file.name}>
                                        {file.name}
                                    </p>
                                    <p className="bcp-bulk-img-size">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removePdf(file.name)}
                                    className="bcp-bulk-img-remove"
                                    aria-label={`Remove ${file.name}`}
                                    style={{ right: '4px', top: '4px' }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BcpBulkPdfDropzone;
