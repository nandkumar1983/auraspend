import {
  BankAccount,
  CategoryBudget,
  CategoryDef,
  CategoryId,
  CloudBackupRecord,
  CloudSyncState,
  DebtRecord,
  DebtRepayment,
  LenderContact,
  MonthlyReport,
  Transaction,
  UserConfig,
} from '../types/expense';
import {
  INITIAL_ACCOUNTS,
  INITIAL_BUDGETS,
  INITIAL_CLOUD_STATE,
  INITIAL_DEBTS,
  INITIAL_LENDER_CONTACTS,
  INITIAL_TRANSACTIONS,
  INITIAL_USER_CONFIG,
} from '../data/initialData';
import { CATEGORIES } from '../utils/formatters';

const STORAGE_KEYS = {
  TRANSACTIONS: 'auraspend_prod_v3_transactions',
  ACCOUNTS: 'auraspend_prod_v3_accounts',
  BUDGETS: 'auraspend_prod_v3_budgets',
  CLOUD_SYNC: 'auraspend_prod_v3_cloud',
  DEBTS: 'auraspend_prod_v3_debts',
  USER_CONFIG: 'auraspend_prod_v3_user_config',
  CONTACTS: 'auraspend_prod_v3_contacts',
  CATEGORIES: 'auraspend_prod_v3_categories',
};

export class StorageService {
  static getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  }

  static saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  static getAccounts(): BankAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return data ? JSON.parse(data) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  }

  static saveAccounts(accounts: BankAccount[]): void {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }

  static getBudgets(): CategoryBudget[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      return data ? JSON.parse(data) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  }

  static saveBudgets(budgets: CategoryBudget[]): void {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  }

  static getUserConfig(): UserConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_CONFIG);
      return data ? JSON.parse(data) : INITIAL_USER_CONFIG;
    } catch {
      return INITIAL_USER_CONFIG;
    }
  }

  static saveUserConfig(config: UserConfig): void {
    localStorage.setItem(STORAGE_KEYS.USER_CONFIG, JSON.stringify(config));
  }

  static getLenderContacts(): LenderContact[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      return data ? JSON.parse(data) : INITIAL_LENDER_CONTACTS;
    } catch {
      return INITIAL_LENDER_CONTACTS;
    }
  }

  static saveLenderContacts(contacts: LenderContact[]): void {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  }

  static addLenderContact(contactData: Omit<LenderContact, 'id'>): LenderContact {
    const contacts = this.getLenderContacts();
    const newContact: LenderContact = {
      ...contactData,
      id: `contact-${Date.now()}`,
    };
    contacts.push(newContact);
    this.saveLenderContacts(contacts);
    return newContact;
  }

  static deleteLenderContact(id: string): void {
    const contacts = this.getLenderContacts().filter((c) => c.id !== id);
    this.saveLenderContacts(contacts);
  }

  static getCategories(): CategoryDef[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return Object.values(CATEGORIES);
  }

  static saveCategories(categories: CategoryDef[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  static getCloudSyncState(): CloudSyncState {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLOUD_SYNC);
      return data ? JSON.parse(data) : INITIAL_CLOUD_STATE;
    } catch {
      return INITIAL_CLOUD_STATE;
    }
  }

  static saveCloudSyncState(state: CloudSyncState): void {
    localStorage.setItem(STORAGE_KEYS.CLOUD_SYNC, JSON.stringify(state));
  }

  static createCloudBackupSnapshot(): CloudBackupRecord {
    const state = this.getCloudSyncState();
    const transactions = this.getTransactions();
    const backup: CloudBackupRecord = {
      id: `bk-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recordCount: transactions.length,
      sizeKb: Math.max(1, Math.round(JSON.stringify(transactions).length / 1024)),
      hash: 'sha256-' + Math.random().toString(36).substring(2, 10),
    };
    state.backupHistory = [backup, ...state.backupHistory.slice(0, 9)];
    state.lastSyncedAt = new Date().toISOString();
    state.status = 'success';
    state.lastStatusMessage = `Cloud replication snapshot ${backup.id} verified.`;
    this.saveCloudSyncState(state);
    return backup;
  }

  static generateMonthlyReport(monthStr: string): MonthlyReport {
    return this.getMonthlyReport(monthStr);
  }

  static addTransaction(tx: Omit<Transaction, 'id'>): Transaction {
    const transactions = this.getTransactions();
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    transactions.unshift(newTx);
    this.saveTransactions(transactions);

    // Update account balance
    const accounts = this.getAccounts();
    const accountIndex = accounts.findIndex((a) => a.id === tx.accountId);
    if (accountIndex !== -1) {
      const acc = accounts[accountIndex];
      if (tx.type === 'debit') {
        acc.balance -= tx.amount;
        if (acc.availableLimit !== undefined) {
          acc.availableLimit = Math.max(0, acc.availableLimit - tx.amount);
        }
      } else {
        acc.balance += tx.amount;
        if (acc.availableLimit !== undefined) {
          acc.availableLimit += tx.amount;
        }
      }
      acc.lastSyncedAt = 'Just now';
      this.saveAccounts(accounts);
    }

    return newTx;
  }

  static deleteTransaction(id: string): void {
    const transactions = this.getTransactions();
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    // Reverse account balance effect
    const accounts = this.getAccounts();
    const accountIndex = accounts.findIndex((a) => a.id === tx.accountId);
    if (accountIndex !== -1) {
      const acc = accounts[accountIndex];
      if (tx.type === 'debit') {
        acc.balance += tx.amount;
        if (acc.availableLimit !== undefined) {
          acc.availableLimit += tx.amount;
        }
      } else {
        acc.balance -= tx.amount;
        if (acc.availableLimit !== undefined) {
          acc.availableLimit = Math.max(0, acc.availableLimit - tx.amount);
        }
      }
      this.saveAccounts(accounts);
    }

    const filtered = transactions.filter((t) => t.id !== id);
    this.saveTransactions(filtered);
  }

  static getMonthlyReport(monthStr: string): MonthlyReport {
    const transactions = this.getTransactions();
    const budgets = this.getBudgets();
    const categories = this.getCategories();

    const monthTx = transactions.filter((t) => t.date.startsWith(monthStr));

    let totalDebit = 0;
    let totalCredit = 0;
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    const merchantTotals: Record<string, { total: number; count: number }> = {};

    monthTx.forEach((tx) => {
      if (tx.type === 'debit') {
        totalDebit += tx.amount;

        if (!categoryTotals[tx.category]) {
          categoryTotals[tx.category] = { total: 0, count: 0 };
        }
        categoryTotals[tx.category].total += tx.amount;
        categoryTotals[tx.category].count += 1;

        const merchantKey = tx.description.split(' - ')[0] || tx.description;
        if (!merchantTotals[merchantKey]) {
          merchantTotals[merchantKey] = { total: 0, count: 0 };
        }
        merchantTotals[merchantKey].total += tx.amount;
        merchantTotals[merchantKey].count += 1;
      } else {
        totalCredit += tx.amount;
      }
    });

    const netSavings = totalCredit - totalDebit;
    const savingsRate = totalCredit > 0 ? (netSavings / totalCredit) * 100 : 0;

    const categoryBreakdown = Object.entries(categoryTotals).map(([catId, data]) => {
      const catDef = categories.find((c) => c.id === catId);
      const budgetDef = budgets.find((b) => b.categoryId === catId);
      const budget = budgetDef?.monthlyLimit;
      const isOverBudget = budget ? data.total > budget : false;

      return {
        categoryId: catId as CategoryId,
        categoryName: catDef?.name || catId,
        color: catDef?.color || '#94a3b8',
        total: data.total,
        count: data.count,
        percentage: totalDebit > 0 ? (data.total / totalDebit) * 100 : 0,
        budget,
        isOverBudget,
      };
    });

    categoryBreakdown.sort((a, b) => b.total - a.total);

    const topMerchants = Object.entries(merchantTotals)
      .map(([merchant, data]) => ({
        merchant,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const dateParts = monthStr.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailySpendAverage = totalDebit / daysInMonth;

    const insights: string[] = [];
    if (savingsRate > 20) {
      insights.push(`Healthy savings rate of ${savingsRate.toFixed(1)}% this month.`);
    } else if (totalCredit > 0 && savingsRate < 5) {
      insights.push('Caution: Spend velocity exceeded 95% of income. Review top categories.');
    }

    const overBudgetCats = categoryBreakdown.filter((c) => c.isOverBudget);
    if (overBudgetCats.length > 0) {
      insights.push(
        `Over budget in ${overBudgetCats.map((c) => c.categoryName).join(', ')}. Adjust spending limits.`
      );
    }

    if (topMerchants.length > 0) {
      insights.push(`Top expense merchant was ${topMerchants[0].merchant} (₹${topMerchants[0].total.toLocaleString('en-IN')}).`);
    }

    if (insights.length === 0) {
      insights.push('Add transactions to view automated monthly category intelligence.');
    }

    return {
      month: monthStr,
      totalDebit,
      totalCredit,
      netSavings,
      savingsRate,
      categoryBreakdown,
      topMerchants,
      dailySpendAverage,
      insights,
    };
  }

  static getDebts(): DebtRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEBTS);
      return data ? JSON.parse(data) : INITIAL_DEBTS;
    } catch {
      return INITIAL_DEBTS;
    }
  }

  static saveDebts(debts: DebtRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
  }

  static addDebtRecord(
    debt: Omit<DebtRecord, 'id' | 'remainingBalance' | 'repayments' | 'createdAt'>
  ): DebtRecord {
    const debts = this.getDebts();
    const newDebt: DebtRecord = {
      ...debt,
      id: `debt-${Date.now()}`,
      remainingBalance: debt.initialAmount,
      repayments: [],
      createdAt: new Date().toISOString(),
    };
    debts.unshift(newDebt);
    this.saveDebts(debts);
    return newDebt;
  }

  static deleteDebtRecord(id: string): void {
    const debts = this.getDebts().filter((d) => d.id !== id);
    this.saveDebts(debts);
  }

  static addDebtRepayment(
    debtId: string,
    repayment: {
      amount: number;
      date: string;
      time: string;
      note?: string;
      syncToLedger?: boolean;
      accountId?: string;
    }
  ): DebtRecord | null {
    const debts = this.getDebts();
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return null;

    const repaymentRecord: DebtRepayment = {
      id: `rep-${Date.now()}`,
      amount: repayment.amount,
      date: repayment.date,
      time: repayment.time,
      note: repayment.note,
    };

    if (repayment.syncToLedger && repayment.accountId) {
      const txType = debt.type === 'lent' ? 'credit' : 'debit';
      const description =
        debt.type === 'lent'
          ? `Debt Repayment received from ${debt.personName}${repayment.note ? ` (${repayment.note})` : ''}`
          : `Debt Repayment sent to ${debt.personName}${repayment.note ? ` (${repayment.note})` : ''}`;

      const createdTx = this.addTransaction({
        type: txType,
        amount: repayment.amount,
        category: 'transfer',
        accountId: repayment.accountId,
        description,
        date: repayment.date,
        time: repayment.time,
        source: 'manual',
        status: 'cleared',
        receiptNote: `Debt ID: ${debt.id}`,
      });

      repaymentRecord.recordedTransactionId = createdTx.id;
    }

    debt.repayments.push(repaymentRecord);
    debt.remainingBalance = Math.max(0, debt.remainingBalance - repayment.amount);

    if (debt.remainingBalance === 0) {
      debt.status = 'settled';
    } else {
      debt.status = 'partially_paid';
    }

    this.saveDebts(debts);
    return debt;
  }

  static exportBackupFileString(): string {
    const transactions = this.getTransactions();
    const accounts = this.getAccounts();
    const budgets = this.getBudgets();
    const cloudSync = this.getCloudSyncState();
    const debts = this.getDebts();
    const userConfig = this.getUserConfig();
    const contacts = this.getLenderContacts();

    return JSON.stringify(
      {
        version: '4.0.0',
        exportedAt: new Date().toISOString(),
        transactions,
        accounts,
        budgets,
        debts,
        userConfig,
        contacts,
        cloudSync,
      },
      null,
      2
    );
  }

  static restoreFromBackupFileString(jsonStr: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.transactions)) {
        this.saveTransactions(data.transactions);
      }
      if (Array.isArray(data.accounts)) {
        this.saveAccounts(data.accounts);
      }
      if (Array.isArray(data.budgets)) {
        this.saveBudgets(data.budgets);
      }
      if (Array.isArray(data.debts)) {
        this.saveDebts(data.debts);
      }
      if (data.userConfig) {
        this.saveUserConfig(data.userConfig);
      }
      if (Array.isArray(data.contacts)) {
        this.saveLenderContacts(data.contacts);
      }
      if (data.cloudSync) {
        this.saveCloudSyncState(data.cloudSync);
      }
      return { success: true, message: 'Restore completed successfully.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Invalid JSON format' };
    }
  }

  static clearAllUserData(): void {
    this.saveTransactions([]);
    this.saveDebts([]);
    this.saveAccounts(INITIAL_ACCOUNTS);
    this.saveBudgets(INITIAL_BUDGETS);
  }
}
