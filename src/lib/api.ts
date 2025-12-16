/**
 * API Client for Finance Control
 * Provides helper functions for making authenticated API requests
 */

// Storage key for credentials
const CREDENTIALS_KEY = 'fc_credentials';

// Get API base URL from environment variable or use default
const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'http://localhost:8080';
};

/**
 * Get the stored credentials from sessionStorage
 * Returns the base64 encoded "username:password" string
 */
export const getStoredCredentials = (): string | null => {
  return sessionStorage.getItem(CREDENTIALS_KEY);
};

/**
 * Store credentials in sessionStorage as base64 encoded string
 */
export const storeCredentials = (username: string, password: string): void => {
  const credentials = btoa(`${username}:${password}`);
  sessionStorage.setItem(CREDENTIALS_KEY, credentials);
};

/**
 * Clear stored credentials from sessionStorage
 */
export const clearCredentials = (): void => {
  sessionStorage.removeItem(CREDENTIALS_KEY);
};

/**
 * Get the username from stored credentials
 */
export const getUsernameFromCredentials = (): string | null => {
  const credentials = getStoredCredentials();
  if (!credentials) return null;
  
  try {
    const decoded = atob(credentials);
    const [username] = decoded.split(':');
    return username;
  } catch {
    return null;
  }
};

/**
 * Build headers for API requests
 * Automatically adds Authorization header if credentials are stored
 */
const buildHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const credentials = getStoredCredentials();
    if (credentials) {
      headers['Authorization'] = `Basic ${credentials}`;
    }
  }

  return headers;
};

/**
 * Generic error class for API errors
 */
export class ApiError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Handle API response and parse JSON
 * Throws ApiError for non-OK responses
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = `HTTP Error: ${response.status}`;
    try {
      const errorData = await response.json();
      message = errorData.message || errorData.error || message;
    } catch {
      // If we can't parse the error body, use default message
    }
    throw new ApiError(response.status, message);
  }

  // Handle empty responses (e.g., 204 No Content)
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
};

/**
 * Make a GET request to the API
 * @param path - API endpoint path (e.g., '/api/wallets')
 * @param includeAuth - Whether to include Authorization header (default: true)
 */
export const getJson = async <T>(path: string, includeAuth: boolean = true): Promise<T> => {
  const url = `${getApiUrl()}${path}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(includeAuth),
  });

  return handleResponse<T>(response);
};

/**
 * Make a POST request to the API
 * @param path - API endpoint path (e.g., '/api/wallets')
 * @param body - Request body (will be JSON stringified)
 * @param includeAuth - Whether to include Authorization header (default: true)
 */
export const postJson = async <T>(
  path: string,
  body?: unknown,
  includeAuth: boolean = true
): Promise<T> => {
  const url = `${getApiUrl()}${path}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(includeAuth),
    body: body ? JSON.stringify(body) : undefined,
  });

  return handleResponse<T>(response);
};

/**
 * Make a DELETE request to the API
 * @param path - API endpoint path (e.g., '/api/transactions/1')
 * @param includeAuth - Whether to include Authorization header (default: true)
 */
export const deleteJson = async <T>(path: string, includeAuth: boolean = true): Promise<T> => {
  const url = `${getApiUrl()}${path}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: buildHeaders(includeAuth),
  });

  return handleResponse<T>(response);
};

/**
 * Make a POST request with multipart/form-data (for file uploads)
 * @param path - API endpoint path (e.g., '/api/wallets/1/import')
 * @param formData - FormData object containing the file and other fields
 * @param includeAuth - Whether to include Authorization header (default: true)
 */
export const postFormData = async <T>(
  path: string,
  formData: FormData,
  includeAuth: boolean = true
): Promise<T> => {
  const url = `${getApiUrl()}${path}`;

  // Build headers without Content-Type (browser will set it automatically for FormData)
  const headers: HeadersInit = {};
  if (includeAuth) {
    const credentials = getStoredCredentials();
    if (credentials) {
      headers['Authorization'] = `Basic ${credentials}`;
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  return handleResponse<T>(response);
};
