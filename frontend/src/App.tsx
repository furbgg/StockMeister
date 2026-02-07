import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import IngredientsPage from '@/pages/IngredientsPage';
import RecipesPage from '@/pages/RecipesPage';
import SuccessPage from '@/pages/SuccessPage';
import LowStocksPage from './pages/LowStocksPage';
import StockCountPage from './pages/StockCountPage';
import WasteManagementPage from './pages/WasteManagementPage';
import StaffPage from './pages/StaffPage';
import SettingsPage from './pages/SettingsPage';
import POSPage from './pages/POSPage';
import OrdersPage from './pages/OrdersPage';

// Error Pages
import NotFoundPage from './pages/errors/NotFoundPage';
import ServerErrorPage from './pages/errors/ServerErrorPage';
import UnauthorizedPage from './pages/errors/UnauthorizedPage';
import MaintenancePage from './pages/errors/MaintenancePage';


// Protected Route - redirects to login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7C3176]"></div>
          <span className="text-sm text-gray-500 font-medium">Loading system...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};


interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const RoleProtectedRoute = ({ children, allowedRoles }: RoleProtectedRouteProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role;

  // ADMIN has access to everything
  if (userRole === 'ADMIN') {
    return <>{children}</>;
  }

  if (!allowedRoles.includes(userRole)) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};

const AppHomeRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // ADMIN -> Dashboard
  if (user.role === 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  // WAITER -> POS
  if (user.role === 'WAITER') {
    return <Navigate to="/pos" replace />;
  }

  return <Navigate to="/pos" replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/success" element={<SuccessPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Default redirect based on role */}
            <Route index element={<AppHomeRedirect />} />

            {/* Dashboard - ADMIN only */}
            <Route
              path="dashboard"
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN']}>
                  <DashboardPage />
                </RoleProtectedRoute>
              }
            />

            {/* Recipes - ADMIN, CHEF, WAITER */}
            <Route
              path="recipes"
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'CHEF', 'WAITER']}>
                  <RecipesPage />
                </RoleProtectedRoute>
              }
            />

            {/* Ingredients - ADMIN, CHEF, INVENTORY_MANAGER */}
            <Route
              path="ingredients"
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'CHEF', 'INVENTORY_MANAGER']}>
                  <IngredientsPage />
                </RoleProtectedRoute>
              }
            />

            {/* Low Stock - ADMIN, CHEF, INVENTORY_MANAGER */}
            <Route
              path="low-stock"
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'CHEF', 'INVENTORY_MANAGER']}>
                  <LowStocksPage />
                </RoleProtectedRoute>
              }
            />

            {/* Stock Count - ADMIN, INVENTORY_MANAGER */}
            <Route
              path="stock-count"
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'INVENTORY_MANAGER']}>
                  <StockCountPage />
                </RoleProtectedRoute>
              }
            />

            {/* Waste Management - ADMIN, CHEF, INVENTORY_MANAGER */}
            <Route
              path="waste"
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'CHEF', 'INVENTORY_MANAGER']}>
                  <WasteManagementPage />
                </RoleProtectedRoute>
              }
            />

            {/* Staff Management - ADMIN only */}
            <Route
              path="staff"
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN']}>
                  <StaffPage />
                </RoleProtectedRoute>
              }
            />

            {/* POS - ADMIN, WAITER */}
            <Route
              path="pos"
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'WAITER']}>
                  <POSPage />
                </RoleProtectedRoute>
              }
            />

            {/* Orders - ADMIN, WAITER, CHEF */}
            <Route
              path="orders"
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN', 'WAITER', 'CHEF']}>
                  <OrdersPage />
                </RoleProtectedRoute>
              }
            />

            {/* Settings - Everyone */}
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Error Pages - Public */}
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/server-error" element={<ServerErrorPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* 404 - Catch all unknown routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
