/**
 * Data Transfer Objects (DTOs) for the Finance Control API
 * These interfaces define the shape of data exchanged with the backend
 */

// User information returned from the API
export interface UserDto {
  id: number;
  username: string;
  email: string;
  createdAt?: string;
}

// Wallet information
export interface WalletDto {
  id: number;
  name: string;
  balance: number;
  currency: string;
  userId: number;
  createdAt?: string;
}

// Transaction types - DEBIT decreases balance, CREDIT increases balance
export type TransactionType = 'DEBIT' | 'CREDIT';

// Transaction information returned from the API
export interface TransactionDto {
  id: number;
  type: TransactionType;
  category: string;
  subcategory?: string;
  amount: number;
  description?: string;
  date: string; // Format: YYYY-MM-DD
  walletId: number;
  createdAt?: string;
}

// Data needed to create a new transaction
export interface CreateTransactionDto {
  type: TransactionType;
  category: string;
  subcategory?: string;
  amount: number;
  description?: string;
  date: string; // Format: YYYY-MM-DD
}

// Data needed to create a new wallet
export interface CreateWalletDto {
  name: string;
  currency: string;
}

// Data needed for user registration
export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}
