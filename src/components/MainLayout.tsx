import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLocation, Navigate, Outlet, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Settings, 
  LogOut, 
  Languages,
  Menu,
  X,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function MainLayout() {
  const { profile, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const menuItems = profile?.role === 'instructor' ? [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard' },
    { icon: BookOpen, label: t('nav.lectures'), path: '/lectures' },
    { icon: FileText, label: t('nav.reports'), path: '/reports' },
  ] : [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard' },
    { icon: FileText, label: t('nav.history'), path: '/attendance-history' },
    { icon: QrCode, label: t('dashboard.student.checkIn'), path: '/checkin' },
  ];

  const isRTL = i18n.language === 'ar';

  return (
    <div className="min-h-screen flex bg-transparent" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col w-64 bg-black/40 backdrop-blur-[10px] border-white/10 h-screen fixed inset-y-0 z-50 transition-all duration-300",
        "inset-inline-start-0 border-inline-end"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <span className="font-bold text-white text-lg">A</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">{t('brand')}</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "nav-item-immersive",
                location.pathname === item.path && "active"
              )}
            >
              <item.icon size={18} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">
                    {profile?.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                    <p className="text-white text-xs font-bold leading-none">{profile?.name}</p>
                    <p className="text-[10px] text-text-dim mt-1 capitalize">{profile?.role}</p>
                </div>
            </div>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-text-dim hover:text-white transition-all text-sm"
          >
            <Languages size={18} />
            <span className="font-medium">{i18n.language === 'en' ? 'العربية' : 'English'}</span>
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm"
          >
            <LogOut size={18} />
            <span className="font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 w-full h-16 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">A</span>
           </div>
           <span className="font-bold text-white">Attendly</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white">
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.aside
              initial={{ x: isRTL ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '100%' : '-100%' }}
              className={cn(
                "fixed inset-y-0 w-72 backdrop-blur-xl bg-bg-deep/95 text-white z-50 flex flex-col p-6 shadow-2xl border-white/10",
                isRTL ? "right-0 border-l" : "left-0 border-r"
              )}
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xl font-bold">{t('brand')}</span>
                <button onClick={() => setIsSidebarOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                      location.pathname === item.path 
                        ? "bg-primary text-white" 
                        : "hover:bg-white/5 text-text-dim hover:text-white"
                    )}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="space-y-2 border-t border-emerald-900/50 pt-4">
                 <button onClick={toggleLanguage} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg">
                    <Languages size={20} />
                    <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>
                 </button>
                 <button onClick={signOut} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400">
                    <LogOut size={20} />
                    <span>{t('nav.logout')}</span>
                 </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 md:ms-64 pt-16 md:pt-0 h-screen overflow-y-auto relative">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
