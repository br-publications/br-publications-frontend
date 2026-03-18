import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import '../textBookBulkUpload.css';

interface CoverImageDropzoneProps {
    onImagesSelected: (files: File[]) => void;
    selectedImages: File[];
}

const CoverImageDropzone: React.FC<CoverImageDropzoneProps> = ({ onImagesSelected, selectedImages }) => {
    const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());

    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Combine with existing images
        const allImages = [...selectedImages, ...acceptedFiles];
        onImagesSelected(allImages);

        // Generate preview URLs for new images
        const newPreviews = new Map(previewUrls);
        acceptedFiles.forEach(file => {
            if (!newPreviews.has(file.name)) {
                newPreviews.set(file.name, URL.createObjectURL(file));
            }
        });
        setPreviewUrls(newPreviews);
    }, [selectedImages, onImagesSelected, previewUrls]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        },
        multiple: true
    });

    const removeImage = (fileName: string) => {
        const updatedImages = selectedImages.filter(img => img.name !== fileName);
        onImagesSelected(updatedImages);

        // Revoke and remove preview URL
        const url = previewUrls.get(fileName);
        if (url) {
            URL.revokeObjectURL(url);
            const newPreviews = new Map(previewUrls);
            newPreviews.delete(fileName);
            setPreviewUrls(newPreviews);
        }
    };

    const clearAll = () => {
        // Revoke all preview URLs
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        setPreviewUrls(new Map());
        onImagesSelected([]);
    };

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    return (
        <div className="textBookBulk-dropzone-container">
            <div
                {...getRootProps()}
                className={`textBookBulk-dropzone ${isDragActive ? 'textBookBulk-dropzone-active' : ''}`}
            >
                <input {...getInputProps()} />
                <div className="textBookBulk-dropzone-content">
                    <svg
                        className="textBookBulk-dropzone-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                    {isDragActive ? (
                        <p className="textBookBulk-dropzone-text">Drop the images here...</p>
                    ) : (
                        <>
                            <p className="textBookBulk-dropzone-text">
                                Drag & drop cover images here, or click to select
                            </p>
                            <p className="textBookBulk-dropzone-subtext">
                                Supports 100+ images • JPEG, PNG, GIF, WebP
                            </p>
                        </>
                    )}
                </div>
            </div>

            {selectedImages.length > 0 && (
                <div className="textBookBulk-images-section">
                    <div className="textBookBulk-images-header">
                        <h4>{selectedImages.length} Image{selectedImages.length !== 1 ? 's' : ''} Selected</h4>
                        <button
                            type="button"
                            onClick={clearAll}
                            className="textBookBulk-clear-button"
                        >
                            Clear All
                        </button>
                    </div>

                    <div className="textBookBulk-images-grid">
                        {selectedImages.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="textBookBulk-image-card">
                                <div className="textBookBulk-image-preview">
                                    {previewUrls.get(file.name) ? (
                                        <img
                                            src={previewUrls.get(file.name)}
                                            alt={file.name}
                                            className="textBookBulk-image-thumbnail"
                                        />
                                    ) : (
                                        <div className="textBookBulk-image-placeholder">
                                            <svg
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="textBookBulk-image-info">
                                    <p className="textBookBulk-image-name" title={file.name}>
                                        {file.name}
                                    </p>
                                    <p className="textBookBulk-image-size">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeImage(file.name)}
                                    className="textBookBulk-remove-image-button"
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

export default CoverImageDropzone;
