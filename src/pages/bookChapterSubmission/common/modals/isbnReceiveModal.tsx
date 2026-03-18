import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Hash, Link, FileText } from 'lucide-react';
import styles from './isbnReceiveModal.module.css';

interface IsbnReceiveModalProps {
    onClose: () => void;
    onSubmit: (isbnNumber: string, doiNumber: string, comments: string) => void;
    loading: boolean;
}

const IsbnReceiveModal: React.FC<IsbnReceiveModalProps> = ({ onClose, onSubmit, loading }) => {
    const [isbnNumber, setIsbnNumber] = useState('');
    const [doiNumber, setDoiNumber] = useState('');
    const [comments, setComments] = useState('');

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Start Publication — Enter ISBN &amp; DOI</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className={styles.body}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            ISBN Number <span className={styles.required}>*</span>
                        </label>
                        <div className={styles.inputWrapper}>
                            <Hash className={styles.icon} size={14} />
                            <input
                                type="text"
                                placeholder="Enter ISBN number (e.g. 978-3-16-148410-0)"
                                value={isbnNumber}
                                onChange={e => setIsbnNumber(e.target.value)}
                                className={styles.input}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>DOI Number (Optional)</label>
                        <div className={styles.inputWrapper}>
                            <Link className={styles.icon} size={14} />
                            <input
                                type="text"
                                placeholder="Enter DOI number (e.g. 10.1000/182)"
                                value={doiNumber}
                                onChange={e => setDoiNumber(e.target.value)}
                                className={styles.input}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Comments (Optional)</label>
                        <div className={styles.inputWrapper} style={{ alignItems: 'flex-start' }}>
                            <FileText className={styles.icon} size={14} style={{ marginTop: '10px' }} />
                            <textarea
                                placeholder="Add any additional notes here..."
                                value={comments}
                                onChange={e => setComments(e.target.value)}
                                rows={3}
                                className={styles.textarea}
                                style={{ paddingLeft: '36px' }}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button onClick={onClose} disabled={loading} className={styles.cancelBtn}>
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(isbnNumber, doiNumber, comments)}
                        disabled={!isbnNumber.trim() || loading}
                        className={styles.submitBtn}
                    >
                        {loading ? 'Saving...' : 'Start Publication'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default IsbnReceiveModal;
