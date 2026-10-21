import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AuraSpend Uncaught Error Caught by Boundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.removeItem('auraspend_transactions_v2_inr');
      localStorage.removeItem('auraspend_accounts_v2_inr');
      localStorage.removeItem('auraspend_budgets_v2_inr');
      localStorage.removeItem('auraspend_cloud_v2_inr');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white">Application Safely Paused</h2>
              <p className="text-xs text-slate-400 mt-1">
                AuraSpend recovered from an unexpected state. Your data is protected.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-400 text-left truncate">
                {this.state.error.message || 'System initialized'}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload AuraSpend
              </button>

              <button
                onClick={this.handleResetCache}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                Reset Cache & Restore
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
