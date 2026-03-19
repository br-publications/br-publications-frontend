// Image Cropper Component for Text Book Cover Images
import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import type { CropArea } from '../types/publishingTypes';
import './imageCropper.css';

interface ImageCropperProps {
    image: string;
    onCropComplete: (croppedArea: CropArea, croppedImage: Blob) => void;
    onCancel: () => void;
    initialAlignment?: 'right' | 'center';
}

const ImageCropper: React.FC<ImageCropperProps> = ({ image, onCropComplete, onCancel, initialAlignment = 'right' }) => {
    // Initialize crop position to the right side of the image
    // The cropper will calculate the exact position based on the image dimensions
    const [crop, setCrop] = useState<Point>({ x: 0, y: 150 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    // Fixed aspect ratio based on reference image (book cover proportions)
    const ASPECT_RATIO = 1.12 / 1.4; // width / height

    const onCropChange = (location: Point) => {
        setCrop(location);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteCallback = useCallback(
        (_croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const createCroppedImage = async (): Promise<Blob | null> => {
        if (!croppedAreaPixels) return null;

        const imageElement = new Image();
        imageElement.src = image;

        return new Promise((resolve) => {
            imageElement.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    resolve(null);
                    return;
                }

                canvas.width = croppedAreaPixels.width;
                canvas.height = croppedAreaPixels.height;

                ctx.drawImage(
                    imageElement,
                    croppedAreaPixels.x,
                    croppedAreaPixels.y,
                    croppedAreaPixels.width,
                    croppedAreaPixels.height,
                    0,
                    0,
                    croppedAreaPixels.width,
                    croppedAreaPixels.height
                );

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.95);
            };
        });
    };

    const handleSave = async () => {
        if (!croppedAreaPixels) return;

        const croppedImage = await createCroppedImage();
        if (croppedImage) {
            const cropArea: CropArea = {
                x: croppedAreaPixels.x,
                y: croppedAreaPixels.y,
                width: croppedAreaPixels.width,
                height: croppedAreaPixels.height,
            };
            onCropComplete(cropArea, croppedImage);
        }
    };

    return createPortal(
        <div className="image-cropper-modal">
            <div className="cropper-overlay" onClick={onCancel}></div>
            <div className="cropper-container">
                <div className="cropper-header">
                    <h3>Crop Book Cover Image</h3>
                    <button className="cropper-close-btn" onClick={onCancel}>
                        ×
                    </button>
                </div>

                <div className="cropper-body">
                    <div className="crop-area">
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            aspect={ASPECT_RATIO}
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onCropComplete={onCropCompleteCallback}
                            onMediaLoaded={(mediaSize) => {
                                // Automatically position crop to the far right (showing the right side of the image)
                                // Negative x moves the image to the left.
                                setCrop({ x: -mediaSize.width, y: 0 });
                            }}
                            restrictPosition={true}
                        />
                    </div>

                    <div className="cropper-controls">
                        <div className="zoom-control">
                            <label>Zoom</label>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="zoom-slider"
                            />
                        </div>

                        <div className="crop-info">
                            <p>Adjust the image position and zoom to crop the book cover.</p>
                            <p>The aspect ratio is fixed to match standard book cover dimensions.</p>
                        </div>
                    </div>
                </div>

                <div className="cropper-footer">
                    <button className="btn-cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn-save" onClick={handleSave}>
                        Save Cropped Image
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ImageCropper;
