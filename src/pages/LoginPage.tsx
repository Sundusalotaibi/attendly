import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserCircle, GraduationCap, QrCode, Mail, Lock, User as UserIcon, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
  const { signIn, signInByEmail, signUpByEmail, user, profile, isSigningIn } = useAuth();
  const { t, i18n } = useTranslation();
  const [role, setRole] = React.useState<'instructor' | 'student' | null>(null);
  const [authMode, setAuthMode] = React.useState<'login' | 'register'>('login');
  const [error, setError] = React.useState<string | null>(null);
  
  // Form states
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  if (user && profile) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleSignIn = async () => {
    if (!role) return;
    try {
      setError(null);
      await signIn(role);
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setError("Popup blocked. Please enable popups for this site.");
      } else {
        setError(err.message || "Failed to sign in. Please try again.");
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setError(null);
    try {
      if (authMode === 'login') {
        await signInByEmail(email, password);
      } else {
        await signUpByEmail(email, password, fullName, role);
      }
    } catch (err: any) {
      console.error("Auth error details:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password sign-in is disabled. Please enable it in the Firebase Console under Authentication > Sign-in method.");
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid email or password. Please check your credentials or create a new account.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Authentication failed. Please check your credentials.");
      }
    }
  };

  const isRTL = i18n.language === 'ar';

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-[2.5rem] relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <span className="text-xl font-bold text-white">A</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">{t('brand')}</h1>
          <p className="text-text-dim text-sm">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!role ? (
            <motion.div 
              key="role-selection"
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
              className="space-y-3"
            >
               <h3 className="text-sm font-bold text-text-dim text-center mb-4">{t('login.selectRole')}</h3>
               <button 
                  onClick={() => setRole('instructor')}
                  className="w-full group p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center gap-4 transition-all duration-300 border border-white/5"
               >
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary transition-colors">
                    <UserCircle className="text-primary group-hover:text-white" size={20} />
                  </div>
                  <div className="text-start">
                    <div className="font-bold text-sm">{t('login.asInstructor')}</div>
                  </div>
               </button>

               <button 
                  onClick={() => setRole('student')}
                  className="w-full group p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center gap-4 transition-all duration-300 border border-white/5"
               >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                    <GraduationCap className="text-blue-400 group-hover:text-white" size={20} />
                  </div>
                  <div className="text-start">
                    <div className="font-bold text-sm">{t('login.asStudent')}</div>
                  </div>
               </button>
            </motion.div>
          ) : (
            <motion.div 
              key="auth-form"
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                 <button 
                   onClick={() => setRole(null)} 
                   disabled={isSigningIn}
                   className="flex items-center gap-2 text-[10px] font-bold text-text-dim hover:text-white transition-colors"
                 >
                   <ArrowLeft size={14} className={isRTL ? "rotate-180" : ""} />
                   {t('common.back')}
                 </button>
                 <span className="text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                   {role === 'instructor' ? t('login.asInstructor') : t('login.asStudent')}
                 </span>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authMode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ps-1">{t('login.name')}</label>
                    <div className="input-wrapper-immersive">
                      <UserIcon className="input-icon-immersive" size={16} />
                      <input
                        type="text"
                        placeholder={t('login.name')}
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="input-field-immersive"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ps-1">{t('login.email')}</label>
                  <div className="input-wrapper-immersive">
                    <Mail className="input-icon-immersive" size={16} />
                    <input
                      type="email"
                      placeholder={t('login.email')}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field-immersive"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ps-1">{t('login.password')}</label>
                  <div className="input-wrapper-immersive">
                    <Lock className="input-icon-immersive" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={t('login.password')}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field-immersive"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="me-3 p-1 text-text-dim/50 hover:text-text-dim transition-colors shrink-0"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="w-full btn-immersive py-3.5 flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isSigningIn ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <span className="font-bold">{authMode === 'login' ? t('login.signIn') : t('login.signUp')}</span>
                      <ArrowRight size={18} className={isRTL ? "rotate-180" : ""} />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  disabled={isSigningIn}
                  className="text-xs text-text-dim hover:text-white transition-colors"
                >
                  {authMode === 'login' ? t('login.noAccount') : t('login.hasAccount')}{' '}
                  <span className="text-primary font-bold">{authMode === 'login' ? t('login.signUp') : t('login.signIn')}</span>
                </button>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">{t('login.orContinue')}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button 
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-white hover:bg-neutral-100 text-black transition-all font-bold text-sm disabled:opacity-50"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                {t('login.googleSignIn')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
