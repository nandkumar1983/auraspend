import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Check, Calendar, Clock, Tag, FileText } from 'lucide-react';
import { BankAccount, CategoryBudget, CategoryId, Transaction, TransactionType } from '../types/expense';
import { CATEGORIES, getCurrentTimeString, getTodayString } from '../utils/formatters';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  accounts: BankAccount[];
  budgets: CategoryBudget[];
  transactions: Transaction[];
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  accounts,
  budgets,
  transactions,
}) => {
  const [type, setType] = useState<TransactionType>('debit');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<CategoryId>('groceries');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || 'hdfc-sal');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [receiptNote, setReceiptNote] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;

  // Real-time budget simulation for this category
  const budgetForCategory = budgets.find((b) => b.categoryId === category);
  const currentMonth = date.substring(0, 7);
  const currentCategorySpend = transactions
    .filter((t) => t.type === 'debit' && t.category === category && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  const newProjectedSpend = currentCategorySpend + (type === 'debit' ? numAmount : 0);
  const budgetLimit = budgetForCategory?.monthlyLimit || 0;
  const projectedPercent = budgetLimit > 0 ? (newProjectedSpend / budgetLimit) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onAddTransaction({
      type,
      amount: numAmount,
      category,
      accountId,
      description: description.trim() || (type === 'debit' ? 'Expense Entry' : 'Income Entry'),
      date,
      time,
      source: 'manual',
      status: 'cleared',
      receiptNote: receiptNote.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    // Reset and close
    setAmount('');
    setDescription('');
    setReceiptNote('');
    setTagInput('');
    onClose();
  };

  const quickAmounts = type === 'debit' ? [50, 100, 250, 500, 1000] : [500, 1000, 5000, 10000];

  const availableCategories = Object.values(CATEGORIES).filter((c) => {
    if (type === 'debit') return c.type === 'expense' || c.type === 'both';
    return c.type === 'income' || c.type === 'both';
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Record Transaction</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/20">
              ₹ INR
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* Credit vs Debit Type Selector */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('debit');
                setCategory('groceries');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-all ${
                type === 'debit'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Debit (Expense)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('credit');
                setCategory('salary');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-all ${
                type === 'credit'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Credit (Income)
            </button>
          </div>

          {/* Amount Input */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-center">
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              {type === 'debit' ? 'Debit Amount (₹)' : 'Credit Amount (₹)'}
            </label>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="1"
                min="1"
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-48 text-3xl font-extrabold text-white text-center bg-transparent focus:outline-none placeholder-slate-600 font-mono"
                required
              />
            </div>

            {/* Quick Amount Adders */}
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    const currentVal = parseFloat(amount) || 0;
                    setAmount((currentVal + q).toString());
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] transition-colors"
                >
                  +{q}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Budget Pacing Bar for Debit */}
          {type === 'debit' && budgetForCategory && (
            <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  {budgetForCategory.categoryId} monthly budget impact:
                </span>
                <span
                  className={`font-mono font-bold ${
                    projectedPercent > 100
                      ? 'text-rose-400'
                      : projectedPercent > 80
                      ? 'text-amber-400'
                      : 'text-sky-400'
                  }`}
                >
                  {projectedPercent.toFixed(0)}% used
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    projectedPercent > 100
                      ? 'bg-rose-500'
                      : projectedPercent > 80
                      ? 'bg-amber-400'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, projectedPercent)}%` }}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Description / Merchant Name
            </label>
            <input
              type="text"
              placeholder="e.g. DMart, Swiggy, Netflix, TCS Salary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
              required
            />
          </div>

          {/* Category Pill Selection */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto no-scrollbar pr-1">
              {availableCategories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate text-xs font-medium">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bank Account Selection */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Account / Payment Method
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.institution}) - ₹{acc.balance.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-slate-400" /> Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Receipt Note & Tags */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <div>
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1">
                <FileText className="w-3 h-3 text-slate-400" /> Notes / Invoice No.
              </label>
              <input
                type="text"
                placeholder="e.g. GST Bill No. 492, Split with Rahul"
                value={receiptNote}
                onChange={(e) => setReceiptNote(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1">
                <Tag className="w-3 h-3 text-slate-400" /> Tags (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. tax, business, travel"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={numAmount <= 0}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all ${
                type === 'debit'
                  ? 'bg-gradient-to-r from-rose-500 to-amber-600 text-white shadow-lg shadow-rose-900/30'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white shadow-lg shadow-blue-900/40'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Save {type === 'debit' ? 'Debit' : 'Credit'} Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
