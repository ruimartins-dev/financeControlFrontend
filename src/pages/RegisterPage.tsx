import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postJson, ApiError } from '../lib/api';
import { Toast, useToast } from '../components/Toast';
import type { RegisterDto } from '../types/dtos';

/**
 * Register Page Component
 * Provides a form for new users to create an account
 */
export const RegisterPage: React.FC = () => {
  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const navigate = useNavigate();
  const [toast, showToast, hideToast] = useToast();

  /**
   * Validate email format
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Handle form submission
   * Validates input and attempts registration
   */
  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    // Validation
    if (!username.trim()) {
      showToast('Username is required', 'error');
      return;
    }
    if (username.length < 3) {
      showToast('Username must be at least 3 characters', 'error');
      return;
    }
    if (!email.trim()) {
      showToast('Email is required', 'error');
      return;
    }
    if (!isValidEmail(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    if (!password) {
      showToast('Password is required', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare registration data
      const registerData: RegisterDto = {
        username: username.trim(),
        email: email.trim(),
        password,
      };

      // Call registration endpoint (no auth required)
      await postJson('/api/auth/register', registerData, false);

      showToast('Registration successful! Please log in.', 'success');
      
      // Redirect to login page after short delay
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      // Handle API errors
      if (error instanceof ApiError) {
        if (error.status === 409) {
          showToast('Username or email already exists', 'error');
        } else {
          showToast(error.message, 'error');
        }
      } else {
        showToast('Registration failed. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Register</h1>
        <p className="auth-subtitle">Create an account to get started.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              disabled={isSubmitting}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password (min 6 characters)"
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};
