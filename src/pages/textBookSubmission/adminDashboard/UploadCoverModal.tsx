import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import type { PublishedBook } from '../../../services/publishedBookService';
import AlertPopup from '../../../components/common/alertPopup';
import ImageCropper from '../publishing/ImageCropper';
import type { CropArea } from '../types/publishingTypes';

interface UploadCoverModalProps {
    book: PublishedBook;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: number, file: File) => Promise<void>;
}

const UploadCoverModal: React.FC<UploadCoverModalProps> = ({ book, isOpen, onClose, onSave }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Cropper State
    const [showCropper, setShowCropper] = useState(false);
    const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message: string;
        messageDetail?: string;
    }>({
        isOpen: false,
        type: 'info',
        title: '',
        message: ''
    });

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setTempImageUrl(url);
            setShowCropper(true);
        }
    };

    const handleCropComplete = (_croppedArea: CropArea, croppedImage: Blob) => {
        // Convert Blob to File
        const fileName = `cropped-cover-${book.id}-${Date.now()}.jpg`;
        const file = new File([croppedImage], fileName, { type: 'image/jpeg' });

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(croppedImage));
        setShowCropper(false);

        // Clean up temp image URL
        if (tempImageUrl) {
            URL.revokeObjectURL(tempImageUrl);
            setTempImageUrl(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        setLoading(true);
        try {
            await onSave(book.id, selectedFile);
            onClose();
        } catch (error) {
            console.error(error);
            setAlertConfig({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to update cover image'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-base font-semibold">Update Cover Image</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                        {previewUrl ? (
                            <div className="relative w-32 h-48 mb-4">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded shadow" />
                                <button
                                    type="button"
                                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-2 text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                        <span>Upload a file</span>
                                        <input
                                            id="file-upload"
                                            name="file-upload"
                                            type="file"
                                            className="sr-only"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t mt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedFile || loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Upload size={18} />
                            {loading ? 'Uploading...' : 'Update Cover'}
                        </button>
                    </div>
                </form>
            </div>

            <AlertPopup
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
            />

            {showCropper && tempImageUrl && (
                <ImageCropper
                    image={tempImageUrl}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setShowCropper(false);
                        if (tempImageUrl) {
                            URL.revokeObjectURL(tempImageUrl);
                            setTempImageUrl(null);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default UploadCoverModal;
