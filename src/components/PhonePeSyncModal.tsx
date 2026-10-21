import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Upload,
  FileText,
  Check,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Smartphone,
  RefreshCw,
  Landmark,
  ShieldCheck,
  ClipboardPaste,
  HelpCircle,
  Wallet,
} from 'lucide-react';
import { BankAccount, Transaction } from '../types/expense';
import { PhonePeParsedTx, PhonePeSyncService } from '../services/phonepe';
import { StorageService } from '../services/storage';
import { formatCurrency, getCurrentTimeString, getTodayString } from '../utils/formatters';

interface PhonePeSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: BankAccount[];
  initialAccountId?: string;
  initialMode?: 'statement' | 'alert' | 'balance';
  onTransactionsImported: (count: number) => void;
  onAccountsUpdated: (accounts: BankAccount[]) => void;
}

export const PhonePeSyncModal: React.FC<PhonePeSyncModalProps> = ({
  isOpen,
  onClose,
  accounts,
  initialAccountId,
  initialMode = 'statement',
  onTransactionsImported,
  onAccountsUpdated,
}) => {
  const [activeMode, setActiveMode] = useState<'statement' | 'alert' | 'balance'>(initialMode);
  const [inputText, setInputText] = useState('');
  const [parsedItems, setParsedItems] = useState<PhonePeParsedTx[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [selectedAccountId, setSelectedAccountId] = useState(
    initialAccountId || accounts[0]?.id || 'primary-bank'
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isReadingClipboard, setIsReadingClipboard] = useState(false);

  // Balance Reconcile state
  const [reconcileAccId, setReconcileAccId] = useState(
    initialAccountId || accounts[0]?.id || ''
  );
  const [newActualBalance, setNewActualBalance] = useState('');

  // Update selection if initial props change
  useEffect(() => {
    if (initialAccountId) {
      setSelectedAccountId(initialAccountId);
      setReconcileAccId(initialAccountId);
      const acc = accounts.find((a) => a.id === initialAccountId);
      if (acc) {
        setNewActualBalance(acc.balance > 0 ? acc.balance.toString() : '');
      }
    }
    if (initialMode) {
      setActiveMode(initialMode);
    }
  }, [initialAccountId, initialMode, isOpen]);

  if (!isOpen) return null;

  const handleLaunchPhonePe = () => {
    PhonePeSyncService.launchPhonePeApp();
    setFeedback('Opening PhonePe App... Copy any transaction or statement text, then return here to auto-sync.');
  };

  const handleReadClipboard = async () => {
    setIsReadingClipboard(true);
    setFeedback(null);
    try {
      const text = await PhonePeSyncService.readFromClipboard();
      setIsReadingClipboard(false);
      if (text) {
        handleParseText(text);
        setFeedback('Read from clipboard successfully!');
      } else {
        setFeedback('No text found in clipboard. Please copy a transaction or SMS first.');
      }
    } catch {
      setIsReadingClipboard(false);
      setFeedback('Unable to access clipboard. Please paste your transaction manually.');
    }
  };

  const handleParseText = (text: string) => {
    setInputText(text);
    if (!text.trim()) {
      setParsedItems([]);
      setSelectedIndices(new Set());
      return;
    }

    const items = PhonePeSyncService.parsePhonePeStatement(text);
    setParsedItems(items);

    // Auto-match account if hint exists
    if (items.length > 0 && items[0].matchedAccountId) {
      const hint = items[0].matchedAccountId;
      const matched = accounts.find((a) => a.accountNumber.includes(hint));
      if (matched) {
        setSelectedAccountId(matched.id);
      }
    }

    // Select all parsed items by default
    const all = new Set<number>();
    items.forEach((_, idx) => all.add(idx));
    setSelectedIndices(all);

    if (items.length > 0) {
      const debits = items.filter((i) => i.type === 'debit').length;
      const credits = items.filter((i) => i.type === 'credit').length;
      setFeedback(`Found ${items.length} real transactions (${debits} debits, ${credits} credits)!`);
    } else {
      setFeedback('No valid PhonePe transactions recognized. Check the text format.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleParseText(content);
      }
    };
    reader.readAsText(file);
  };

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const handleImportSelected = () => {
    if (selectedIndices.size === 0) {
      setFeedback('Please select at least one transaction to import.');
      return;
    }

    let count = 0;
    const existing = StorageService.getTransactions();

    selectedIndices.forEach((idx) => {
      const item = parsedItems[idx];
      if (!item) return;

      // Avoid duplicate by UTR/bankReference if present
      const isDuplicate = existing.some(
        (t) => t.bankReference && item.bankReference && t.bankReference === item.bankReference
      );

      if (!isDuplicate) {
        StorageService.addTransaction({
          type: item.type,
          amount: item.amount,
          category: item.category,
          accountId: selectedAccountId,
          description: item.description,
          date: item.date || getTodayString(),
          time: item.time || getCurrentTimeString(),
          source: 'bank_sync',
          bankReference: item.bankReference,
          status: 'cleared',
        });
        count++;
      }
    });

    onTransactionsImported(count);
    onAccountsUpdated(StorageService.getAccounts());
    setFeedback(`✓ Imported ${count} real PhonePe transaction${count === 1 ? '' : 's'} into your ledger!`);
    setTimeout(() => {
      onClose();
    }, 1400);
  };

  const handleReconcileBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAcc = accounts.find((a) => a.id === reconcileAccId);
    if (!targetAcc) return;

    const bal = parseFloat(newActualBalance);
    if (isNaN(bal)) {
      setFeedback('Please enter a valid balance amount.');
      return;
    }

    const updated = accounts.map((acc) =>
      acc.id === reconcileAccId
        ? {
            ...acc,
            balance: bal,
            lastSyncedAt: 'Reconciled with PhonePe at ' + getCurrentTimeString(),
            syncStatus: 'connected' as const,
          }
        : acc
    );

    StorageService.saveAccounts(updated);
    onAccountsUpdated(updated);
    setFeedback(`✓ ${targetAcc.name} balance successfully updated to ${formatCurrency(bal)}.`);
    setTimeout(() => {
      onClose();
    }, 1400);
  };

  // Summary counts
  const selectedItems = Array.from(selectedIndices).map((i) => parsedItems[i]).filter(Boolean);
  const totalDebits = selectedItems
    .filter((i) => i.type === 'debit')
    .reduce((sum, i) => sum + i.amount, 0);
  const totalCredits = selectedItems
    .filter((i) => i.type === 'credit')
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            {/* PhonePe Purple Icon */}
            <div className="w-9 h-9 rounded-2xl bg-[#5f259f] text-white flex items-center justify-center font-bold text-base shadow-md shadow-purple-950/60 border border-purple-400/30">
              पे
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                PhonePe & Bank Sync
                <span className="text-[9px] bg-purple-900/60 text-purple-300 font-semibold px-1.5 py-0.5 rounded border border-purple-500/30">
                  Real UPI Data
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                Sync real credit & debit transactions • Zero dummy data
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

        <div className="p-4 space-y-3.5 text-xs overflow-y-auto">
          {/* Quick PhonePe Mobile App Launcher & Clipboard Sync */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-indigo-950/60 to-slate-900 border border-purple-500/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <p className="font-bold text-white text-xs">Launch PhonePe App</p>
                <p className="text-[10px] text-purple-200/70">
                  Open PhonePe to view UPI history or copy transaction receipt
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleLaunchPhonePe}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-[#5f259f] hover:bg-[#6f2eb8] text-white text-xs font-bold shadow-md shadow-purple-950/80 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open PhonePe</span>
              </button>

              <button
                type="button"
                onClick={handleReadClipboard}
                disabled={isReadingClipboard}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/60 text-purple-200 border border-purple-500/30 text-xs font-semibold active:scale-95 transition-all flex items-center justify-center gap-1"
                title="Auto-read copied transaction from PhonePe"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-purple-300" />
                <span>{isReadingClipboard ? 'Reading...' : 'Scan Clipboard'}</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setActiveMode('statement')}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'statement' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Statement (CSV/Text)
            </button>
            <button
              onClick={() => setActiveMode('alert')}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'alert' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paste Alert / SMS
            </button>
            <button
              onClick={() => setActiveMode('balance')}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'balance' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Reconcile Balance
            </button>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="p-2.5 rounded-xl bg-purple-950/70 border border-purple-600 text-purple-200 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-purple-300 shrink-0" />
              <span className="truncate">{feedback}</span>
            </div>
          )}

          {/* MODE 1: STATEMENT IMPORT */}
          {activeMode === 'statement' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Upload Statement File:</span>
                <label className="cursor-pointer px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 border border-slate-700 active:scale-95 transition-all">
                  <Upload className="w-3.5 h-3.5 text-purple-400" />
                  <span>Choose File (CSV / TXT)</span>
                  <input
                    type="file"
                    accept=".csv,.txt,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Or Paste PhonePe History / Statement Text:
                </label>
                <textarea
                  rows={4}
                  value={inputText}
                  onChange={(e) => handleParseText(e.target.value)}
                  placeholder="Paste PhonePe statement rows or transaction details...&#10;e.g.&#10;21-Oct-2026,Paid to DMart,DEBIT,1450.00,42918491024&#10;20-Oct-2026,Received from Ramesh,CREDIT,1500.00,42918491025"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Target Bank Account Selector */}
              {parsedItems.length > 0 && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-300 font-medium">Link to Bank Account:</span>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-purple-500"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Breakdown Totals (Credits vs Debits) */}
              {parsedItems.length > 0 && (
                <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-900/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-rose-400 block font-semibold">Total Debits (Spent)</span>
                      <span className="font-mono font-bold text-rose-300">-{formatCurrency(totalDebits)}</span>
                    </div>
                    <ArrowDownRight className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-400 block font-semibold">Total Credits (Received)</span>
                      <span className="font-mono font-bold text-emerald-300">+{formatCurrency(totalCredits)}</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
              )}

              {/* Parsed Transactions Preview List */}
              {parsedItems.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>Parsed Items ({selectedIndices.size} selected):</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedIndices.size === parsedItems.length) {
                          setSelectedIndices(new Set());
                        } else {
                          const all = new Set<number>();
                          parsedItems.forEach((_, i) => all.add(i));
                          setSelectedIndices(all);
                        }
                      }}
                      className="text-purple-400 underline text-xs"
                    >
                      {selectedIndices.size === parsedItems.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {parsedItems.map((item, idx) => {
                    const isSelected = selectedIndices.has(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleSelect(idx)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-slate-800/90 border-purple-500/60'
                            : 'bg-slate-950/60 border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded accent-purple-600"
                          />
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              item.type === 'debit'
                                ? 'bg-rose-950/80 text-rose-400'
                                : 'bg-emerald-950/80 text-emerald-400'
                            }`}
                          >
                            {item.type === 'debit' ? (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white text-xs truncate">{item.description}</p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {item.date} • {item.category} • {item.bankReference || 'UPI'}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`font-mono font-bold text-xs shrink-0 ${
                            item.type === 'debit' ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {item.type === 'debit' ? '-' : '+'}
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {parsedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleImportSelected}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/70 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Import {selectedIndices.size} Real Transactions</span>
                </button>
              )}
            </div>
          )}

          {/* MODE 2: QUICK SMS / NOTIFICATION PASTE */}
          {activeMode === 'alert' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Paste UPI Alert or Notification:</span>
                <button
                  type="button"
                  onClick={handleReadClipboard}
                  className="px-2.5 py-1 rounded-lg bg-purple-900/50 hover:bg-purple-800/50 text-purple-200 font-semibold text-[11px] flex items-center gap-1 border border-purple-500/30"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Paste Clipboard</span>
                </button>
              </div>

              <textarea
                rows={3}
                value={inputText}
                onChange={(e) => handleParseText(e.target.value)}
                placeholder="e.g. Paid Rs. 350 to Swiggy via PhonePe UPI. Debited from HDFC Bank A/C XX4128. Ref: 4291048812"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-purple-500"
              />

              {parsedItems.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-purple-500/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{parsedItems[0].description}</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        parsedItems[0].type === 'debit' ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {parsedItems[0].type === 'debit' ? '-' : '+'}
                      {formatCurrency(parsedItems[0].amount)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                    <span>Category: <strong className="text-purple-300 capitalize">{parsedItems[0].category}</strong></span>
                    <span>Type: <strong className={parsedItems[0].type === 'debit' ? 'text-rose-400' : 'text-emerald-400'}>{parsedItems[0].type.toUpperCase()}</strong></span>
                    <span>Ref: {parsedItems[0].bankReference || 'UPI'}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Account:</span>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({formatCurrency(a.balance)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleImportSelected}
                    className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs mt-2 transition-transform active:scale-98 shadow-md shadow-purple-950/60"
                  >
                    Add This Real Transaction
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: RECONCILE BALANCE */}
          {activeMode === 'balance' && (
            <form onSubmit={handleReconcileBalance} className="space-y-3.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Landmark className="w-4 h-4 text-purple-400" />
                <span>Reconcile Account Balance with PhonePe</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Check your bank balance inside PhonePe with your UPI PIN, then enter your exact balance below.
                This updates your account balance without creating any dummy or mock transactions.
              </p>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Select Bank Account</label>
                <select
                  value={reconcileAccId}
                  onChange={(e) => {
                    setReconcileAccId(e.target.value);
                    const acc = accounts.find((a) => a.id === e.target.value);
                    if (acc) {
                      setNewActualBalance(acc.balance > 0 ? acc.balance.toString() : '');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Current ledger: {formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Actual Balance in PhonePe (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={newActualBalance}
                  onChange={(e) => setNewActualBalance(e.target.value)}
                  placeholder="e.g. 45000"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm font-mono font-bold focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleLaunchPhonePe}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Check in PhonePe</span>
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-950/70 transition-transform active:scale-98"
                >
                  Update & Reconcile Balance
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            NPCI UPI Secure • Zero dummy records
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
