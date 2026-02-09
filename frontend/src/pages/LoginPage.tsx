import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

import { motion, AnimatePresence } from 'framer-motion';


const LoginPage = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStatus('loading');

    try {
      await login(username, password);

      setLoginStatus('success');

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);

    } catch (err: any) {
      setLoginStatus('error');

      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');

      setTimeout(() => setLoginStatus('idle'), 2000);
    }
  };

  const isLoading = loginStatus === 'loading' || loginStatus === 'success';

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 relative">
      {/* Language Switcher - Absolute Top Left */}
      <div className="absolute top-4 left-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-100 dark:bg-slate-950 relative z-10 transition-colors duration-500">
        <div className="mx-auto grid w-full max-w-[450px] gap-6 relative">
          {/* Form Card */}
          <div className="relative bg-slate-100/20 dark:bg-slate-900/40 backdrop-blur-xl p-8 sm:p-12 rounded-[2rem] border border-purple-100/20 dark:border-slate-700/30 shadow-xl overflow-hidden group transition-all duration-500 hover:shadow-purple-900/5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-purple-100/5 dark:from-slate-800/10 dark:to-slate-700/5 pointer-events-none" />

            <div className="relative z-10 grid gap-6">
              <div className="flex flex-col items-center mb-4">
                <img src="/logo.png" alt="StockMeister Logo" className="h-16 w-auto mb-4 object-contain" />
                <h1 className="text-3xl font-bold text-[#7c3176]">{t('auth.sign_in')}</h1>
                <p className="text-balance text-muted-foreground mt-2 text-center">
                  {t('auth.subtitle')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">{t('auth.username_email')}</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="h-11 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-600 focus-visible:ring-[#7c3176] transition-all duration-300 focus:bg-white dark:focus:bg-slate-800"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <Link
                      to="/forgot-password"
                      className="ml-auto inline-block text-sm underline text-[#7c3176] hover:text-[#60265b]"
                    >
                      {t('auth.forgot_password')}
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-600 focus-visible:ring-[#7c3176] transition-all duration-300 focus:bg-white dark:focus:bg-slate-800"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      tabIndex={-1}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-[#7c3176] hover:bg-[#60265b] text-white" disabled={isLoading}>
                  {loginStatus === 'loading' ? (
                    <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('auth.signing_in')} </>
                  ) : (t('auth.sign_in'))}
                </Button>
              </form>

            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block relative h-full min-h-screen overflow-hidden">
        <img src="/lockscreen.jpg" alt="Auth Visual" className="w-full h-full object-cover" />
      </div>
      <AnimatePresence>
        {loginStatus !== 'idle' && loginStatus !== 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          >
            {/* Cinematic Background for Overlay */}
            <div className="absolute inset-0">
              <img src="/lockscreen.jpg" alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            </div>
            {/* Success State */}
            {loginStatus === 'success' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 25,
                  duration: 0.6
                }}
                className="relative"
              >
                {/* Glassmorphism Card */}
                <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/20 overflow-hidden">
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-teal-50/30 animate-pulse" />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center">
                    {/* Animated Success Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.2
                      }}
                      className="relative mb-6"
                    >
                      {/* Outer glow ring */}
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 rounded-full bg-emerald-400/30 blur-xl"
                      />

                      {/* Icon container */}
                      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                        {/* Checkmark SVG - Custom minimal design */}
                        <motion.svg
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <motion.path d="M20 6L9 17l-5-5" />
                        </motion.svg>
                      </div>
                    </motion.div>

                    {/* Text content */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-center"
                    >
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                        {t('auth.welcome_back')}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        {t('auth.redirecting')}
                      </p>
                    </motion.div>

                    {/* Loading dots */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="flex gap-1.5 mt-6"
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                          className="w-2 h-2 rounded-full bg-emerald-500"
                        />
                      ))}
                    </motion.div>
                  </div>

                  {/* Decorative particles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{
                        opacity: 0,
                        scale: 0,
                        x: 0,
                        y: 0
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                        x: Math.cos(i * 60 * Math.PI / 180) * 100,
                        y: Math.sin(i * 60 * Math.PI / 180) * 100
                      }}
                      transition={{
                        duration: 1.5,
                        delay: 0.3 + i * 0.1,
                        ease: "easeOut"
                      }}
                      className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-emerald-400"
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {loginStatus === 'error' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  y: 0,
                  x: [0, -10, 10, -10, 10, 0] // Shake effect
                }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{
                  scale: { type: "spring", stiffness: 200, damping: 25 },
                  opacity: { duration: 0.3 },
                  y: { type: "spring", stiffness: 200, damping: 25 },
                  x: { duration: 0.5, delay: 0.2 }
                }}
                className="relative"
              >
                {/* Glassmorphism Card */}
                <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/20 overflow-hidden">
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 via-transparent to-red-50/30" />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center">
                    {/* Animated Error Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.2
                      }}
                      className="relative mb-6"
                    >
                      {/* Outer glow ring */}
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 rounded-full bg-rose-400/30 blur-xl"
                      />

                      {/* Icon container */}
                      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/50">
                        {/* X mark SVG - Custom minimal design */}
                        <motion.svg
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <motion.path d="M18 6L6 18" />
                          <motion.path d="M6 6l12 12" />
                        </motion.svg>
                      </div>
                    </motion.div>

                    {/* Text content */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-center"
                    >
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent mb-2">
                        {t('auth.access_denied')}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        {t('auth.check_credentials')}
                      </p>
                    </motion.div>

                    {/* Pulsing warning indicator */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="mt-6"
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity
                        }}
                        className="px-4 py-2 rounded-full bg-rose-100 border border-rose-200"
                      >
                        <span className="text-xs font-semibold text-rose-700">
                          {t('auth.try_again')}
                        </span>
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Decorative warning particles */}
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{
                        opacity: 0,
                        y: 0
                      }}
                      animate={{
                        opacity: [0, 0.6, 0],
                        y: [0, -50]
                      }}
                      transition={{
                        duration: 1.2,
                        delay: 0.4 + i * 0.15,
                        ease: "easeOut"
                      }}
                      className="absolute bottom-0 w-1 h-8 bg-gradient-to-t from-rose-400 to-transparent"
                      style={{
                        left: `${25 + i * 20}%`
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default LoginPage;