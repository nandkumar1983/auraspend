/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AndroidFrame } from './components/AndroidFrame';
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar, ActiveTab } from './components/BottomNavBar';
import { AddTransactionModal } from './components/AddTransactionModal';
import { SmsParserModal } from './components/SmsParserModal';
import { LockScreen } from './components/LockScreen';
import { InstallModal } from './components/InstallModal';
import { HomeView } from './views/HomeView';
import { TransactionsView } from './views/TransactionsView';
import { BudgetsView } from './views/BudgetsView';
import { ReportsView } from './views/ReportsView';
import { CloudSyncView } from './views/CloudSyncView';
import { AccountConfigView } from './views/AccountConfigView';
import { DebtsView } from './views/DebtsView';
import { StorageService } from './services/storage';
import { BankSyncService } from './services/bankSync';
import { PhonePeSyncModal } from './components/PhonePeSyncModal';
import { BankAccount, CategoryBudget, DebtRecord, Transaction } from './types/expense';
import { CheckCircle2, AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      return StorageService.getTransactions();
    } catch {
      return [];
    }
  });
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try {
      return StorageService.getAccounts();
    } catch {
      return [];
    }
  });
  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    try {
      return StorageService.getBudgets();
    } catch {
      return [];
    }
  });
  const [debts, setDebts] = useState<DebtRecord[]>(() => {
    try {
      return StorageService.getDebts();
    } catch {
      return [];
    }
  });

  // Security Lock State - Initial is false so PIN screen is ALWAYS the FIRST screen!
  const [savedPin, setSavedPin] = useState<string>(() => localStorage.getItem('auraspend_pin_code') || '1234');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [phonePeModalConfig, setPhonePeModalConfig] = useState<{
    isOpen: boolean;
    accountId?: string;
    mode?: 'statement' | 'alert' | 'balance';
  }>({ isOpen: false });
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFrameMode, setIsFrameMode] = useState(true);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'alert' | 'info';
  } | null>(null);

  useEffect(() => {
    // Check if opened via Web Share Target (e.g. user tapped "Share receipt" in PhonePe on Android)
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const sharedText = params.get('text') || params.get('title') || params.get('url');
      if (sharedText) {
        setPhonePeModalConfig({
          isOpen: true,
          mode: 'alert',
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const showToast = (text: string, type: 'success' | 'alert' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const refreshAllData = () => {
    try {
      setTransactions(StorageService.getTransactions());
      setAccounts(StorageService.getAccounts());
      setBudgets(StorageService.getBudgets());
      setDebts(StorageService.getDebts());
    } catch (err) {
      console.warn('Error refreshing ledger data:', err);
    }
  };

  const handleAddDebt = (newDebtData: Omit<DebtRecord, 'id' | 'remainingBalance' | 'repayments' | 'createdAt'>) => {
    const created = StorageService.addDebtRecord(newDebtData);
    refreshAllData();
    showToast(
      `${created.type === 'lent' ? 'Lended ₹' : 'Borrowed ₹'}${created.initialAmount.toLocaleString('en-IN')} with ${created.personName} recorded.`,
      'success'
    );
  };

  const handleRecordRepayment = (
    debtId: string,
    repayment: {
      amount: number;
      date: string;
      time: string;
      note?: string;
      syncToLedger?: boolean;
      accountId?: string;
    }
  ) => {
    const updated = StorageService.addDebtRepayment(debtId, repayment);
    refreshAllData();
    if (updated) {
      showToast(
        `Recorded ₹${repayment.amount.toLocaleString('en-IN')} repayment for ${updated.personName}. Pending balance: ₹${updated.remainingBalance.toLocaleString('en-IN')}`,
        'success'
      );
    }
  };

  const handleDeleteDebt = (id: string) => {
    StorageService.deleteDebtRecord(id);
    refreshAllData();
    showToast('Debt record removed.', 'info');
  };

  const handleUpdatePin = (newPin: string) => {
    setSavedPin(newPin);
    localStorage.setItem('auraspend_pin_code', newPin);
    showToast('PIN successfully updated to ' + newPin, 'success');
  };

  const handleAddTransaction = (newTxData: Omit<Transaction, 'id'>) => {
    const created = StorageService.addTransaction(newTxData);
    refreshAllData();

    // Check budget alert if this was a debit
    if (created.type === 'debit') {
      const budget = budgets.find((b) => b.categoryId === created.category);
      if (budget) {
        const currentMonth = created.date.substring(0, 7);
        const allTx = StorageService.getTransactions();
        const categoryTotal = allTx
          .filter((t) => t.type === 'debit' && t.category === created.category && t.date.startsWith(currentMonth))
          .reduce((sum, t) => sum + t.amount, 0);

        if (categoryTotal >= budget.monthlyLimit) {
          showToast(
            `Budget Alert: ${budget.categoryId} exceeded monthly cap (₹${categoryTotal.toLocaleString('en-IN')} / ₹${budget.monthlyLimit.toLocaleString('en-IN')})`,
            'alert'
          );
          return;
        } else if (categoryTotal >= budget.monthlyLimit * budget.alertThreshold) {
          showToast(
            `Budget Notice: ${budget.categoryId} reached ${((categoryTotal / budget.monthlyLimit) * 100).toFixed(0)}% of limit.`,
            'info'
          );
          return;
        }
      }
    }

    showToast(
      `${created.type === 'debit' ? 'Debit' : 'Credit'} of ₹${created.amount.toLocaleString('en-IN')} recorded to ledger.`,
      'success'
    );
  };

  const handleDeleteTransaction = (id: string) => {
    StorageService.deleteTransaction(id);
    refreshAllData();
    showToast('Transaction removed from ledger.', 'info');
  };

  const handleSaveBudget = (updatedBudget: CategoryBudget) => {
    const current = StorageService.getBudgets();
    const idx = current.findIndex((b) => b.id === updatedBudget.id);
    if (idx !== -1) {
      current[idx] = updatedBudget;
    } else {
      current.push(updatedBudget);
    }
    StorageService.saveBudgets(current);
    setBudgets(current);
    showToast(`Updated monthly cap for ${updatedBudget.categoryId} to ₹${updatedBudget.monthlyLimit.toLocaleString('en-IN')}.`, 'success');
  };

  const handleTriggerBankSync = (accountId?: string, mode?: 'statement' | 'alert' | 'balance') => {
    setPhonePeModalConfig({
      isOpen: true,
      accountId,
      mode: mode || 'statement',
    });
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col font-sans select-none">
      <AndroidFrame isFrameMode={isFrameMode}>
        {/* Android Top System Status Bar */}
        <AndroidStatusBar />

        {/* If app is locked, the FIRST SCREEN IS ALWAYS THE PIN NUMBER SCREEN */}
        {!isUnlocked ? (
          <LockScreen
            savedPin={savedPin}
            onUnlock={() => {
              setIsUnlocked(true);
              showToast('Security PIN verified. Welcome to AuraSpend!', 'success');
            }}
            onResetPin={handleUpdatePin}
            onOpenInstall={() => setIsInstallModalOpen(true)}
          />
        ) : (
          <>
            {/* Material 3 App Header */}
            <TopAppBar
              isSyncing={isSyncing}
              onTriggerBankSync={handleTriggerBankSync}
              onOpenSmsParser={() => setIsSmsModalOpen(true)}
              isFrameMode={isFrameMode}
              onToggleFrameMode={() => setIsFrameMode(!isFrameMode)}
              onOpenConfig={() => setActiveTab(activeTab === 'config' ? 'home' : 'config')}
              isConfigActive={activeTab === 'config'}
              onOpenInstall={() => setIsInstallModalOpen(true)}
              onLockApp={() => setIsUnlocked(false)}
            />

            {/* Floating Notification Toast */}
            {toastMessage && (
              <div className="absolute top-14 left-4 right-4 z-50 transition-all duration-300">
                <div
                  className={`p-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-medium backdrop-blur-md ${
                    toastMessage.type === 'alert'
                      ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                      : toastMessage.type === 'info'
                      ? 'bg-slate-900/90 border-slate-700 text-slate-200'
                      : 'bg-blue-950/90 border-blue-800 text-sky-200'
                  }`}
                >
                  {toastMessage.type === 'alert' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  )}
                  <span className="truncate">{toastMessage.text}</span>
                </div>
              </div>
            )}

            {/* Tab View Container */}
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
              {activeTab === 'home' && (
                <HomeView
                  transactions={transactions}
                  accounts={accounts}
                  budgets={budgets}
                  debts={debts}
                  onNavigateToTab={setActiveTab}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  onDeleteTransaction={handleDeleteTransaction}
                  onTriggerBankSync={handleTriggerBankSync}
                  onOpenInstall={() => setIsInstallModalOpen(true)}
                  isSyncing={isSyncing}
                />
              )}

              {activeTab === 'transactions' && (
                <TransactionsView
                  transactions={transactions}
                  accounts={accounts}
                  onDeleteTransaction={handleDeleteTransaction}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                />
              )}

              {activeTab === 'debts' && (
                <DebtsView
                  debts={debts}
                  accounts={accounts}
                  onAddDebt={handleAddDebt}
                  onRecordRepayment={handleRecordRepayment}
                  onDeleteDebt={handleDeleteDebt}
                />
              )}

              {activeTab === 'budgets' && (
                <BudgetsView
                  budgets={budgets}
                  transactions={transactions}
                  onSaveBudget={handleSaveBudget}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                />
              )}

              {activeTab === 'reports' && <ReportsView />}

              {activeTab === 'sync' && (
                <CloudSyncView
                  accounts={accounts}
                  transactions={transactions}
                  onTriggerBankSync={handleTriggerBankSync}
                  isSyncing={isSyncing}
                  onRefreshData={refreshAllData}
                  onNavigateToConfig={() => setActiveTab('config')}
                />
              )}

              {activeTab === 'config' && (
                <AccountConfigView
                  accounts={accounts}
                  onAccountsUpdated={(updated) => {
                    setAccounts(updated);
                    showToast('Accounts configuration saved.', 'success');
                  }}
                  savedPin={savedPin}
                  onUpdatePin={handleUpdatePin}
                  onLockApp={() => setIsUnlocked(false)}
                  onRefreshData={refreshAllData}
                />
              )}
            </main>

            {/* Android Bottom Navigation Bar */}
            <BottomNavBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />

            {/* Modals */}
            <AddTransactionModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onAddTransaction={handleAddTransaction}
              accounts={accounts}
              budgets={budgets}
              transactions={transactions}
            />

            <SmsParserModal
              isOpen={isSmsModalOpen}
              onClose={() => setIsSmsModalOpen(false)}
              onAddTransaction={handleAddTransaction}
              accounts={accounts}
            />

            <PhonePeSyncModal
              isOpen={phonePeModalConfig.isOpen}
              onClose={() => setPhonePeModalConfig({ isOpen: false })}
              accounts={accounts}
              initialAccountId={phonePeModalConfig.accountId}
              initialMode={phonePeModalConfig.mode}
              onTransactionsImported={(count) => {
                refreshAllData();
                showToast(`Synced ${count} real transaction${count === 1 ? '' : 's'} from PhonePe.`, 'success');
              }}
              onAccountsUpdated={(updatedAccounts) => {
                setAccounts(updatedAccounts);
                refreshAllData();
                showToast('Account balances reconciled with PhonePe.', 'success');
              }}
            />
          </>
        )}

        {/* Installation & WebAPK Download Modal - Available on both Lock Screen and Dashboard */}
        <InstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
        />
      </AndroidFrame>
    </div>
  );
}
