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

// Category information returned from the API
export interface CategoryDto {
  id: number;
  name: string;
  type: TransactionType;
  isDefault: boolean;
  userId?: number;
  subcategories?: SubcategoryDto[];
}

// Subcategory information returned from the API
export interface SubcategoryDto {
  id: number;
  name: string;
  categoryId: number;
}

// Data needed to create a new category
export interface CreateCategoryDto {
  name: string;
  type: TransactionType;
}

// Data needed to create a new subcategory
export interface CreateSubcategoryDto {
  name: string;
  categoryId: number;
}

// Response from voice/text parsing endpoint
export interface VoiceParseResponseDto {
  transaction: TransactionDto;
  message?: string;
}

// Response from CSV import endpoint
export interface ImportResultDto {
  created: number;
  skipped: number;
  errors?: string[];
}

// Draft transaction returned from classification endpoint
export interface TransactionDraftDto {
  type: TransactionType;
  amount: number;
  category: string;
  subcategory?: string;
  date: string; // Format: YYYY-MM-DD
  description?: string;
}

// Request body for text classification
export interface ClassifyTextRequestDto {
  walletId: number;
  text: string;
}

// Web Speech API types (for voice recognition)
export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionEventType extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionType extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognitionType, ev: Event) => void) | null;
  onaudiostart: ((this: SpeechRecognitionType, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionType, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionType, ev: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((this: SpeechRecognitionType, ev: SpeechRecognitionEventType) => void) | null;
  onresult: ((this: SpeechRecognitionType, ev: SpeechRecognitionEventType) => void) | null;
  onsoundend: ((this: SpeechRecognitionType, ev: Event) => void) | null;
  onsoundstart: ((this: SpeechRecognitionType, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognitionType, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognitionType, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognitionType, ev: Event) => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionType;
  prototype: SpeechRecognitionType;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}
