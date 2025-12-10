import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast, useToast } from '../components/Toast';
import { ApiError } from '../lib/api';

/**
 * Login Page Component
 * Provides a form for users to log in with username and password
 */
export const LoginPage: React.FC = () => {
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const { login } = useAuth();
  const navigate = useNavigate();
  const [toast, showToast, hideToast] = useToast();

  /**
   * Handle form submission
   * Validates input and attempts login
   */
  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    // Basic validation
    if (!username.trim()) {
      showToast('Username is required', 'error');
      return;
    }
    if (!password) {
      showToast('Password is required', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Attempt login
      await login(username, password);
      showToast('Login successful!', 'success');
      // Redirect to wallets page after successful login
      navigate('/wallets');
    } catch (error) {
      // Handle API errors
      if (error instanceof ApiError) {
        if (error.status === 401) {
          showToast('Invalid username or password', 'error');
        } else {
          showToast(error.message, 'error');
        }
      } else {
        showToast('Login failed. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Login</h1>
        <p className="auth-subtitle">Welcome back! Please sign in to continue.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isSubmitting}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isSubmitting}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};
