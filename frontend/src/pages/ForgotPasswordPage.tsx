import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);

      setTimeout(() => navigate('/login'), 3000);
    }, 1500);
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 relative">
      {/* Language Switcher - Absolute Top Left */}
      <div className="absolute top-4 left-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* SOL TARAF: FORM */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-100 relative transition-colors duration-500">
        <div className="mx-auto w-full max-w-[450px] space-y-6 relative">
          {/* Form Card */}
          <div className="relative bg-slate-100/20 backdrop-blur-xl p-8 sm:p-12 rounded-[2rem] border border-purple-100/20 shadow-xl overflow-hidden group transition-all duration-500 hover:shadow-purple-900/5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-purple-100/5 pointer-events-none" />

            <div className="relative z-10 space-y-6">

              {/* Logo */}
              <div className="flex justify-center">
                <img
                  src="/logo.png"
                  alt="StockMeister Logo"
                  className="h-12 w-auto object-contain"
                />
              </div>

              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-[#7c3176]">{t('auth.forgot_password_title')}</h1>
                <p className="text-balance text-muted-foreground text-sm">
                  {t('auth.forgot_password_subtitle')}
                </p>
              </div>

              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.email_address')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 bg-white/60 backdrop-blur-sm border-slate-200 focus-visible:ring-[#7c3176] transition-all duration-300 focus:bg-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#7c3176] hover:bg-[#60265b] text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.sending_link')}
                      </>
                    ) : (
                      t('auth.send_reset_link')
                    )}
                  </Button>
                </form>
              ) : (
                // Başarılı Gönderim Mesajı
                <div className="rounded-md bg-green-50 p-4 text-center">
                  <h3 className="text-sm font-medium text-green-800">{t('auth.check_email')}</h3>
                  <p className="mt-2 text-sm text-green-700">
                    <Trans i18nKey="auth.email_sent_desc" values={{ email: email }}>
                      We've sent password reset instructions to <strong>{email}</strong>.
                    </Trans>
                  </p>
                  <p className="mt-2 text-xs text-gray-500">{t('auth.redirecting_login')}</p>
                </div>
              )}

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#7c3176] transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Link>
                {t('auth.return_login')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SAĞ TARAF: GÖRSEL (kilit.png) */}
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

export default ForgotPasswordPage;