import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { postJson, ApiError } from '../lib/api';
import { Toast, useToast } from '../components/Toast';
import { LanguageSelector } from '../components/LanguageSelector';
import type { RegisterDto } from '../types/dtos';

/**
 * Register Page Component
 */
export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const [toast, showToast, hideToast] = useToast();

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    if (!username.trim()) {
      showToast(t('errors.requiredField'), 'error');
      return;
    }
    if (username.length < 3) {
      showToast(t('errors.minLength', { field: t('auth.username'), length: 3 }), 'error');
      return;
    }
    if (!email.trim()) {
      showToast(t('errors.requiredField'), 'error');
      return;
    }
    if (!isValidEmail(email)) {
      showToast(t('errors.invalidEmail'), 'error');
      return;
    }
    if (!password) {
      showToast(t('errors.requiredField'), 'error');
      return;
    }
    if (password.length < 6) {
      showToast(t('errors.minLength', { field: t('auth.password'), length: 6 }), 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast(t('errors.passwordMismatch'), 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const registerData: RegisterDto = {
        username: username.trim(),
        email: email.trim(),
        password,
      };

      await postJson('/api/auth/register', registerData, false);
      showToast(t('common.success'), 'success');
      
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          showToast(t('errors.alreadyExists'), 'error');
        } else {
          showToast(error.message, 'error');
        }
      } else {
        showToast(t('errors.generic'), 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-language-selector">
        <LanguageSelector />
      </div>
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">💰</div>
          <h1>{t('auth.registerTitle')}</h1>
          <p className="auth-subtitle">{t('auth.registerSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">{t('auth.username')}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.username')}
              disabled={isSubmitting}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.email')}
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password')}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('auth.confirmPassword')}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('auth.registering') : t('auth.register')}
          </button>
        </form>

        <p className="auth-footer">
          {t('auth.hasAccount')} <Link to="/login">{t('auth.login')}</Link>
        </p>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};
