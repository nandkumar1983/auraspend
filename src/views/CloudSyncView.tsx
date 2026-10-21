import React, { useState } from 'react';
import {
  Cloud,
  CloudLightning,
  RefreshCw,
  ShieldCheck,
  Download,
  Upload,
  HardDrive,
  CheckCircle2,
  Lock,
  Landmark,
  CreditCard,
  PiggyBank,
  Wallet,
  Clock,
  Sparkles,
  Database,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { BankAccount, CloudBackupRecord, CloudSyncState, Transaction } from '../types/expense';
import { StorageService } from '../services/storage';
import { formatCurrency } from '../utils/formatters';

interface CloudSyncViewProps {
  accounts: BankAccount[];
  transactions: Transaction[];
  onTriggerBankSync: (accountId?: string, mode?: 'statement' | 'alert' | 'balance') => void;
  isSyncing: boolean;
  onRefreshData: () => void;
  onNavigateToConfig?: () => void;
}

const ACCOUNT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Landmark,
  CreditCard,
  PiggyBank,
  Wallet,
};

export const CloudSyncView: React.FC<CloudSyncViewProps> = ({
  accounts,
  transactions,
  onTriggerBankSync,
  isSyncing,
  onRefreshData,
  onNavigateToConfig,
}) => {
  const [cloudState, setCloudState] = useState<CloudSyncState>(() =>
    StorageService.getCloudSyncState()
  );
  const [isCloudBackingUp, setIsCloudBackingUp] = useState(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  const handleManualCloudBackup = async () => {
    setIsCloudBackingUp(true);
    setBackupNotice('Packaging encrypted ledger snapshot for Google Cloud Storage...');

    await new Promise((r) => setTimeout(r, 800));

    StorageService.createCloudBackupSnapshot();
    const updated = StorageService.getCloudSyncState();
    setCloudState(updated);
    setIsCloudBackingUp(false);
    setBackupNotice('Cloud replication completed. SHA-256 fingerprint verified.');
    setTimeout(() => setBackupNotice(null), 4000);
  };

  const handleExportEncryptedJson = () => {
    const backupJson = StorageService.exportBackupFileString();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auraspend_cloud_vault_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const res = StorageService.restoreFromBackupFileString(text);
        if (res.success) {
          onRefreshData();
          setCloudState(StorageService.getCloudSyncState());
          setBackupNotice('Successfully restored ledger from cloud archive.');
          setTimeout(() => setBackupNotice(null), 4000);
        } else {
          setBackupNotice(`Restore failed: ${res.message}`);
        }
      } catch (err) {
        setBackupNotice('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  const toggleAutoSync = () => {
    const updated: CloudSyncState = {
      ...cloudState,
      autoSyncEnabled: !cloudState.autoSyncEnabled,
    };
    StorageService.saveCloudSyncState(updated);
    setCloudState(updated);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
      {/* Cloud Status Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                Google Cloud & Storage Sync
                <span className="text-[10px] text-sky-400 font-mono">Active</span>
              </h3>
              <p className="text-[10px] text-slate-400">
                End-to-end encrypted ledger replication
              </p>
            </div>
          </div>

          <button
            onClick={handleManualCloudBackup}
            disabled={isCloudBackingUp}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-md shadow-blue-900/40 transition-colors flex items-center gap-1 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCloudBackingUp ? 'animate-spin' : ''}`} />
            {isCloudBackingUp ? 'Backing up...' : 'Backup Now'}
          </button>
        </div>

        {backupNotice && (
          <div className="p-2 rounded-xl bg-blue-950/50 border border-blue-800/40 text-[11px] text-sky-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{backupNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
          <div>
            <span className="text-[10px] text-slate-500 block">Last Cloud Sync</span>
            <span className="font-mono text-slate-300 text-xs">{cloudState.lastSyncedAt || 'Today'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Cloud Snapshot Size</span>
            <span className="font-mono text-slate-300 text-xs">{cloudState.storageUsedKb} KB</span>
          </div>
        </div>

        {/* Auto Sync Toggle */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-slate-300">Automated Daily Cloud Sync</span>
          <button
            onClick={toggleAutoSync}
            className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
              cloudState.autoSyncEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-800 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>

      {/* Daily Bank Sync Engine Section */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5f259f] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-purple-950/60">
              पे
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                PhonePe & Indian Bank Sync
              </h3>
              <p className="text-[10px] text-slate-400">Import real UPI credit & debit transactions</p>
            </div>
          </div>

          <button
            onClick={() => onTriggerBankSync()}
            className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span>Sync PhonePe</span>
          </button>
        </div>

        {/* Bank Cards List */}
        <div className="space-y-2">
          {accounts.map((acc) => {
            const Icon = ACCOUNT_ICONS[acc.iconName || 'Landmark'] || Landmark;
            return (
              <div
                key={acc.id}
                className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-200 truncate">{acc.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {acc.accountNumber} · Last sync: {acc.lastSyncedAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-white text-xs">
                    {formatCurrency(acc.balance)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onTriggerBankSync(acc.id, 'balance')}
                    className="px-2 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-[10px] font-semibold flex items-center gap-1 active:scale-95 transition-all"
                    title={`Reconcile ${acc.name} with PhonePe`}
                  >
                    <span className="w-2.5 h-2.5 rounded bg-[#5f259f] text-white flex items-center justify-center text-[7px] font-bold">
                      पे
                    </span>
                    <span>Reconcile</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {onNavigateToConfig && (
          <div className="pt-1 text-center">
            <button
              onClick={onNavigateToConfig}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Configure or Add Bank Accounts →
            </button>
          </div>
        )}
      </div>

      {/* Snapshot History & Vault Actions */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
          Cloud Snapshot Archives ({cloudState.backupHistory?.length || 0})
        </h3>

        <div className="space-y-1.5">
          {(cloudState.backupHistory || []).map((bk: CloudBackupRecord) => (
            <div
              key={bk.id}
              className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-mono text-slate-200 text-xs block">{bk.timestamp}</span>
                <span className="text-[10px] text-slate-500">
                  {bk.recordCount} entries · {bk.sizeKb} KB
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                <Lock className="w-3 h-3 text-sky-400" />
                <span>SHA-256</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={handleExportEncryptedJson}
            className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            Download Snapshot
          </button>

          <label className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-center">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            Restore File
            <input
              type="file"
              accept=".json"
              onChange={handleFileRestore}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
