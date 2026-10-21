import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  Calendar,
  X,
  Check,
} from 'lucide-react';
import { BankAccount, Transaction, TransactionType } from '../types/expense';
import { TransactionItem } from '../components/TransactionItem';
import { DeleteTransactionsModal } from '../components/DeleteTransactionsModal';
import { formatCurrency, formatDateFull } from '../utils/formatters';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  onDeleteTransaction: (id: string) => void;
  onDeleteMultipleTransactions?: (ids: string[]) => void;
  onDeleteRangeTransactions?: (startDate: string, endDate: string) => void;
  onDeleteAllTransactions?: () => void;
  onOpenAddModal: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  onDeleteTransaction,
  onDeleteMultipleTransactions,
  onDeleteRangeTransactions,
  onDeleteAllTransactions,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');

  // Multi-selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [isConfirmingSelectedDelete, setIsConfirmingSelectedDelete] = useState(false);

  // Range and All Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (accountFilter !== 'all' && tx.accountId !== accountFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(q);
        const matchesCategory = tx.category.toLowerCase().includes(q);
        const matchesRef = tx.bankReference?.toLowerCase().includes(q);
        const matchesTags = tx.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesDesc && !matchesCategory && !matchesRef && !matchesTags) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, accountFilter, searchQuery]);

  // Group transactions by date
  const groupedByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((tx) => {
      if (!map[tx.date]) map[tx.date] = [];
      map[tx.date].push(tx);
    });
    return Object.entries(map).sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
  }, [filteredTransactions]);

  // Export to CSV function
  const handleExportCSV = () => {
    const headers = ['ID', 'Type', 'Amount (INR)', 'Category', 'Account', 'Description', 'Date', 'Time', 'Source', 'Reference'];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.type,
      tx.amount,
      tx.category,
      tx.accountId,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.date,
      tx.time || '',
      tx.source,
      tx.bankReference || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `auraspend_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalDebits = filteredTransactions
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0);
  const totalCredits = filteredTransactions
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0);

  // Multi-selection handlers
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedTxIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTxIds(next);
  };

  const handleSelectAllFiltered = () => {
    if (selectedTxIds.size === filteredTransactions.length && filteredTransactions.length > 0) {
      setSelectedTxIds(new Set());
    } else {
      const all = new Set<string>();
      filteredTransactions.forEach((t) => all.add(t.id));
      setSelectedTxIds(all);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTxIds.size === 0) return;
    if (onDeleteMultipleTransactions) {
      onDeleteMultipleTransactions(Array.from(selectedTxIds));
    } else {
      selectedTxIds.forEach((id) => onDeleteTransaction(id));
    }
    setSelectedTxIds(new Set());
    setIsConfirmingSelectedDelete(false);
    setIsSelectionMode(false);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 no-scrollbar relative pb-16">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search merchant, tag, or bank ref..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Tabs & Management Buttons */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              typeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setTypeFilter('debit')}
            className={`px-2 py-1 rounded-lg font-medium transition-all ${
              typeFilter === 'debit'
                ? 'bg-rose-500/20 text-rose-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Debits
          </button>
          <button
            onClick={() => setTypeFilter('credit')}
            className={`px-2 py-1 rounded-lg font-medium transition-all ${
              typeFilter === 'credit'
                ? 'bg-blue-600/20 text-blue-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Credits
          </button>
        </div>

        {/* Action Controls: Multi-Select, Range/All Delete, CSV Export */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) {
                setSelectedTxIds(new Set());
                setIsConfirmingSelectedDelete(false);
              }
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
              isSelectionMode
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Multi-select transactions"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{isSelectionMode ? 'Cancel' : 'Select'}</span>
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 hover:text-rose-200 transition-colors flex items-center gap-1 text-xs"
            title="Delete Selected Range or All Transactions"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden xs:inline">Delete</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden xs:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Account Filter & Subtotal Summary */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">All Accounts ({accounts.length})</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-rose-400">-{formatCurrency(totalDebits)}</span>
          <span>/</span>
          <span className="text-sky-400">+{formatCurrency(totalCredits)}</span>
        </div>
      </div>

      {/* Grouped Ledger Feed */}
      {groupedByDate.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs space-y-2">
          <p>No transactions match your search filter.</p>
          <button
            onClick={onOpenAddModal}
            className="text-blue-400 font-medium hover:underline"
          >
            Add a new entry now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([date, items]) => {
            const dayDebits = items
              .filter((t) => t.type === 'debit')
              .reduce((s, t) => s + t.amount, 0);
            const dayCredits = items
              .filter((t) => t.type === 'credit')
              .reduce((s, t) => s + t.amount, 0);

            return (
              <div key={date} className="space-y-2">
                {/* Date Header Pill */}
                <div className="flex items-center justify-between px-1 text-[11px]">
                  <span className="font-semibold text-slate-300">{formatDateFull(date)}</span>
                  <div className="font-mono text-[10px] text-slate-500 flex gap-2">
                    {dayDebits > 0 && <span className="text-rose-400/80">-{formatCurrency(dayDebits)}</span>}
                    {dayCredits > 0 && <span className="text-sky-400/80">+{formatCurrency(dayCredits)}</span>}
                  </div>
                </div>

                {/* Items in that day */}
                <div className="space-y-1.5">
                  {items.map((tx) => {
                    const acc = accounts.find((a) => a.id === tx.accountId);
                    return (
                      <TransactionItem
                        key={tx.id}
                        transaction={tx}
                        account={acc}
                        onDelete={onDeleteTransaction}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedTxIds.has(tx.id)}
                        onToggleSelect={handleToggleSelect}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-Select Floating Action Bar */}
      {isSelectionMode && (
        <div className="fixed bottom-16 left-4 right-4 z-40 max-w-md mx-auto transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="p-3 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-sky-400 hover:text-sky-300 font-semibold underline text-xs"
              >
                {selectedTxIds.size === filteredTransactions.length && filteredTransactions.length > 0
                  ? 'Deselect All'
                  : `Select All (${filteredTransactions.length})`}
              </button>
              <span className="text-slate-400 font-mono text-[11px]">
                ({selectedTxIds.size} selected)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {isConfirmingSelectedDelete ? (
                <div className="flex items-center gap-1 bg-rose-950/80 p-1 rounded-xl border border-rose-600">
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    Confirm Delete ({selectedTxIds.size})
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingSelectedDelete(false)}
                    className="px-2 py-1 text-slate-300 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={selectedTxIds.size === 0}
                  onClick={() => setIsConfirmingSelectedDelete(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/60 disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete ({selectedTxIds.size})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedTxIds(new Set());
                  setIsConfirmingSelectedDelete(false);
                }}
                className="w-7 h-7 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Transactions Range / All Modal */}
      <DeleteTransactionsModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        transactions={transactions}
        accounts={accounts}
        onDeleteRange={(start, end) => {
          if (onDeleteRangeTransactions) {
            onDeleteRangeTransactions(start, end);
          }
        }}
        onDeleteAll={() => {
          if (onDeleteAllTransactions) {
            onDeleteAllTransactions();
          }
        }}
      />
    </div>
  );
};
