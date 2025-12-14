import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { WalletsPage } from './pages/WalletsPage';
import { WalletDetailPage } from './pages/WalletDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ReportsPage } from './pages/ReportsPage';
import './App.css';

/**
 * Private Route Component
 * Redirects to login if user is not authenticated
 */
interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Public Route Component
 * Redirects to dashboard if user is already authenticated
 */
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * Layout Component for authenticated pages
 */
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

/**
 * Main App Component
 */
function App() {
  const { currentUser } = useAuth();

  return (
    <div className="app">
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected routes with layout */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/wallets"
          element={
            <PrivateRoute>
              <AppLayout>
                <WalletsPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/wallets/:id"
          element={
            <PrivateRoute>
              <AppLayout>
                <WalletDetailPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <PrivateRoute>
              <AppLayout>
                <CategoriesPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <AppLayout>
                <ReportsPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/budget"
          element={
            <PrivateRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </div>
  );
}

export default App;
