import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * NavBar Component
 * Displays navigation links and current user info
 * Only shown when user is authenticated
 */
export const NavBar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Handle logout button click
  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  // Don't render if user is not logged in
  if (!currentUser) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/wallets" className="navbar-brand">
          💰 Finance Control
        </Link>
        
        <div className="navbar-nav">
          <Link to="/wallets" className="navbar-link">
            Wallets
          </Link>
          <Link to="/categories" className="navbar-link">
            Categories
          </Link>
        </div>

        <div className="navbar-user">
          <span>Hello, {currentUser}</span>
          <button onClick={handleLogout} className="btn btn-secondary btn-small">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
