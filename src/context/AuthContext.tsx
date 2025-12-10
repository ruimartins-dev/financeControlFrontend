import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  storeCredentials,
  clearCredentials,
  getUsernameFromCredentials,
  postJson,
} from '../lib/api';

/**
 * Auth Context Type Definition
 * Provides authentication state and methods throughout the app
 */
interface AuthContextType {
  currentUser: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Create the context with undefined default (will be provided by AuthProvider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 * Wraps the app and provides authentication state and methods
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Current authenticated username (null if not logged in)
  // Initialize from stored credentials synchronously
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return getUsernameFromCredentials();
  });
  
  // No loading state needed - we initialize synchronously from sessionStorage

  /**
   * Login function
   * Stores credentials and validates them against the API
   * @param username - User's username
   * @param password - User's password
   * @returns Promise<boolean> - true if login successful, false otherwise
   */
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Validate credentials by calling the login endpoint with username and password in body
      await postJson('/api/auth/login', { username, password }, false);

      // If we get here, credentials are valid - store them
      storeCredentials(username, password);
      setCurrentUser(username);
      return true;
    } catch (error) {
      // Clear any stored credentials
      clearCredentials();
      setCurrentUser(null);
      throw error; // Re-throw to let the caller handle the error message
    }
  };

  /**
   * Logout function
   * Clears stored credentials and resets auth state
   */
  const logout = (): void => {
    clearCredentials();
    setCurrentUser(null);
  };

  // Context value to be provided to consumers
  const value: AuthContextType = {
    currentUser,
    isLoading: false, // Always false since we initialize synchronously
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use the Auth Context
 * Must be used within an AuthProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
