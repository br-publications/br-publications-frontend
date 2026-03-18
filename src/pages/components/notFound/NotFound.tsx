import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 text-center">
            <div className="max-w-md w-full">
                <div className="mb-8 relative">
                    <h1 className="text-[120px] sm:text-[150px] font-black text-gray-100 leading-none select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl sm:text-4xl font-bold text-[#1e5292]">Page Not Found</span>
                    </div>
                </div>

                <p className="text-gray-600 mb-10 text-lg">
                    Oops! The page you are looking for doesn't exist or has been moved.
                    Please check the URL or return to the homepage.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1e5292] hover:bg-[#163e70] text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        <Home className="w-5 h-5" />
                        Go to Home
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-[#1e5292] hover:text-[#1e5292] text-gray-600 px-8 py-3 rounded-lg font-semibold transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
