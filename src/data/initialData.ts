import { BankAccount, CategoryBudget, CloudSyncState, DebtRecord, LenderContact, Transaction, UserConfig } from '../types/expense';

// Clean production defaults with NO dummy/mock transactions or fake data
export const INITIAL_ACCOUNTS: BankAccount[] = [
  {
    id: 'primary-bank',
    name: 'Primary Savings Account',
    institution: 'Bank Account',
    accountNumber: '•••• 0000',
    type: 'savings',
    balance: 0.0,
    lastSyncedAt: 'Ready for setup',
    syncStatus: 'connected',
    color: '#2563EB',
    iconName: 'Landmark',
    isAutoSyncEnabled: true,
  },
  {
    id: 'cash-wallet',
    name: 'Cash / Wallet',
    institution: 'Cash',
    accountNumber: 'Cash on hand',
    type: 'cash',
    balance: 0.0,
    lastSyncedAt: 'Manual',
    syncStatus: 'connected',
    color: '#059669',
    iconName: 'Wallet',
    isAutoSyncEnabled: false,
  },
];

export const INITIAL_BUDGETS: CategoryBudget[] = [
  { id: 'b-groceries', categoryId: 'groceries', monthlyLimit: 10000, alertThreshold: 0.8 },
  { id: 'b-dining', categoryId: 'dining', monthlyLimit: 5000, alertThreshold: 0.85 },
  { id: 'b-shopping', categoryId: 'shopping', monthlyLimit: 5000, alertThreshold: 0.8 },
  { id: 'b-transport', categoryId: 'transport', monthlyLimit: 4000, alertThreshold: 0.8 },
  { id: 'b-utilities', categoryId: 'utilities', monthlyLimit: 3000, alertThreshold: 0.9 },
  { id: 'b-housing', categoryId: 'housing', monthlyLimit: 20000, alertThreshold: 0.95 },
  { id: 'b-health', categoryId: 'health', monthlyLimit: 3000, alertThreshold: 0.8 },
  { id: 'b-entertainment', categoryId: 'entertainment', monthlyLimit: 2500, alertThreshold: 0.8 },
];

// 0 Mock Transactions for Production
export const INITIAL_TRANSACTIONS: Transaction[] = [];

// 0 Mock Debts for Production
export const INITIAL_DEBTS: DebtRecord[] = [];

// Default User Configuration
export const INITIAL_USER_CONFIG: UserConfig = {
  userName: 'Nandkumar',
  currencySymbol: '₹',
  monthlySalary: 0,
  monthStartDay: 1,
  defaultPaymentAccountId: 'primary-bank',
  enableBiometric: false,
};

// Initial empty lender contacts
export const INITIAL_LENDER_CONTACTS: LenderContact[] = [];

export const INITIAL_CLOUD_STATE: CloudSyncState = {
  provider: 'local_secure',
  lastSyncedAt: null,
  autoSyncEnabled: false,
  syncIntervalHours: 24,
  status: 'idle',
  lastStatusMessage: 'Offline local-first storage active. Ready to sync.',
  storageUsedKb: 4,
  backupHistory: [],
};
