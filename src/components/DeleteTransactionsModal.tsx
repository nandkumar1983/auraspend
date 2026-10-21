import React, { useState, useMemo } from 'react';
import {
  X,
  Trash2,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { BankAccount, Transaction } from '../types/expense';
import { formatCurrency, getTodayString } from '../utils/formatters';

interface DeleteTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts: BankAccount[];
  onDeleteRange: (startDate: string, endDate: string) => void;
  onDeleteAll: () => void;
}

export const DeleteTransactionsModal: React.FC<DeleteTransactionsModalProps> = ({
  isOpen,
  onClose,
  transactions,
  accounts,
  onDeleteRange,
  onDeleteAll,
}) => {
  const [activeTab, setActiveTab] = useState<'range' | 'all'>('range');

  // Date range state
  const today = getTodayString();
  const currentMonthStart = `${today.substring(0, 7)}-01`;
  const [startDate, setStartDate] = useState(currentMonthStart);
  const [endDate, setEndDate] = useState(today);

  // Safety confirmation states
  const [isConfirmingRange, setIsConfirmingRange] = useState(false);
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);
  const [confirmAllCheckbox, setConfirmAllCheckbox] = useState(false);

  // Range matching transactions
  const matchingTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  const rangeDebits = matchingTransactions
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0);

  const rangeCredits = matchingTransactions
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0);

  // Total ledger stats for "Delete All"
  const allDebits = transactions
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0);

  const allCredits = transactions
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0);

  if (!isOpen) return null;

  // Preset Date Helpers
  const applyPreset = (preset: 'today' | '7days' | 'thisMonth' | 'lastMonth' | 'older30') => {
    const now = new Date();
    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === '7days') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(past7.toISOString().slice(0, 10));
      setEndDate(today);
    } else if (preset === 'thisMonth') {
      setStartDate(currentMonthStart);
      setEndDate(today);
    } else if (preset === 'lastMonth') {
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(prevMonthDate.toISOString().slice(0, 10));
      setEndDate(prevMonthEnd.toISOString().slice(0, 10));
    } else if (preset === 'older30') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate('2020-01-01');
      setEndDate(past30.toISOString().slice(0, 10));
    }
    setIsConfirmingRange(false);
  };

  const handleExecuteRangeDelete = () => {
    onDeleteRange(startDate, endDate);
    setIsConfirmingRange(false);
    onClose();
  };

  const handleExecuteDeleteAll = () => {
    onDeleteAll();
    setIsConfirmingAll(false);
    setConfirmAllCheckbox(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                Delete Transactions
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                  {transactions.length} Total
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                Purge selected date range or clear entire ledger
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => {
                setActiveTab('range');
                setIsConfirmingAll(false);
              }}
              className={`py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'range'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Delete by Date Range</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('all');
                setIsConfirmingRange(false);
              }}
              className={`py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Delete All Transactions</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 text-xs overflow-y-auto">
          {/* TAB 1: DATE RANGE DELETION */}
          {activeTab === 'range' && (
            <div className="space-y-3.5">
              {/* Presets */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Quick Date Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('today')}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:text-white hover:border-blue-500/40"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('7days')}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:text-white hover:border-blue-500/40"
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('thisMonth')}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:text-white hover:border-blue-500/40"
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('lastMonth')}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:text-white hover:border-blue-500/40"
                  >
                    Last Month
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('older30')}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:text-white hover:border-blue-500/40"
                  >
                    Older than 30 Days
                  </button>
                </div>
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-medium">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setIsConfirmingRange(false);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-medium">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setIsConfirmingRange(false);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Range Preview Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Matching Transactions:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {matchingTransactions.length} items
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800/80 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/30 border border-rose-900/30">
                    <span className="text-[10px] text-rose-400">Debits to remove:</span>
                    <span className="text-rose-300 font-bold">-{formatCurrency(rangeDebits)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-sky-950/30 border border-sky-900/30">
                    <span className="text-[10px] text-sky-400">Credits to remove:</span>
                    <span className="text-sky-300 font-bold">+{formatCurrency(rangeCredits)}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 pt-1">
                  Note: Account balances will be automatically recalculated to revert these transactions.
                </p>
              </div>

              {/* Confirmation Step */}
              {isConfirmingRange ? (
                <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 space-y-3">
                  <div className="flex items-center gap-2 text-rose-200 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Confirm Range Deletion</span>
                  </div>
                  <p className="text-[11px] text-rose-200/90">
                    Are you sure you want to delete all <strong className="text-white">{matchingTransactions.length} transactions</strong> between {startDate} and {endDate}?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingRange(false)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteRangeDelete}
                      className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/80 flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm & Delete</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={matchingTransactions.length === 0}
                  onClick={() => setIsConfirmingRange(true)}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/60 transition-transform active:scale-98 flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    Delete {matchingTransactions.length} Transactions in Range ({startDate} &rarr; {endDate})
                  </span>
                </button>
              )}
            </div>
          )}

          {/* TAB 2: DELETE ALL TRANSACTIONS WITH WARNING */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              {/* Critical Warning Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/80 via-red-950/50 to-slate-900 border border-rose-500/50 space-y-3 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/80">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Warning: High-Risk Action</h3>
                    <p className="text-[11px] text-rose-200/90 mt-0.5 leading-relaxed">
                      You are about to permanently delete <strong>ALL {transactions.length} transactions</strong> currently recorded in your AuraSpend ledger.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-900/40 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Total Transactions to Erase:</span>
                    <strong className="text-white font-mono">{transactions.length} entries</strong>
                  </div>
                  <div className="flex items-center justify-between text-rose-300 font-mono">
                    <span>Total Debits to Revert:</span>
                    <strong>-{formatCurrency(allDebits)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-sky-300 font-mono">
                    <span>Total Credits to Revert:</span>
                    <strong>+{formatCurrency(allCredits)}</strong>
                  </div>
                </div>

                <div className="text-[10px] text-rose-300/80 space-y-1">
                  <p>• All ledger records will be removed from local storage and cloud snapshots.</p>
                  <p>• Bank account balances will be adjusted to reverse all cleared transactions.</p>
                  <p>• <strong>This action is irreversible and cannot be recovered.</strong></p>
                </div>
              </div>

              {/* Safety Confirmation Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmAllCheckbox}
                  onChange={(e) => setConfirmAllCheckbox(e.target.checked)}
                  className="mt-0.5 rounded accent-rose-600 w-4 h-4 cursor-pointer"
                />
                <span className="text-[11px] text-slate-300 leading-snug">
                  I understand that this will permanently erase all <strong className="text-white">{transactions.length} transactions</strong> and cannot be undone.
                </span>
              </label>

              {/* Delete All Action Button */}
              <button
                type="button"
                disabled={!confirmAllCheckbox || transactions.length === 0}
                onClick={handleExecuteDeleteAll}
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-xl shadow-rose-950/90 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                <span>Permanently Delete All {transactions.length} Transactions</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            AuraSpend Data Protection • Safe Ledger Management
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
