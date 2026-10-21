import React, { useState, useMemo } from 'react';
import { Search, Download, Filter, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { BankAccount, Transaction, TransactionType } from '../types/expense';
import { TransactionItem } from '../components/TransactionItem';
import { formatCurrency, formatDateFull } from '../utils/formatters';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  onDeleteTransaction: (id: string) => void;
  onOpenAddModal: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  onDeleteTransaction,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');

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

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 no-scrollbar">
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

      {/* Filter Tabs & Export */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              typeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setTypeFilter('debit')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              typeFilter === 'debit'
                ? 'bg-rose-500/20 text-rose-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Debits
          </button>
          <button
            onClick={() => setTypeFilter('credit')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              typeFilter === 'credit'
                ? 'bg-blue-600/20 text-blue-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Credits
          </button>
        </div>

        <button
          onClick={handleExportCSV}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs shrink-0"
          title="Export CSV"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden xs:inline">CSV</span>
        </button>
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
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
