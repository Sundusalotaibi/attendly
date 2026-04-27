import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './i18n';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateLecturePage from './pages/CreateLecturePage';
import LecturesListPage from './pages/LecturesListPage';
import QRCodePage from './pages/QRCodePage';
import CheckInPage from './pages/CheckInPage';
import ReportsPage from './pages/ReportsPage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';
import { useTranslation } from 'react-i18next';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'instructor' | 'student' }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-bg-deep">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;
  if (role && profile?.role !== role) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
}

function AppContent() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Instructor Only */}
          <Route path="/lectures" element={<ProtectedRoute role="instructor"><LecturesListPage /></ProtectedRoute>} />
          <Route path="/lectures/create" element={<ProtectedRoute role="instructor"><CreateLecturePage /></ProtectedRoute>} />
          <Route path="/lectures/:id/qr" element={<ProtectedRoute role="instructor"><QRCodePage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute role="instructor"><ReportsPage /></ProtectedRoute>} />
          
          {/* Student Only */}
          <Route path="/checkin" element={<ProtectedRoute role="student"><CheckInPage /></ProtectedRoute>} />
          <Route path="/attendance-history" element={<ProtectedRoute role="student"><AttendanceHistoryPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
