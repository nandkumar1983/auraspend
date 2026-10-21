import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  SlidersHorizontal,
  PlusCircle,
  TrendingUp,
  Info,
} from 'lucide-react';
import { CategoryBudget, Transaction } from '../types/expense';
import { CATEGORIES, formatCurrency, getTodayString } from '../utils/formatters';
import { BudgetEditModal } from '../components/BudgetEditModal';

interface BudgetsViewProps {
  budgets: CategoryBudget[];
  transactions: Transaction[];
  onSaveBudget: (budget: CategoryBudget) => void;
  onOpenAddModal: () => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  transactions,
  onSaveBudget,
  onOpenAddModal,
}) => {
  const [editingBudget, setEditingBudget] = useState<CategoryBudget | null>(null);

  const today = getTodayString();
  const currentMonth = today.substring(0, 7);

  // Month stats
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);

  // Aggregate debits by category for current month
  const categorySpendMap: Record<string, number> = {};
  let totalDebitSpent = 0;

  transactions
    .filter((t) => t.type === 'debit' && t.date.startsWith(currentMonth))
    .forEach((t) => {
      categorySpendMap[t.category] = (categorySpendMap[t.category] || 0) + t.amount;
      totalDebitSpent += t.amount;
    });

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalRemaining = Math.max(0, totalBudgetLimit - totalDebitSpent);
  const overallPercentage = totalBudgetLimit > 0 ? (totalDebitSpent / totalBudgetLimit) * 100 : 0;

  // Projected spend at current velocity
  const dailyPace = totalDebitSpent / currentDay;
  const projectedTotalSpend = dailyPace * daysInMonth;
  const isPacingOverBudget = projectedTotalSpend > totalBudgetLimit;

  // Flag categories that exceeded or are close to limit
  const overBudgetCategories = budgets.filter((b) => {
    const spent = categorySpendMap[b.categoryId] || 0;
    return spent >= b.monthlyLimit;
  });

  const warningCategories = budgets.filter((b) => {
    const spent = categorySpendMap[b.categoryId] || 0;
    return spent >= b.monthlyLimit * b.alertThreshold && spent < b.monthlyLimit;
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
      {/* Month High-Level Pacing Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-200">Monthly Budget Pacing</span>
          <span className="font-mono text-sky-400">{daysRemaining} days remaining</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-950/70 rounded-2xl border border-slate-800/80">
          <div>
            <span className="text-[10px] text-slate-500 block">Total Cap</span>
            <span className="text-sm font-extrabold text-white font-mono">
              ₹{totalBudgetLimit.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Spent So Far</span>
            <span className="text-sm font-extrabold text-slate-200 font-mono">
              ₹{totalDebitSpent.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Remaining</span>
            <span className="text-sm font-extrabold text-sky-400 font-mono">
              ₹{totalRemaining.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Big Pacing Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Overall Spend Utilization</span>
            <span className="font-mono text-slate-200">{overallPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercentage > 100
                  ? 'bg-rose-500'
                  : overallPercentage > 85
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400'
              }`}
              style={{ width: `${Math.min(100, overallPercentage)}%` }}
            />
          </div>
        </div>

        {/* Burn Rate Forecast */}
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800 text-slate-300">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            Projected End-of-Month:
          </span>
          <span
            className={`font-mono font-semibold ${
              isPacingOverBudget ? 'text-amber-400' : 'text-sky-400'
            }`}
          >
            ₹{projectedTotalSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}{' '}
            {isPacingOverBudget ? '(+₹' + (projectedTotalSpend - totalBudgetLimit).toLocaleString('en-IN', { maximumFractionDigits: 0 }) + ' over)' : '(On track)'}
          </span>
        </div>
      </div>

      {/* Real-time Alerts Banner if any category is over/near threshold */}
      {(overBudgetCategories.length > 0 || warningCategories.length > 0) && (
        <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            Real-time Category Budget Notices
          </div>
          <div className="space-y-1 text-xs text-slate-300">
            {overBudgetCategories.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-[11px]">
                <span className="text-rose-400 font-semibold">• {b.categoryId} is over limit</span>
                <span className="font-mono text-slate-400">
                  ₹{categorySpendMap[b.categoryId]?.toLocaleString('en-IN')} / ₹{b.monthlyLimit.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            {warningCategories.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-[11px]">
                <span className="text-amber-300">• {b.categoryId} reached {((categorySpendMap[b.categoryId] / b.monthlyLimit) * 100).toFixed(0)}% threshold</span>
                <span className="font-mono text-slate-400">
                  ₹{categorySpendMap[b.categoryId]?.toLocaleString('en-IN')} / ₹{b.monthlyLimit.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200">Category Caps & Meters</h3>
          <span className="text-[11px] text-slate-400">Tap card to adjust</span>
        </div>

        {budgets.map((budget) => {
          const cat = CATEGORIES[budget.categoryId] || { name: budget.categoryId, color: '#3B82F6' };
          const spent = categorySpendMap[budget.categoryId] || 0;
          const pct = (spent / budget.monthlyLimit) * 100;
          const isOver = spent >= budget.monthlyLimit;
          const isNear = spent >= budget.monthlyLimit * budget.alertThreshold;

          return (
            <div
              key={budget.id}
              onClick={() => setEditingBudget(budget)}
              className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  />
                  <h4 className="text-xs font-semibold text-white">{cat.name}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOver
                        ? 'bg-rose-500/20 text-rose-300'
                        : isNear
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-blue-600/20 text-blue-300'
                    }`}
                  >
                    {pct.toFixed(0)}%
                  </span>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isOver ? 'bg-rose-500' : isNear ? 'bg-amber-400' : 'bg-gradient-to-r from-blue-600 to-sky-400'
                  }`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Spent: ₹{spent.toLocaleString('en-IN')}</span>
                <span>Cap: ₹{budget.monthlyLimit.toLocaleString('en-IN')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Budget Modal */}
      <BudgetEditModal
        budget={editingBudget}
        isOpen={Boolean(editingBudget)}
        onClose={() => setEditingBudget(null)}
        onSave={onSaveBudget}
      />
    </div>
  );
};
