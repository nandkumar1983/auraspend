import React, { useState } from 'react';
import {
  ShoppingCart,
  Utensils,
  ShoppingBag,
  Car,
  Zap,
  Home,
  Film,
  Activity,
  Briefcase,
  Award,
  TrendingUp,
  Repeat,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  Clock,
  Landmark,
  ShieldCheck,
  ChevronRight,
  Check,
} from 'lucide-react';
import { BankAccount, Transaction } from '../types/expense';
import { CATEGORIES, formatCurrency, formatDateShort } from '../utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  account?: BankAccount;
  onDelete?: (id: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const CATEGORY_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  ShoppingCart,
  Utensils,
  ShoppingBag,
  Car,
  Zap,
  Home,
  Film,
  Activity,
  Briefcase,
  Award,
  TrendingUp,
  Repeat,
  MoreHorizontal,
};

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  account,
  onDelete,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const catDef = CATEGORIES[transaction.category] || {
    name: transaction.category,
    icon: 'MoreHorizontal',
    color: '#64748B',
  };
  const IconComponent = CATEGORY_ICON_MAP[catDef.icon] || MoreHorizontal;

  const isDebit = transaction.type === 'debit';

  const handleClick = () => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect(transaction.id);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className={`border rounded-2xl transition-all overflow-hidden ${
        isSelected
          ? 'bg-blue-950/40 border-blue-500/60 shadow-sm shadow-blue-950/50'
          : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800/80'
      }`}
    >
      <div
        onClick={handleClick}
        className="flex items-center justify-between p-3 cursor-pointer select-none"
      >
        {/* Left Category Icon & Checkbox */}
        <div className="flex items-center gap-3 min-w-0">
          {isSelectionMode && (
            <div
              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                isSelected
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-950 border-slate-700 text-transparent'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}

          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
            style={{
              backgroundColor: `${catDef.color}20`,
              color: catDef.color,
            }}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-100 truncate">
              {transaction.description}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <span>{catDef.name}</span>
              <span>·</span>
              <span className="truncate">{account ? account.name.split(' ')[0] : 'Bank'}</span>
              <span>·</span>
              <span>{transaction.time || formatDateShort(transaction.date)}</span>
            </div>
          </div>
        </div>

        {/* Right Amount */}
        <div className="flex items-center gap-1.5 shrink-0 pl-2">
          <div className="text-right">
            <span
              className={`text-xs font-bold font-mono tabular-nums block ${
                isDebit ? 'text-slate-100' : 'text-sky-400'
              }`}
            >
              {isDebit ? '-' : '+'}
              {formatCurrency(transaction.amount)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {transaction.source === 'bank_sync'
                ? 'Bank Sync'
                : transaction.source === 'sms_parser'
                ? 'SMS Parse'
                : 'Manual'}
            </span>
          </div>
          {!isSelectionMode && (
            <ChevronRight
              className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          )}
        </div>
      </div>

      {/* Expandable Details Drawer */}
      {!isSelectionMode && isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 bg-slate-950/40 text-xs space-y-2">
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>
                {transaction.date} at {transaction.time || '12:00'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Landmark className="w-3 h-3 text-slate-500" />
              <span className="truncate">
                {account ? `${account.institution} (${account.accountNumber})` : 'Connected Bank'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-sky-400" />
              <span>Status: Cleared & Verified</span>
            </div>
            {transaction.bankReference && (
              <div className="text-[10px] font-mono text-slate-500 truncate">
                Ref: {transaction.bankReference}
              </div>
            )}
          </div>

          {transaction.receiptNote && (
            <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-300">
              <strong className="text-slate-400 block text-[10px] uppercase font-semibold">Note:</strong>
              {transaction.receiptNote}
            </div>
          )}

          {transaction.tags && transaction.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {transaction.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Row */}
          {onDelete && (
            <div className="flex justify-end pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(transaction.id);
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Entry</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
