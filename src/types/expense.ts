export type TransactionType = 'debit' | 'credit';

export type CategoryId =
  | 'groceries'
  | 'dining'
  | 'shopping'
  | 'transport'
  | 'utilities'
  | 'housing'
  | 'entertainment'
  | 'health'
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'transfer'
  | 'other'
  | string;

export interface CategoryDef {
  id: CategoryId;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
  subcategories?: string[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: CategoryId;
  accountId: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  source: 'manual' | 'bank_sync' | 'sms_parser' | 'cloud_import';
  bankReference?: string;
  status: 'cleared' | 'pending';
  receiptNote?: string;
  tags?: string[];
}

export interface BankAccount {
  id: string;
  name: string;
  institution: string;
  accountNumber: string;
  type: 'checking' | 'savings' | 'credit' | 'cash';
  balance: number;
  availableLimit?: number; // for credit cards
  billCycleDay?: number; // statement generation date e.g. 15th
  paymentDueDate?: number; // payment due date e.g. 5th
  lastSyncedAt: string;
  syncStatus: 'connected' | 'syncing' | 'paused' | 'error';
  color: string;
  iconName: string;
  isAutoSyncEnabled: boolean;
}

export interface CategoryBudget {
  id: string;
  categoryId: CategoryId;
  monthlyLimit: number;
  alertThreshold: number; // e.g. 0.8 for 80%
}

export interface MonthlyReport {
  month: string; // YYYY-MM
  totalDebit: number;
  totalCredit: number;
  netSavings: number;
  savingsRate: number; // percentage
  categoryBreakdown: {
    categoryId: CategoryId;
    categoryName: string;
    color: string;
    total: number;
    count: number;
    percentage: number;
    budget?: number;
    isOverBudget: boolean;
  }[];
  topMerchants: {
    merchant: string;
    total: number;
    count: number;
  }[];
  dailySpendAverage: number;
  insights: string[];
}

export interface CloudSyncState {
  provider: 'google_drive' | 'cloud_storage' | 'local_secure';
  lastSyncedAt: string | null;
  autoSyncEnabled: boolean;
  syncIntervalHours: number;
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastStatusMessage: string;
  storageUsedKb: number;
  backupHistory: CloudBackupRecord[];
}

export interface CloudBackupRecord {
  id: string;
  timestamp: string;
  recordCount: number;
  sizeKb: number;
  hash: string;
}

export type DebtType = 'lent' | 'borrowed'; // lent = I gave money to someone (they owe me), borrowed = I took money from someone (I owe them)
export type DebtStatus = 'pending' | 'partially_paid' | 'settled';

export interface DebtRepayment {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  note?: string;
  recordedTransactionId?: string; // linked to ledger if synced
}

export interface DebtRecord {
  id: string;
  personName: string;
  contactPhone?: string;
  type: DebtType; // 'lent' (Money Lent to person) or 'borrowed' (Money Borrowed from person)
  initialAmount: number;
  remainingBalance: number; // pending balance
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  status: DebtStatus;
  notes?: string;
  interestRate?: number; // optional annual interest %
  repayments: DebtRepayment[];
  accountId?: string; // linked bank account used when lending/borrowing
  createdAt: string;
}

export interface UserConfig {
  userName: string;
  currencySymbol: string;
  monthlySalary: number;
  monthStartDay: number;
  defaultPaymentAccountId?: string;
  enableBiometric: boolean;
  biometricCredentialId?: string;
}

export interface LenderContact {
  id: string;
  name: string;
  phone?: string;
  relationship?: string; // Friend, Family, Colleague, Business, Bank
  notes?: string;
}
