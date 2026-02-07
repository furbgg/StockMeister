import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

/**
 * 🔧 Maintenance Mode Page
 * Shown when the system is under maintenance
 */
const MaintenancePage = () => {
    return (
        <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-6">
            {/* Maintenance Illustration */}
            <div className="max-w-md w-full flex flex-col items-center">
                <img
                    src="/UnderMaintenance.png"
                    alt="Under Maintenance"
                    className="w-full max-w-md h-auto mb-8"
                />

                {/* Maintenance Text */}
                <h1 className="text-2xl font-bold text-[#4a2c4a] mb-3 text-center">
                    We are Under Maintenance
                </h1>
                <p className="text-gray-500 text-center mb-6 leading-relaxed">
                    Sorry for any inconvenience caused, we have almost done.
                    Will get back soon!
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

export default MaintenancePage;
