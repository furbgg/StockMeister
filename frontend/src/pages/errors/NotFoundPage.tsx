import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

/**
 * 🔍 404 - Page Not Found
 * Shown when user navigates to a non-existent route
 */
const NotFoundPage = () => {
    return (
        <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-6">
            {/* Error Illustration */}
            <div className="max-w-md w-full flex flex-col items-center">
                <img
                    src="/Error404.png"
                    alt="404 Error"
                    className="w-full max-w-sm h-auto mb-8"
                />

                {/* Error Text */}
                <h1 className="text-2xl font-bold text-[#4a2c4a] mb-3 text-center">
                    Oops, something went wrong
                </h1>
                <p className="text-gray-500 text-center mb-6 leading-relaxed">
                    Error 404 Page not found. Sorry the page you looking for
                    doesn't exist or has been moved
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

export default NotFoundPage;
