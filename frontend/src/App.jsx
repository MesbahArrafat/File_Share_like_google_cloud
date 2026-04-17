import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { FileProvider } from './context/FileContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StarredPage from './pages/StarredPage';
import TrashPage from './pages/TrashPage';
import ActivityPage from './pages/ActivityPage';
import SharedFilePage from './pages/SharedFilePage';
import ProfilePage from './pages/ProfilePage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/share/:token" element={<SharedFilePage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <FileProvider>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/starred" element={<StarredPage />} />
                <Route path="/trash" element={<TrashPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </FileProvider>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-body)',
            },
            success: { iconTheme: { primary: '#34d399', secondary: '#0a0b0e' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#0a0b0e' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
