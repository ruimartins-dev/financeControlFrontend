import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LanguageSelector } from './LanguageSelector';
import logoImg from '../assets/logo_finance_control.png';

/**
 * Sidebar Component
 * Modern sidebar navigation with mobile hamburger menu
 */
export const Sidebar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-content">
          <div className="logo">
            <img src={logoImg} alt="FinanceControl" className="logo-img" />
            <span className="logo-text">FinanceControl</span>
          </div>
          <div className="mobile-header-actions">
            <LanguageSelector />
            <button 
              className="hamburger-btn"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
              <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
              <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
            </button>
          </div>
        </div>
      </header>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={closeMobileMenu}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src={logoImg} alt="FinanceControl" className="logo-img" />
            <span className="logo-text">FinanceControl</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">{t('sidebar.menu')}</span>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-label">{t('sidebar.dashboard')}</span>
            </NavLink>
            <NavLink 
              to="/wallets" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">👛</span>
              <span className="nav-label">{t('sidebar.wallets')}</span>
            </NavLink>
            <NavLink 
              to="/categories" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">🏷️</span>
              <span className="nav-label">{t('sidebar.categories')}</span>
            </NavLink>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">{t('sidebar.analytics')}</span>
            <NavLink 
              to="/reports" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">📈</span>
              <span className="nav-label">{t('sidebar.reports')}</span>
            </NavLink>
            <NavLink 
              to="/budget" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">🎯</span>
              <span className="nav-label">{t('sidebar.budget')}</span>
            </NavLink>
          </div>
        </nav>

        {/* Language Selector */}
        <div className="sidebar-language">
          <LanguageSelector />
        </div>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{currentUser}</span>
              <span className="user-role">{t('auth.personalAccount')}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn" title={t('auth.logout')}>
            <span className="nav-icon">🚪</span>
          </button>
        </div>
      </aside>
    </>
  );
};
