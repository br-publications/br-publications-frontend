import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { userService } from '../../../../services/user.service';
import toast from 'react-hot-toast';

interface EmailReviewerModalProps {
    reviewer: any;
    isOpen: boolean;
    onClose: () => void;
}

const EmailReviewerModal: React.FC<EmailReviewerModalProps> = ({ reviewer, isOpen, onClose }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            toast.error('Subject and message are required');
            return;
        }

        setSending(true);
        try {
            const response = await userService.emailReviewer(reviewer.id, subject, message);
            if (response.success) {
                toast.success('Email sent successfully');
                onClose();
                setSubject('');
                setMessage('');
            } else {
                toast.error(response.message || 'Failed to send email');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            toast.error('Failed to send email');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">Email Reviewer: {reviewer.fullName}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Enter email subject"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors h-32 resize-none"
                            placeholder="Type your message here..."
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-2 gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-xs font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={sending}
                            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                        >
                            {sending ? (
                                <>
                                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="h-3.5 w-3.5" />
                                    Send Email
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmailReviewerModal;
