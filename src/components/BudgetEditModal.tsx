import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { CategoryBudget } from '../types/expense';
import { CATEGORIES } from '../utils/formatters';

interface BudgetEditModalProps {
  budget: CategoryBudget | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: CategoryBudget) => void;
}

export const BudgetEditModal: React.FC<BudgetEditModalProps> = ({
  budget,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !budget) return null;

  const [limit, setLimit] = useState<string>(budget.monthlyLimit.toString());
  const [threshold, setThreshold] = useState<number>(budget.alertThreshold * 100);

  const catDef = CATEGORIES[budget.categoryId] || { name: budget.categoryId, color: '#3B82F6' };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = parseFloat(limit);
    if (isNaN(numLimit) || numLimit <= 0) return;

    onSave({
      ...budget,
      monthlyLimit: numLimit,
      alertThreshold: threshold / 100,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: catDef.color }}
            />
            <h3 className="text-sm font-bold text-white">Adjust {catDef.name} Budget</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Monthly Spending Cap (₹ INR)
            </label>
            <input
              type="number"
              step="500"
              min="500"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-lg font-bold text-white font-mono focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>Warning Notification Threshold</span>
              <span className="font-mono text-blue-400 font-semibold">{threshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-blue-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Real-time warning triggers when spending hits {threshold}% of this budget.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/40 hover:opacity-95 transition-opacity"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Save Budget Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
