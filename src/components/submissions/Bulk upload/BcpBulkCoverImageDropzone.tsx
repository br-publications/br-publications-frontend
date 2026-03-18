import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import './bookChapterBulkUpload.css';


interface BcpBulkCoverImageDropzoneProps {
    onImagesSelected: (files: File[]) => void;
    selectedImages: File[];
}

const BcpBulkCoverImageDropzone: React.FC<BcpBulkCoverImageDropzoneProps> = ({
    onImagesSelected,
    selectedImages,
}) => {
    const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const allImages = [...selectedImages, ...acceptedFiles];
            onImagesSelected(allImages);

            setPreviewUrls((prev) => {
                const next = new Map(prev);
                acceptedFiles.forEach((file) => {
                    if (!next.has(file.name)) {
                        next.set(file.name, URL.createObjectURL(file));
                    }
                });
                return next;
            });
        },
        [selectedImages, onImagesSelected]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        multiple: true,
    });

    const removeImage = (fileName: string) => {
        onImagesSelected(selectedImages.filter((img) => img.name !== fileName));
        setPreviewUrls((prev) => {
            const url = prev.get(fileName);
            if (url) URL.revokeObjectURL(url);
            const next = new Map(prev);
            next.delete(fileName);
            return next;
        });
    };

    const clearAll = () => {
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls(new Map());
        onImagesSelected([]);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                    {isDragActive ? (
                        <p className="bcp-bulk-dz-text">Drop images here…</p>
                    ) : (
                        <>
                            <p className="bcp-bulk-dz-text">
                                Drag &amp; drop cover images, or click to select
                            </p>
                            <p className="bcp-bulk-dz-sub">
                                Supports 100+ images · JPEG, PNG, WebP
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Grid of selected images */}
            {selectedImages.length > 0 && (
                <div>
                    <div className="bcp-bulk-img-grid-bar">
                        <span className="bcp-bulk-img-grid-label">
                            {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
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
                        {selectedImages.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="bcp-bulk-img-card">
                                <div className="bcp-bulk-img-preview">
                                    {previewUrls.get(file.name) ? (
                                        <img
                                            src={previewUrls.get(file.name)}
                                            alt={file.name}
                                            className="bcp-bulk-img-thumb"
                                        />
                                    ) : (
                                        <svg
                                            className="bcp-bulk-img-ph"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    )}
                                </div>
                                <div className="bcp-bulk-img-info">
                                    <p className="bcp-bulk-img-name" title={file.name}>
                                        {file.name}
                                    </p>
                                    <p className="bcp-bulk-img-size">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeImage(file.name)}
                                    className="bcp-bulk-img-remove"
                                    aria-label={`Remove ${file.name}`}
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

export default BcpBulkCoverImageDropzone;
