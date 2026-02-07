import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  className?: string;
}

export const MainLayout = ({ className }: MainLayoutProps) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  useEffect(() => {
    // Only proceed after loading finishes
    if (!loading && !isAuthenticated) {
      // Session cleanup matched with AuthContext logout
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Show verifying access message while loading
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7c3176] border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show content only if authenticated
  return (
    <div className={cn('flex h-screen w-full overflow-hidden bg-background', className)}>
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar isOpen={isSidebarOpen} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;