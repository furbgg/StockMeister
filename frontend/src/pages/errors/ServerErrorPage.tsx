import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

/**
 * 🔥 500 - Internal Server Error
 * Shown when server encounters an error
 */
const ServerErrorPage = () => {
    return (
        <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-6">
            {/* Error Illustration */}
            <div className="max-w-md w-full flex flex-col items-center">
                <img
                    src="/InternalServerError.png"
                    alt="500 Server Error"
                    className="w-full max-w-sm h-auto mb-8"
                />

                {/* Error Text */}
                <h1 className="text-2xl font-bold text-[#4a2c4a] mb-3 text-center">
                    Oops, something went wrong
                </h1>
                <p className="text-gray-500 text-center mb-6 leading-relaxed">
                    Server Error 500. We apologise and are fixing the problem.
                    Please try again at a later stage
                </p>

                {/* Back Button */}
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#7c3176] hover:bg-[#60265b] text-white font-medium rounded-lg transition-colors shadow-md"
                >
                    <Home size={18} />
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default ServerErrorPage;
