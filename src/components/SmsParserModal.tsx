import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowDownRight, ArrowUpRight, ClipboardPaste, AlertCircle } from 'lucide-react';
import { BankAccount, Transaction } from '../types/expense';
import { BankSyncService, ParsedSmsResult } from '../services/bankSync';
import { formatCurrency, getCurrentTimeString, getTodayString } from '../utils/formatters';

interface SmsParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  accounts: BankAccount[];
}

export const SmsParserModal: React.FC<SmsParserModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  accounts,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedSmsResult | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || 'primary-bank');

  if (!isOpen) return null;

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (!text.trim()) {
      setParsed(null);
      return;
    }
    const res = BankSyncService.parseSmsOrNotification(text);
    setParsed(res);
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleTextChange(text);
        }
      }
    } catch (e) {
      console.warn('Clipboard read error:', e);
    }
  };

  const handleApply = () => {
    if (!parsed || !parsed.amount || parsed.amount <= 0) return;

    onAddTransaction({
      type: parsed.type,
      amount: parsed.amount,
      category: parsed.category,
      accountId: selectedAccountId || parsed.accountId || accounts[0]?.id || 'primary-bank',
      description: parsed.description,
      date: getTodayString(),
      time: getCurrentTimeString(),
      source: 'sms_parser',
      status: 'cleared',
      bankReference: parsed.referenceNumber,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Bank SMS & Alert Parser</h2>
              <p className="text-[10px] text-slate-400">Extracts real debit or credit details from bank messages</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* Quick Paste from Clipboard Action */}
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-300">
              Paste SMS or Notification Text:
            </label>
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-sky-300 font-semibold text-[11px] flex items-center gap-1 border border-blue-500/30 transition-all active:scale-95"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste Clipboard</span>
            </button>
          </div>

          {/* Textarea */}
          <div>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Paste any bank or UPI transaction alert (e.g. 'Debited Rs 450 from A/c XX4128 to Swiggy UPI Ref 429104...')"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs font-mono"
            />
          </div>

          {/* Parsed Result Box if available */}
          {parsed && parsed.amount > 0 ? (
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Detected Transaction</span>
                <span
                  className={`flex items-center gap-1 font-bold text-xs ${
                    parsed.type === 'debit' ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {parsed.type === 'debit' ? (
                    <>
                      <ArrowDownRight className="w-3.5 h-3.5" /> Debit (Expense)
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-3.5 h-3.5" /> Credit (Income)
                    </>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-500 block">Amount</span>
                  <span className="text-base font-extrabold text-white font-mono">
                    {formatCurrency(parsed.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Category</span>
                  <span className="text-xs font-medium text-slate-200 capitalize">
                    {parsed.category}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Merchant / Source</span>
                  <span className="text-xs font-medium text-slate-200 truncate block">
                    {parsed.description}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Reference</span>
                  <span className="text-[11px] font-mono text-slate-400 truncate block">
                    {parsed.referenceNumber || 'UPI'}
                  </span>
                </div>
              </div>

              {/* Account Selector */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Account:</span>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleApply}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 hover:opacity-95 transition-opacity"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Confirm & Add Real Transaction
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-slate-500 text-xs">
              No transaction text entered yet. Copy an SMS or alert from your phone and paste it above to extract debit/credit details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
