import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Toast, useToast } from '../components/Toast';
import { LanguageSelector } from '../components/LanguageSelector';
import { ApiError } from '../lib/api';

/**
 * Login Page Component
 */
export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [toast, showToast, hideToast] = useToast();

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    if (!username.trim()) {
      showToast(t('errors.requiredField'), 'error');
      return;
    }
    if (!password) {
      showToast(t('errors.requiredField'), 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(username, password);
      showToast(t('common.success'), 'success');
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          showToast(t('errors.unauthorized'), 'error');
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
          <h1>{t('auth.loginTitle')}</h1>
          <p className="auth-subtitle">{t('auth.loginSubtitle')}</p>
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
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password')}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('auth.loggingIn') : t('auth.login')}
          </button>
        </form>

        <p className="auth-footer">
          {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
        </p>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};
