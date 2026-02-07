import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const SuccessPage = () => {
  const navigate = useNavigate();

  useEffect(() => {

    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">


      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-100 relative transition-colors duration-500">
        <div className="mx-auto flex w-full max-w-[450px] flex-col items-center justify-center gap-6 text-center relative">

          <div className="relative bg-slate-100/20 backdrop-blur-xl p-8 sm:p-12 rounded-[2rem] border border-purple-100/20 shadow-xl overflow-hidden w-full group transition-all duration-500 hover:shadow-purple-900/5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-purple-100/5 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center gap-6">


              <img
                src="/logo.png"
                alt="StockMeister Logo"
                className="h-12 w-auto mb-2 object-contain"
              />


              <div className="rounded-full bg-green-100 p-4 animate-in zoom-in duration-300">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-[#7c3176]">Success!</h1>
                <p className="text-muted-foreground">
                  Login successful. Redirecting to dashboard...
                </p>
              </div>


              <Button
                className="w-full bg-[#7c3176] hover:bg-[#60265b] text-white"
                onClick={() => navigate('/dashboard')}
              >
              </Button>
            </div>
          </div>

        </div>
      </div>


      <div className="hidden lg:block relative h-full min-h-screen overflow-hidden">
        <img
          src="/lockscreen.jpg"
          alt="Auth Visual"
          className="w-full h-full object-cover"
        />
      </div>

    </div>
  );
};

export default SuccessPage;