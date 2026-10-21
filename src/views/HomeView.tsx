import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Landmark,
  CreditCard,
  PiggyBank,
  Wallet,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  HandCoins,
  Download,
  ReceiptText,
} from 'lucide-react';
import { BankAccount, CategoryBudget, DebtRecord, Transaction } from '../types/expense';
import { formatCurrency, formatDateShort, getTodayString } from '../utils/formatters';
import { TransactionItem } from '../components/TransactionItem';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HomeViewProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  budgets: CategoryBudget[];
  debts?: DebtRecord[];
  onNavigateToTab: (tab: any) => void;
  onOpenAddModal: () => void;
  onDeleteTransaction: (id: string) => void;
  onTriggerBankSync: (accountId?: string, mode?: 'statement' | 'alert' | 'balance') => void;
  onOpenInstall?: () => void;
  isSyncing: boolean;
}

const ACCOUNT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Landmark,
  CreditCard,
  PiggyBank,
  Wallet,
};

export const HomeView: React.FC<HomeViewProps> = ({
  transactions,
  accounts,
  budgets,
  debts = [],
  onNavigateToTab,
  onOpenAddModal,
  onDeleteTransaction,
  onTriggerBankSync,
  onOpenInstall,
  isSyncing,
}) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const today = getTodayString();
  const currentMonthStr = today.substring(0, 7);

  const handleBannerInstall = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') return;
    }
    if (onOpenInstall) onOpenInstall();
  };

  // Month calculations
  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonthStr));
  const monthDebits = monthTransactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthCredits = monthTransactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  // Today calculations
  const todayTransactions = transactions.filter((t) => t.date === today);
  const todayDebits = todayTransactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
  const todayCredits = todayTransactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  // Budget calculations
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const budgetSpentPercent = totalBudgetLimit > 0 ? (monthDebits / totalBudgetLimit) * 100 : 0;

  // Day of month calculations for velocity
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);
  const remainingBudget = Math.max(0, totalBudgetLimit - monthDebits);
  const recommendedDaily = remainingBudget / daysRemaining;

  // Total Liquid Net Worth across accounts
  const liquidBalance = accounts.reduce((sum, acc) => {
    if (acc.type === 'credit') return sum - acc.balance;
    return sum + acc.balance;
  }, 0);

  // Recent transactions (top 5)
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
      {/* Mobile Install Promotion Banner (if not running in installed standalone mode) */}
      {!isInstalled && onOpenInstall && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/80 via-indigo-950/60 to-slate-900 border border-blue-500/40 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-blue-900/50">
              ₹
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                Install Mobile App
                <span className="text-[9px] bg-blue-500/25 text-sky-300 font-semibold px-1.5 py-0.5 rounded border border-blue-400/30">
                  Android WebAPK
                </span>
              </h4>
              <p className="text-[10px] text-slate-400 truncate">
                {isInstallable ? '1-Tap Install Ready • Fullscreen App' : 'Add ₹ icon to home screen without browser bars'}
              </p>
            </div>
          </div>
          <button
            onClick={handleBannerInstall}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 shadow-md shadow-blue-900/50 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        </div>
      )}

      {/* Real-time Spend Velocity & Budget Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-4 shadow-xl">
        {/* Subtle sapphire glow for Vivo flagship feel */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">Total Liquid Balance</span>
          <button
            onClick={() => onTriggerBankSync(undefined, 'balance')}
            className="text-[10px] text-purple-300 hover:text-purple-200 bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/40 px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            title="Reconcile liquid balances with PhonePe app"
          >
            <span className="w-3 h-3 rounded bg-[#5f259f] text-[7px] text-white flex items-center justify-center font-bold">पे</span>
            <span>PhonePe Reconcile</span>
          </button>
        </div>

        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-extrabold text-white font-mono tracking-tight">
            {formatCurrency(liquidBalance)}
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {accounts.length} Accounts Connected
          </span>
        </div>

        {/* Real-time Monthly Budget Tracker Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              Monthly Budget Progress
              {budgetSpentPercent > 80 && (
                <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                  <AlertCircle className="w-3 h-3" />
                  {budgetSpentPercent > 100 ? 'Over Limit' : 'Caution'}
                </span>
              )}
            </span>
            <span className="font-mono text-slate-300 tabular-nums text-xs">
              ₹{monthDebits.toLocaleString('en-IN')} / ₹{totalBudgetLimit.toLocaleString('en-IN')} ({budgetSpentPercent.toFixed(0)}%)
            </span>
          </div>

          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetSpentPercent > 100
                  ? 'bg-rose-500'
                  : budgetSpentPercent > 80
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400'
              }`}
              style={{ width: `${Math.min(100, budgetSpentPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>
              Safe daily burn:{' '}
              <strong className="text-sky-400 font-mono font-bold">
                ₹{recommendedDaily.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/day
              </strong>
            </span>
            <span>{daysRemaining} days left</span>
          </div>
        </div>
      </div>

      {/* Today's Cash Flow Pills */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-slate-400 block truncate">Today's Debits</span>
            <span className="text-sm font-bold text-white font-mono tabular-nums">
              {formatCurrency(todayDebits)}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-slate-400 block truncate">Today's Credits</span>
            <span className="text-sm font-bold text-sky-400 font-mono tabular-nums">
              {formatCurrency(todayCredits)}
            </span>
          </div>
        </div>
      </div>

      {/* Lended vs Borrowed Pending Balances Quick Card */}
      {debts.length > 0 && (() => {
        const lentPending = debts
          .filter((d) => d.type === 'lent' && d.status !== 'settled')
          .reduce((sum, d) => sum + d.remainingBalance, 0);
        const borrowedPending = debts
          .filter((d) => d.type === 'borrowed' && d.status !== 'settled')
          .reduce((sum, d) => sum + d.remainingBalance, 0);

        return (
          <div
            onClick={() => onNavigateToTab('debts')}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 border border-blue-900/40 cursor-pointer hover:border-blue-700/60 transition-all shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <HandCoins className="w-3.5 h-3.5 text-blue-400" />
                <span>Pending Money Debts</span>
              </div>
              <span className="text-[10px] text-sky-400 flex items-center gap-0.5 font-medium">
                View All Debts <ChevronRight className="w-3 h-3" />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-sky-900/30">
                <span className="text-[10px] text-slate-400 block">Lended to Others</span>
                <span className="text-xs font-bold text-sky-400 font-mono">
                  {formatCurrency(lentPending)}
                </span>
                <span className="text-[9px] text-slate-500 block">pending to receive</span>
              </div>

              <div className="p-2 rounded-xl bg-slate-950/60 border border-amber-900/30">
                <span className="text-[10px] text-slate-400 block">Borrowed from Others</span>
                <span className="text-xs font-bold text-amber-400 font-mono">
                  {formatCurrency(borrowedPending)}
                </span>
                <span className="text-[9px] text-slate-500 block">pending to pay</span>
              </div>
            </div>
          </div>
        );
      })()}


      {/* Connected Accounts Carousel */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-200">Connected Indian Bank Accounts</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToTab('config')}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5"
            >
              Configure <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => onNavigateToTab('sync')}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
            >
              Sync Feeds <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {accounts.map((acc) => {
            const Icon = ACCOUNT_ICONS[acc.iconName || 'Landmark'] || Landmark;
            const isNegative = acc.type === 'credit';
            return (
              <div
                key={acc.id}
                className="w-44 shrink-0 rounded-2xl bg-slate-900/90 border border-slate-800 p-3 flex flex-col justify-between space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{acc.accountNumber}</span>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{acc.name}</h4>
                  <span className="text-[10px] text-slate-500 block">{acc.institution}</span>
                </div>

                <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    {isNegative ? 'Outstanding' : 'Balance'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-mono text-xs font-bold ${
                        isNegative ? 'text-amber-400' : 'text-slate-100'
                      }`}
                    >
                      {formatCurrency(acc.balance)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerBankSync(acc.id, 'balance');
                      }}
                      className="px-1.5 py-0.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-[10px] flex items-center gap-1 active:scale-95 transition-all"
                      title={`Sync ${acc.name} balance with PhonePe`}
                    >
                      <span className="w-2.5 h-2.5 rounded bg-[#5f259f] text-white flex items-center justify-center text-[7px] font-bold">
                        पे
                      </span>
                      <span>Sync</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Bar for Bank Sync & SMS */}
      <div className="flex gap-2">
        <button
          onClick={() => onTriggerBankSync(undefined, 'statement')}
          className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-950/60 to-slate-900 hover:from-purple-900/60 hover:to-slate-850 border border-purple-500/30 text-xs font-semibold text-purple-200 flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-98"
        >
          <div className="w-5 h-5 rounded-lg bg-[#5f259f] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
            पे
          </div>
          <span>PhonePe UPI Sync</span>
        </button>

        <button
          onClick={onOpenAddModal}
          className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-transform active:scale-95"
        >
          <span>+ Add Entry</span>
        </button>
      </div>

      {/* Recent Transactions Feed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-200">Recent Transactions</h3>
          <button
            onClick={() => onNavigateToTab('transactions')}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
          >
            Full Ledger ({transactions.length}) <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2.5">
            <ReceiptText className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">Clean Production Ledger</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              No transactions recorded yet. Tap "+ Add Entry" or configure your accounts to begin.
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-1 px-3.5 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-sky-200 text-xs font-bold transition-all"
            >
              Add First Transaction
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const acc = accounts.find((a) => a.id === tx.accountId);
              return (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  account={acc}
                  onDelete={onDeleteTransaction}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
