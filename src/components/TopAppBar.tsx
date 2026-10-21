import React from 'react';
import { RefreshCw, MessageSquareQuote, Smartphone, Monitor, Settings, Lock, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface TopAppBarProps {
  isSyncing: boolean;
  onTriggerBankSync: (accountId?: string, mode?: 'statement' | 'alert' | 'balance') => void;
  onOpenSmsParser: () => void;
  isFrameMode: boolean;
  onToggleFrameMode: () => void;
  onOpenConfig: () => void;
  isConfigActive: boolean;
  onOpenInstall: () => void;
  onLockApp: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  isSyncing,
  onTriggerBankSync,
  onOpenSmsParser,
  isFrameMode,
  onToggleFrameMode,
  onOpenConfig,
  isConfigActive,
  onOpenInstall,
  onLockApp,
}) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        return;
      }
    }
    onOpenInstall();
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-2.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      {/* Brand title with Sapphire Badge */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center font-bold text-white text-base shadow-md shadow-blue-900/30">
          ₹
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
            AuraSpend
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30">
              Vivo X300 Pro
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Budget Engine & Indian Bank Sync</p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1">
        {/* Quick Lock Button */}
        <button
          onClick={onLockApp}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          title="Lock Screen with PIN"
        >
          <Lock className="w-4 h-4 text-blue-400" />
        </button>

        {/* Install App Button */}
        <button
          onClick={handleInstallClick}
          className={`px-2 py-1.5 rounded-lg border font-semibold text-xs flex items-center gap-1 transition-all ${
            isInstalled
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : isInstallable
              ? 'bg-blue-600/30 hover:bg-blue-600/40 border-blue-400 text-sky-200 animate-pulse'
              : 'bg-blue-600/15 hover:bg-blue-600/25 border-blue-500/30 text-blue-300'
          }`}
          title={isInstalled ? 'App Installed (Standalone Mode)' : 'Install Vivo Android App'}
        >
          {isInstalled ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
          )}
          <span>{isInstalled ? 'Installed' : 'Install'}</span>
          {isInstallable && !isInstalled && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>

        {/* SMS Parser Button */}
        <button
          onClick={onOpenSmsParser}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all text-xs flex items-center gap-1"
          title="Parse Bank SMS / Alert"
        >
          <MessageSquareQuote className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline text-xs">SMS</span>
        </button>

        {/* PhonePe & Bank Sync Trigger Button */}
        <button
          onClick={() => onTriggerBankSync()}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 active:scale-95"
          title="PhonePe & Bank Sync Center"
        >
          <div className="w-3.5 h-3.5 rounded bg-[#5f259f] text-white flex items-center justify-center text-[8px] font-bold">
            पे
          </div>
          <span className="hidden xs:inline">PhonePe</span>
        </button>

        {/* Configuration Page Button */}
        <button
          onClick={onOpenConfig}
          className={`p-1.5 rounded-lg transition-colors ${
            isConfigActive
              ? 'bg-blue-600/25 text-blue-300 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Account Configuration & Security"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Device Frame View Toggle (hidden on small screens) */}
        <button
          onClick={onToggleFrameMode}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          title={isFrameMode ? 'Switch to Fluid Full View' : 'Switch to Vivo Device Frame'}
        >
          {isFrameMode ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
