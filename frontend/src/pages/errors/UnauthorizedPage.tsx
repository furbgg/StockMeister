import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

/**
 * 🔒 403 - Unauthorized Access
 * Shown when user doesn't have permission to access a page
 */
const UnauthorizedPage = () => {
    return (
        <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-6">
            {/* Error Illustration */}
            <div className="max-w-md w-full flex flex-col items-center">
                <img
                    src="/TopSecretRecipe.png"
                    alt="Access Denied"
                    className="w-full max-w-sm h-auto mb-8"
                />

                {/* Error Text */}
                <h1 className="text-2xl font-bold text-[#4a2c4a] mb-3 text-center">
                    Top Secret Recipe!
                </h1>
                <p className="text-gray-500 text-center mb-6 leading-relaxed">
                    Oops! It looks like you stumbled into the wrong kitchen.
                    Your role doesn't allow access to this area. Let's get you back to your station.
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

export default UnauthorizedPage;
