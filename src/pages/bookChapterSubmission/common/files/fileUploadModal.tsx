import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, File, FileText, Loader } from 'lucide-react';
import bookChapterService from '../../../../services/bookChapterSumission.service';
import type { BookChapterSubmission } from '../../../../types/submissionTypes';
import AlertPopup, { type AlertType } from '../../../../components/common/alertPopup';
import styles from './fileUploadModal.module.css';

interface FileUploadModalProps {
  submission: BookChapterSubmission;
  chapterInfo?: {  // Optional: for chapter-specific uploads
    chapterId: number;
    chapterNumber: number;
    chapterTitle: string;
  };
  isRevisionUpload?: boolean;
  onUploadSuccess: () => void;
  onClose?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  submission,
  chapterInfo,
  isRevisionUpload,
  onUploadSuccess,
  onClose,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, type: AlertType, title: string, message: string }>({
    isOpen: false,
    type: 'error',
    title: '',
    message: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
      setFileError(errorMsg);
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'File Too Large',
        message: errorMsg
      });
      return false;
    }

    // Check file type
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      const errorMsg = 'Only PDF, DOC, and DOCX files are allowed';
      setFileError(errorMsg);
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Invalid File Format',
        message: errorMsg
      });
      return false;
    }

    // Check MIME type
    if (!ALLOWED_MIMETYPES.includes(file.type)) {
      const errorMsg = 'Invalid file type';
      setFileError(errorMsg);
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Invalid File Type',
        message: errorMsg
      });
      return false;
    }

    setFileError('');
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);

      // Auto-generate chapter-based file name if chapterInfo provided
      if (chapterInfo) {
        const ext = file.name.split('.').pop();
        const sanitizedTitle = chapterInfo.chapterTitle.replace(/[^a-zA-Z0-9]/g, '_');
        const suggestedName = `Chapter_${chapterInfo.chapterNumber}_${sanitizedTitle}.${ext}`;
        setCustomFileName(suggestedName);
      } else {
        setCustomFileName(file.name); // Initialize with original name
      }
    } else {
      // Clear input so change event fires again if user selects same invalid file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate file upload with FormData
      const formData = new FormData();
      formData.append('manuscript', selectedFile);
      formData.append('submissionId', submission.id.toString());

      // Mock upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 30;
        });
      }, 500);

      // Call the upload API
      let response;
      if (chapterInfo) {
        response = await bookChapterService.uploadChapterManuscript(
          chapterInfo.chapterId,
          selectedFile,
          customFileName
        );
      } else if (isRevisionUpload) {
        response = await bookChapterService.submitRevision(
          submission.id,
          selectedFile,
          // Note: Add logic for responseNotes if we add a text field later
        );
      } else {
        response = await bookChapterService.uploadFullChapter(
          submission.id,
          selectedFile,
          undefined, // no notes in this modal version
          customFileName // Pass the custom name
        );
      }

      clearInterval(interval);
      setUploadProgress(100);
      setUploadStatus('success');

      // Show success message for 2 seconds, then close
      setTimeout(() => {
        onUploadSuccess();
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setFileError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setCustomFileName('');
    setFileError('');
    setUploadProgress(0);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return <FileText className={styles.pdfIcon} size={20} />;
    }
    return <File className={styles.docIcon} size={20} />;
  };

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.modal}>
          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.title}>
              {chapterInfo
                ? `Upload Manuscript for Chapter ${chapterInfo.chapterNumber}`
                : 'Upload Manuscript'
              }
            </h2>
            {onClose && (
              <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className={styles.body}>
            {uploadStatus === 'idle' ? (
              <>
                {!selectedFile ? (
                  // Drag Drop Area
                  <div
                    className={`${styles.dragDropArea} ${dragActive ? styles.dragActive : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className={styles.uploadIcon} size={32} />
                    <h3 className={styles.dragDropTitle}>
                      Drag and drop your file here
                    </h3>
                    <p className={styles.dragDropSubtitle}>
                      or
                    </p>
                    <button
                      className={styles.browseButton}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse Files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleInputChange}
                      accept=".pdf,.doc,.docx"
                      className={styles.hiddenInput} // Used class instead of inline style for better control
                      style={{ display: 'none' }}
                      aria-label="Select manuscript file"
                    />
                    <p className={styles.fileInfo}>
                      Supported formats: PDF, DOC, DOCX (Max {MAX_FILE_SIZE / (1024 * 1024)}MB)
                    </p>
                  </div>
                ) : (
                  <div className={styles.selectedFile}>
                    <div className={styles.filePreview}>
                      {getFileIcon(selectedFile!.name)}
                      <div className={styles.fileDetails}>
                        {/* Renaming Input */}
                        <div className={styles.fileNameInputContainer}>
                          <label className={styles.inputLabel}>File Name</label>
                          <input
                            type="text"
                            className={styles.fileNameInput}
                            value={customFileName}
                            onChange={(e) => setCustomFileName(e.target.value)}
                            placeholder={selectedFile!.name}
                          />
                          <p className={styles.fileSize}>
                            {(selectedFile!.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {fileError && (
                      <div className={styles.errorAlert}>
                        <AlertCircle size={16} />
                        <span>{fileError}</span>
                      </div>
                    )}

                    <button
                      className={styles.changeButton}
                      onClick={handleClear}
                      disabled={isUploading}
                    >
                      Choose Different File
                    </button>
                  </div>
                )}

                {/* File Size and Format Info */}
                <div className={styles.infoBox}>
                  <h4>File Requirements:</h4>
                  <ul>
                    <li>Format: PDF, DOC, or DOCX</li>
                    <li>Maximum size: {MAX_FILE_SIZE / (1024 * 1024)} MB</li>
                    <li>All pages should be clear and readable</li>
                    <li>Include references and citations</li>
                  </ul>
                </div>
              </>
            ) : uploadStatus === 'success' ? (
              // Success Message
              <div className={styles.successMessage}>
                <CheckCircle size={32} className={styles.successIcon} />
                <h3>Upload Successful!</h3>
                <p>Your manuscript has been uploaded successfully.</p>
                <p className={styles.successSubtitle}>
                  The editor will review it shortly.
                </p>
              </div>
            ) : uploadStatus === 'error' ? (
              // Error Message
              <div className={styles.errorMessage}>
                <AlertCircle size={32} className={styles.errorIcon} />
                <h3>Upload Failed</h3>
                <p>{fileError || 'An error occurred while uploading your file.'}</p>
                <button
                  className={styles.retryButton}
                  onClick={handleClear}
                >
                  Try Again
                </button>
              </div>
            ) : null}

            {/* Upload Progress */}
            {isUploading && (
              <div className={styles.progressContainer}>
                <div className={styles.progressInfo}>
                  <Loader className={styles.loaderIcon} size={16} />
                  <span>Uploading...</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className={styles.progressPercent}>{Math.round(uploadProgress)}%</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {uploadStatus === 'idle' && (
            <div className={styles.footer}>
              <button
                className={styles.cancelButton}
                onClick={onClose || handleClear}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                className={styles.uploadButton}
                onClick={handleUpload}
                disabled={!selectedFile || isUploading || !!fileError}
              >
                {isUploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          )}

          {uploadStatus !== 'idle' && (
            <div className={styles.footer}>
              <button
                className={styles.doneButton}
                onClick={onClose || handleClear}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      <AlertPopup
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};

export default FileUploadModal;