# Text Book Publishing Form - Usage Guide

## Overview

The Text Book Publishing Form is a comprehensive modal form that allows administrators to publish approved text book submissions. It includes:

- **Prefilled data** from the submission (title, authors, ISBN, DOI)
- **Image upload & cropping** with fixed aspect ratio for book covers
- **Metadata collection** (indexed databases, keywords, description, category)
- **Pricing inputs** for Soft Copy, Hard Copy, and Bundle options
- **Form validation** to ensure all required fields are filled

## File Structure

```
src/pages/textBookSubmission/
├── publishing/
│   ├── TextBookPublishingForm.tsx    # Main form component
│   ├── ImageCropper.tsx               # Image cropping modal
│   ├── textBookPublishingForm.css    # Form styles
│   ├── imageCropper.css              # Cropper styles
│   └── index.ts                       # Exports
└── types/
    ├── textBookTypes.ts               # Submission types
    └── publishingTypes.ts             # Publishing-specific types
```

## Installation

The form requires the `react-easy-crop` package:

```bash
npm install react-easy-crop
```

## Usage

### 1. Import the Component

```tsx
import { TextBookPublishingForm } from '@/pages/textBookSubmission/publishing';
import type { PublishingFormData } from '@/pages/textBookSubmission/types/publishingTypes';
```

### 2. Add to Admin Dashboard

```tsx
const [showPublishForm, setShowPublishForm] = useState(false);

const handlePublish = async (formData: PublishingFormData) => {
    try {
        // Create FormData for multipart upload
        const uploadData = new FormData();
        
        // Add text fields
        uploadData.append('bookTitle', formData.bookTitle);
        uploadData.append('isbn', formData.isbn);
        uploadData.append('doi', formData.doi);
        uploadData.append('pages', formData.pages.toString());
        uploadData.append('copyright', formData.copyright);
        uploadData.append('releaseDate', formData.releaseDate);
        uploadData.append('category', formData.category);
        uploadData.append('description', formData.description);
        uploadData.append('indexedIn', JSON.stringify(formData.indexedIn));
        uploadData.append('keywords', JSON.stringify(formData.keywords));
        uploadData.append('pricing', JSON.stringify(formData.pricing));
        
        // Add cropped cover image
        if (formData.croppedCoverImage) {
            uploadData.append('coverImage', formData.croppedCoverImage, 'cover.jpg');
        }
        
        // Send to backend
        await textBookService.publishBook(submission.id, uploadData);
        
        // Close form and refresh
        setShowPublishForm(false);
        // Refresh submission data
    } catch (error) {
        console.error('Failed to publish book:', error);
    }
};

// In your render:
{showPublishForm && (
    <TextBookPublishingForm
        submission={submission}
        onSubmit={handlePublish}
        onCancel={() => setShowPublishForm(false)}
    />
)}
```

### 3. Add Publish Button

Add a publish button in the admin detail view for submissions with `ISBN_ASSIGNED` status:

```tsx
{submission.status === TextBookStatus.ISBN_ASSIGNED && (
    <button onClick={() => setShowPublishForm(true)} className="btn-publish">
        Publish Book
    </button>
)}
```

## Form Fields

### Prefilled (Read-only)
- Book Title
- Main Author
- Co-Authors (if any)

### Prefilled (Editable)
- ISBN
- DOI

### Admin Input Required
- **Cover Image**: Upload and crop book cover
- **Pages**: Number of pages
- **Copyright**: Copyright year
- **Release Date**: Publication date
- **Category**: Book category/subject
- **Indexed In**: Select databases (Scopus, Google Scholar, DBLP, etc.)
- **Keywords**: Add relevant keywords
- **Description**: Book description/abstract
- **Pricing**:
  - Soft Copy Price (₹)
  - Hard Copy Price (₹)
  - Hard + Soft Copy Price (₹)

## Image Cropping

The image cropper:
- Uses a fixed aspect ratio of 1:1.4 (standard book cover proportions)
- Allows horizontal and vertical positioning
- Includes zoom controls (1x to 3x)
- Outputs a cropped JPEG image at 95% quality

## Validation

The form validates:
- All required fields are filled
- Pages > 0
- All prices > 0
- At least one indexed database selected
- At least one keyword added
- Cover image uploaded and cropped

## Backend API

You'll need to create a backend endpoint to handle the publishing:

```typescript
// Example backend endpoint
POST /api/textbooks/:id/publish

// Request: multipart/form-data
// - bookTitle, isbn, doi, pages, copyright, releaseDate, category, description
// - indexedIn (JSON string array)
// - keywords (JSON string array)
// - pricing (JSON object)
// - coverImage (File)

// Response:
{
    success: true,
    message: "Book published successfully",
    book: { ... }
}
```

## Styling

The form uses a blue and white color scheme matching the existing design:
- Primary blue: `#1e5292`
- Dark blue: `#164175`
- Responsive design with mobile breakpoints
- Smooth transitions and hover effects

## Notes

- The form is a modal that overlays the current page
- All form state is managed internally
- The cropped image is returned as a Blob for upload
- Form data is validated before submission
- The form can be cancelled at any time
