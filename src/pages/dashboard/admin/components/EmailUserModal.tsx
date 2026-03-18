import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { userService, type User } from '../../../../services/user.service';
import toast from 'react-hot-toast';
import { RichEditor } from '../../../../components/common/RichEditor';

interface EmailUserModalProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
}

const EmailUserModal: React.FC<EmailUserModalProps> = ({ user, isOpen, onClose }) => {
    const [subject, setSubject] = useState('');
    const [messageHtml, setMessageHtml] = useState('<p><br></p>');
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Strip HTML tags for empty check
        const strippedMessage = messageHtml.replace(/<[^>]*>?/gm, '').trim();

        if (!subject.trim() || !strippedMessage) {
            toast.error('Subject and message are required');
            return;
        }

        setSending(true);
        try {
            // Using emailReviewer as it hits the generic /users/:id/email endpoint
            // In a real generic implementation, we might want to alias this method in userService
            const response = await userService.emailReviewer(user.id, subject, messageHtml);

            if (response.success) {
                toast.success(`Email sent to ${user.fullName}`);
                onClose();
                setSubject('');
                setMessageHtml('<p><br></p>');
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

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-[2050] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Email User</h2>
                        <p className="text-xs text-gray-500">To: {user.fullName} ({user.email})</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="Enter email subject"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                        <div className="max-h-[50vh] overflow-y-auto w-full">
                            <RichEditor
                                html={messageHtml}
                                onChange={setMessageHtml}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2 gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium text-xs"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={sending}
                            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-xs"
                        >
                            {sending ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
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

export default EmailUserModal;
