import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  BarChart3,
  Plus,
  HandCoins,
  Settings,
} from 'lucide-react';

export type ActiveTab = 'home' | 'transactions' | 'debts' | 'budgets' | 'reports' | 'sync' | 'config';

interface BottomNavBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
}) => {
  const tabsLeft = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'transactions', label: 'Ledger', icon: ReceiptText },
    { id: 'debts', label: 'Debts', icon: HandCoins },
  ];

  const tabsRight = [
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'config', label: 'Config', icon: Settings },
  ];

  return (
    <div className="relative z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        {tabsLeft.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as ActiveTab)}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[46px] py-1 transition-all duration-200 rounded-xl ${
                isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`relative px-2 py-1 rounded-full transition-colors ${
                  isActive ? 'bg-blue-600/20 text-blue-300' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Central Floating Quick Entry (+) FAB in Sapphire & Indigo */}
        <div className="relative -top-3 flex items-center justify-center px-0.5">
          <button
            onClick={onOpenAddModal}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white shadow-xl shadow-blue-900/40 flex items-center justify-center transform active:scale-90 hover:scale-105 transition-all duration-200 border-2 border-slate-900 ring-2 ring-blue-500/25"
            title="Quick Add Debit or Credit"
            aria-label="Add Transaction"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {tabsRight.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as ActiveTab)}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[46px] py-1 transition-all duration-200 rounded-xl ${
                isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`relative px-2 py-1 rounded-full transition-colors ${
                  isActive ? 'bg-blue-600/20 text-blue-300' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Android / Vivo Gesture Bar Pill Indicator */}
      <div className="w-28 h-1 bg-slate-700/60 rounded-full mx-auto mt-1.5" />
    </div>
  );
};
