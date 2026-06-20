/**
 * Utility for automatic image cropping for book covers.
 * Matches the logic in ImageCropper.tsx
 */

const ASPECT_RATIO = 1.12 / 1.4; // width / height

/**
 * Automatically crops an image to the book cover aspect ratio, 
 * aligning to the right side of the image (matching manual UI default).
 */
export async function autoCropCoverImage(imageFile: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(imageFile);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            const { width: imgWidth, height: imgHeight } = img;

            // Calculate crop dimensions
            let cropWidth, cropHeight;
            let startX, startY;

            // We want to maintain ASPECT_RATIO (0.8)
            // If the image is wider than target aspect, we crop the sides (preferring the right side)
            // If the image is taller than target aspect, we crop the top/bottom (centering or top-aligning)

            const imgAspectRatio = imgWidth / imgHeight;

            if (imgAspectRatio > ASPECT_RATIO) {
                // Image is wider than needed - keep full height, crop width
                cropHeight = imgHeight;
                cropWidth = imgHeight * ASPECT_RATIO;
                startY = 0;
                // Align to the RIGHT (as per manual cropper auto-position)
                startX = imgWidth - cropWidth;
            } else {
                // Image is taller than needed - keep full width, crop height
                cropWidth = imgWidth;
                cropHeight = imgWidth / ASPECT_RATIO;
                startX = 0;
                // Center vertically or top align? Usually cover focuses on top/center.
                // Let's center it for better results on vertical images.
                startY = (imgHeight - cropHeight) / 2;
            }

            const canvas = document.createElement('canvas');
            canvas.width = cropWidth;
            canvas.height = cropHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            ctx.drawImage(
                img,
                startX, startY, cropWidth, cropHeight,
                0, 0, cropWidth, cropHeight
            );

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas toBlob failed'));
                    return;
                }
                const croppedFile = new File([blob], imageFile.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                });
                resolve(croppedFile);
            }, 'image/jpeg', 0.95);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image for cropping'));
        };

        img.src = objectUrl;
    });
}
