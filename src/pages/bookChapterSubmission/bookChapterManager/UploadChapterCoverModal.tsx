import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Image as ImageIcon, ZoomIn } from 'lucide-react';
import Cropper, { type Point, type Area } from 'react-easy-crop';
import AlertPopup from '../../../components/common/alertPopup';
import type { PublishedBookChapter } from '../../../services/bookChapterPublishing.service';

interface UploadChapterCoverModalProps {
    book: PublishedBookChapter | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: number, file: File) => Promise<void>;
}

const UploadChapterCoverModal: React.FC<UploadChapterCoverModalProps> = ({ book, isOpen, onClose, onSave }) => {
    const chapterIdToInt = (id: string | number): number => {
        return typeof id === 'string' ? parseInt(id, 10) : id;
    };

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Cropper State
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const COVER_ASPECT_RATIO = 1.12 / 1.4;

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: 'info',
        title: '',
        message: ''
    });

    // Reset state when modal is opened/closed
    useEffect(() => {
        if (!isOpen) {
            setSelectedFile(null);
            setPreviewUrl(null);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const getCroppedImg = async (): Promise<File | null> => {
        if (!croppedAreaPixels || !previewUrl || !selectedFile) return null;

        const image = new Image();
        image.src = previewUrl;

        return new Promise((resolve) => {
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(null); return; }

                canvas.width = croppedAreaPixels.width;
                canvas.height = croppedAreaPixels.height;

                ctx.drawImage(
                    image,
                    croppedAreaPixels.x, croppedAreaPixels.y,
                    croppedAreaPixels.width, croppedAreaPixels.height,
                    0, 0, croppedAreaPixels.width, croppedAreaPixels.height
                );

                canvas.toBlob((blob) => {
                    if (!blob) { resolve(null); return; }
                    const croppedFile = new File([blob], selectedFile.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    resolve(croppedFile);
                }, 'image/jpeg', 0.95);
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !book) return;

        setLoading(true);
        try {
            const croppedFile = await getCroppedImg();
            if (!croppedFile) throw new Error('Could not process image');

            await onSave(chapterIdToInt(book.id), croppedFile);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4 text-[12px]">
            {/* Backdrop — clicking it closes the modal */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
            />

            {/* Modal card — z-[1001] ensures it sits above the backdrop */}
            <div className="relative bg-white rounded-lg w-full max-w-md z-[1001]">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-[14px] font-semibold">Update Chapter Cover Image</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-3">

                    {previewUrl ? (
                        // ── Cropper view ──────────────────────────────────────────
                        // `isolate` creates a new stacking context that traps
                        // react-easy-crop's internal z-index layers inside this div,
                        // preventing them from bleeding over the header / footer.
                        <div className="relative h-[300px] rounded-lg overflow-hidden bg-gray-900 isolate">
                            <Cropper
                                image={previewUrl}
                                crop={crop}
                                zoom={zoom}
                                aspect={COVER_ASPECT_RATIO}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                                onMediaLoaded={(mediaSize) => {
                                    // Position the crop window on the right half (front cover of a spread image)
                                    const imageAspect = mediaSize.width / mediaSize.height;
                                    const renderedWidthPercent = (imageAspect / COVER_ASPECT_RATIO) * 100;
                                    const offsetX = -(renderedWidthPercent - 100) / 2;
                                    setCrop({ x: offsetX, y: 0 });
                                }}
                            />

                            {/* Zoom controls rendered after Cropper so they stack on top naturally */}
                            <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg flex items-center gap-3 z-10">
                                <ZoomIn size={18} className="text-gray-500 shrink-0" />
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-label="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                    className="p-1 px-2 text-[10px] bg-red-100 text-red-600 rounded hover:bg-red-200 font-bold shrink-0"
                                >
                                    Change
                                </button>
                            </div>
                        </div>
                    ) : (
                        // ── Upload prompt ─────────────────────────────────────────
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-6">
                            <div className="text-center">
                                <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                                <div className="mt-2 text-[12px] text-gray-600">
                                    <label
                                        htmlFor="chapter-cover-upload"
                                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                    >
                                        <span>Upload a file</span>
                                        <input
                                            id="chapter-cover-upload"
                                            name="chapter-cover-upload"
                                            type="file"
                                            className="sr-only"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                    <p className="pl-1 text-[12px]">or drag and drop</p>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                    )}

                    {/* Footer buttons */}
                    <div className="flex justify-end gap-2 pt-3 border-t mt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-[12px]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedFile || loading}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 text-[12px]"
                        >
                            <Upload size={14} />
                            {loading ? 'Uploading...' : 'Update'}
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
        </div>
    );

    // Portal renders into document.body — completely outside any scaled app wrapper,
    // so CSS zoom/transform on the app shell does not affect this modal.
    return createPortal(modalContent, document.body);
};

export default UploadChapterCoverModal;