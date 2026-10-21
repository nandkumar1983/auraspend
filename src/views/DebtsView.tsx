import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Phone,
  Calendar,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgeAlert,
  Wallet,
  X,
  CreditCard,
} from 'lucide-react';
import { BankAccount, DebtRecord, DebtType } from '../types/expense';
import { formatCurrency, getTodayString } from '../utils/formatters';

interface DebtsViewProps {
  debts: DebtRecord[];
  accounts: BankAccount[];
  onAddDebt: (debt: Omit<DebtRecord, 'id' | 'remainingBalance' | 'repayments' | 'createdAt'>) => void;
  onRecordRepayment: (
    debtId: string,
    repayment: {
      amount: number;
      date: string;
      time: string;
      note?: string;
      syncToLedger?: boolean;
      accountId?: string;
    }
  ) => void;
  onDeleteDebt: (debtId: string) => void;
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  debts,
  accounts,
  onAddDebt,
  onRecordRepayment,
  onDeleteDebt,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'lent' | 'borrowed'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'settled'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  // New Debt Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newType, setNewType] = useState<DebtType>('lent');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(getTodayString());
  const [newDueDate, setNewDueDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newAccountId, setNewAccountId] = useState(accounts[0]?.id || '');

  // Repayment Modal State
  const [repayingDebt, setRepayingDebt] = useState<DebtRecord | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentDate, setRepaymentDate] = useState(getTodayString());
  const [repaymentNote, setRepaymentNote] = useState('');
  const [repaySyncToLedger, setRepaySyncToLedger] = useState(true);
  const [repaymentAccountId, setRepaymentAccountId] = useState(accounts[0]?.id || '');

  // Aggregations
  const summary = useMemo(() => {
    let totalLendedPending = 0;
    let totalLendedInitial = 0;
    let totalBorrowedPending = 0;
    let totalBorrowedInitial = 0;

    debts.forEach((d) => {
      if (d.type === 'lent') {
        totalLendedInitial += d.initialAmount;
        totalLendedPending += d.remainingBalance;
      } else {
        totalBorrowedInitial += d.initialAmount;
        totalBorrowedPending += d.remainingBalance;
      }
    });

    const netOwed = totalLendedPending - totalBorrowedPending;

    return {
      totalLendedPending,
      totalLendedInitial,
      totalBorrowedPending,
      totalBorrowedInitial,
      netOwed,
    };
  }, [debts]);

  // Filtering
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      // Type filter
      if (filterType !== 'all' && d.type !== filterType) return false;

      // Status filter
      if (filterStatus === 'pending') {
        if (d.status === 'settled') return false;
      } else if (filterStatus === 'settled') {
        if (d.status !== 'settled') return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = d.personName.toLowerCase().includes(q);
        const matchPhone = d.contactPhone?.toLowerCase().includes(q);
        const matchNotes = d.notes?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchNotes) return false;
      }

      return true;
    });
  }, [debts, filterType, filterStatus, searchQuery]);

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newAmount);
    if (!newPersonName.trim() || isNaN(amountNum) || amountNum <= 0) return;

    onAddDebt({
      personName: newPersonName.trim(),
      contactPhone: newPhone.trim() || undefined,
      type: newType,
      initialAmount: amountNum,
      date: newDate || getTodayString(),
      dueDate: newDueDate || undefined,
      status: 'pending',
      notes: newNotes.trim() || undefined,
      accountId: newAccountId || undefined,
    });

    // Reset & close
    setNewPersonName('');
    setNewPhone('');
    setNewAmount('');
    setNewDueDate('');
    setNewNotes('');
    setIsAddModalOpen(false);
  };

  const handleSubmitRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayingDebt) return;
    const amountNum = parseFloat(repaymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onRecordRepayment(repayingDebt.id, {
      amount: Math.min(amountNum, repayingDebt.remainingBalance),
      date: repaymentDate || getTodayString(),
      time: timeStr,
      note: repaymentNote.trim() || undefined,
      syncToLedger: repaySyncToLedger,
      accountId: repaymentAccountId,
    });

    setRepayingDebt(null);
    setRepaymentAmount('');
    setRepaymentNote('');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
      {/* Top Banner: Lended vs Borrowed Pending Balances */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-4 shadow-xl">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <HandCoins className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Money Lended & Borrowed</h2>
              <p className="text-[10px] text-slate-400">Track person-wise pending balance & repayments</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/30 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Entry</span>
          </button>
        </div>

        {/* 2-Column High-Contrast Metrics */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* LENDED (I will receive) */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-sky-800/40">
            <div className="flex items-center justify-between text-[10px] text-sky-400 mb-1">
              <span className="font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-sky-400" />
                Lended (To Collect)
              </span>
            </div>
            <div className="text-base font-bold text-white font-mono tracking-tight">
              {formatCurrency(summary.totalLendedPending)}
            </div>
            <div className="text-[9px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Pending from others</span>
              <span>Total: {formatCurrency(summary.totalLendedInitial)}</span>
            </div>
          </div>

          {/* BORROWED (I need to pay) */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-amber-800/40">
            <div className="flex items-center justify-between text-[10px] text-amber-400 mb-1">
              <span className="font-semibold flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400" />
                Borrowed (To Pay)
              </span>
            </div>
            <div className="text-base font-bold text-amber-300 font-mono tracking-tight">
              {formatCurrency(summary.totalBorrowedPending)}
            </div>
            <div className="text-[9px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Pending to return</span>
              <span>Total: {formatCurrency(summary.totalBorrowedInitial)}</span>
            </div>
          </div>
        </div>

        {/* Net Status Indicator */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Net Credit Position:</span>
          <span
            className={`font-mono font-bold ${
              summary.netOwed >= 0 ? 'text-sky-400' : 'text-rose-400'
            }`}
          >
            {summary.netOwed >= 0 ? `+${formatCurrency(summary.netOwed)} (You are owed)` : `${formatCurrency(summary.netOwed)} (You owe)`}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-2">
        <div className="flex gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Debts
          </button>
          <button
            onClick={() => setFilterType('lent')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'lent'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lended (Out)
          </button>
          <button
            onClick={() => setFilterType('borrowed')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'borrowed'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Borrowed (In)
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search person name, phone, notes..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Pending vs Settled Toggle */}
          <div className="flex bg-slate-900/90 border border-slate-800 p-0.5 rounded-xl shrink-0">
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                filterStatus === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('settled')}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                filterStatus === 'settled'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Settled
            </button>
          </div>
        </div>
      </div>

      {/* List of Persons & Debts */}
      <div className="space-y-2.5">
        {filteredDebts.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto">
              <HandCoins className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300">No matching debt records found</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {searchQuery
                  ? 'Try a different search query or clear the filter.'
                  : 'Add money you have lended to friends or borrowed from others.'}
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-md shadow-blue-900/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Debt Record</span>
            </button>
          </div>
        ) : (
          filteredDebts.map((debt) => {
            const isLent = debt.type === 'lent';
            const isSettled = debt.status === 'settled';
            const isExpanded = expandedDebtId === debt.id;
            const repaymentProgress =
              debt.initialAmount > 0
                ? ((debt.initialAmount - debt.remainingBalance) / debt.initialAmount) * 100
                : 100;

            return (
              <div
                key={debt.id}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm hover:border-slate-700 transition-all"
              >
                {/* Main Row */}
                <div className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar / Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                          isLent
                            ? 'bg-blue-600/20 text-sky-400 border border-blue-500/30'
                            : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {isLent ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white truncate">
                            {debt.personName}
                          </h4>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
                              isLent
                                ? 'bg-blue-950/60 text-sky-300 border-blue-800/60'
                                : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                            }`}
                          >
                            {isLent ? 'Lended to them' : 'Borrowed from them'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {debt.date}
                          </span>
                          {debt.contactPhone && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {debt.contactPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pending Balance Column */}
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-400">
                        {isSettled ? 'Settled' : 'Pending Balance'}
                      </div>
                      <div
                        className={`font-mono text-sm font-bold tracking-tight ${
                          isSettled
                            ? 'text-slate-500 line-through'
                            : isLent
                            ? 'text-sky-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {formatCurrency(debt.remainingBalance)}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        Initial: {formatCurrency(debt.initialAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Notes / Due Date */}
                  {(debt.notes || debt.dueDate) && (
                    <div className="flex items-center justify-between gap-2 text-[10px] bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 text-slate-300">
                      {debt.notes ? (
                        <span className="truncate italic">"{debt.notes}"</span>
                      ) : (
                        <span className="text-slate-500">No notes</span>
                      )}
                      {debt.dueDate && (
                        <span className="shrink-0 text-amber-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" /> Due {debt.dueDate}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Repayment Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>Repaid: {formatCurrency(debt.initialAmount - debt.remainingBalance)}</span>
                      <span className="font-mono">{repaymentProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isSettled
                            ? 'bg-slate-500'
                            : isLent
                            ? 'bg-gradient-to-r from-blue-500 to-sky-400'
                            : 'bg-gradient-to-r from-amber-500 to-orange-400'
                        }`}
                        style={{ width: `${repaymentProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <button
                      onClick={() =>
                        setExpandedDebtId(isExpanded ? null : debt.id)
                      }
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium"
                    >
                      {debt.repayments.length} Repayments
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDeleteDebt(debt.id)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {!isSettled && (
                        <button
                          onClick={() => {
                            setRepayingDebt(debt);
                            setRepaymentAmount(debt.remainingBalance.toString());
                          }}
                          className={`py-1.5 px-3 rounded-xl font-bold text-[11px] flex items-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                            isLent
                              ? 'bg-blue-600 hover:bg-blue-500 text-white'
                              : 'bg-amber-600 hover:bg-amber-500 text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isLent ? 'Record Received' : 'Record Payment'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Repayment History */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/80 p-3 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Repayment History Log
                    </span>

                    {debt.repayments.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic py-1">
                        No repayments recorded yet for this transaction.
                      </p>
                    ) : (
                      debt.repayments.map((rep) => (
                        <div
                          key={rep.id}
                          className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900 border border-slate-800/80"
                        >
                          <div>
                            <div className="font-bold text-white font-mono">
                              {formatCurrency(rep.amount)}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                              <span>
                                {rep.date} • {rep.time}
                              </span>
                              {rep.note && <span className="italic">({rep.note})</span>}
                            </div>
                          </div>
                          <span className="text-[10px] text-sky-400 bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-800/50">
                            Recorded
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Debt Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                  ₹
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Add Debt / Loan Record</h3>
                  <p className="text-[10px] text-slate-400">Track money lended or borrowed</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="p-5 space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewType('lent')}
                  className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                    newType === 'lent'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>I Lended Money (They owe me)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('borrowed')}
                  className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                    newType === 'borrowed'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>I Borrowed Money (I owe them)</span>
                </button>
              </div>

              {/* Person Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Person / Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma, Priya Patel, Rohit"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Amount & Phone */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 98..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Date & Due Date */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Bank Account Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Linked Bank Account
                </label>
                <select
                  value={newAccountId}
                  onChange={(e) => setNewAccountId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.institution} - {acc.name} ({acc.accountNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Purpose / Notes
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Festival travel advance, emergency bike repairs..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-900/40 hover:opacity-95 transition-all"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Repayment Modal */}
      {repayingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                    repayingDebt.type === 'lent'
                      ? 'bg-blue-600/20 text-sky-400'
                      : 'bg-amber-600/20 text-amber-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {repayingDebt.type === 'lent' ? 'Record Money Received' : 'Record Money Paid'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Contact: <strong className="text-white">{repayingDebt.personName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRepayingDebt(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRepayment} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Current Pending Balance</span>
                  <span className="text-base font-bold text-sky-400 font-mono">
                    {formatCurrency(repayingDebt.remainingBalance)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRepaymentAmount(repayingDebt.remainingBalance.toString())}
                  className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-sky-300 border border-blue-500/30 text-[10px] font-bold"
                >
                  Settle Full Amount
                </button>
              </div>

              {/* Repayment Amount */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Repayment Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={repayingDebt.remainingBalance}
                  required
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Repayment Date */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={repaymentDate}
                  onChange={(e) => setRepaymentDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Note / Mode */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Payment Note / Mode (e.g. PhonePe, GPay, Cash)
                </label>
                <input
                  type="text"
                  value={repaymentNote}
                  onChange={(e) => setRepaymentNote(e.target.value)}
                  placeholder="e.g. GPay UPI transfer, Cash received"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Auto Sync to Bank Ledger Option */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={repaySyncToLedger}
                    onChange={(e) => setRepaySyncToLedger(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span className="text-[11px] font-semibold text-slate-200">
                    Also record this into bank transaction ledger
                  </span>
                </label>

                {repaySyncToLedger && (
                  <div className="pt-1">
                    <span className="block text-[10px] text-slate-400 mb-1">Select Bank Account:</span>
                    <select
                      value={repaymentAccountId}
                      onChange={(e) => setRepaymentAccountId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.institution} - {acc.name} ({formatCurrency(acc.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRepayingDebt(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-900/40 hover:opacity-95 transition-all"
                >
                  Confirm Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
