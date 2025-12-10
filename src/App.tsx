import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { NavBar } from './components/NavBar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WalletsPage } from './pages/WalletsPage';
import { WalletDetailPage } from './pages/WalletDetailPage';
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

  // Show loading while checking auth state
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Public Route Component
 * Redirects to wallets if user is already authenticated
 */
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();

  // Show loading while checking auth state
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  // Redirect to wallets if already logged in
  if (currentUser) {
    return <Navigate to="/wallets" replace />;
  }

  return <>{children}</>;
};

/**
 * Main App Component
 * Sets up routing for the application
 */
function App() {
  const { currentUser } = useAuth();

  return (
    <div className="app">
      {/* Show NavBar only when logged in */}
      {currentUser && <NavBar />}

      <main className="main-content">
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

          {/* Protected routes */}
          <Route
            path="/wallets"
            element={
              <PrivateRoute>
                <WalletsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/wallets/:id"
            element={
              <PrivateRoute>
                <WalletDetailPage />
              </PrivateRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/wallets" replace />} />
          <Route path="*" element={<Navigate to="/wallets" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
