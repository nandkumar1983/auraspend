import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  Share2,
  TrendingUp,
  Sparkles,
  Printer,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  Store,
} from 'lucide-react';
import { MonthlyReport } from '../types/expense';
import { StorageService } from '../services/storage';
import { CategoryDonutChart } from '../components/CategoryDonutChart';
import { formatCurrency } from '../utils/formatters';

interface ReportsViewProps {
  onExportReport?: () => void;
}

const AVAILABLE_MONTHS = [
  { key: '2026-10', label: 'October 2026' },
  { key: '2026-09', label: 'September 2026' },
  { key: '2026-08', label: 'August 2026' },
];

export const ReportsView: React.FC<ReportsViewProps> = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');

  // Generate automated monthly report
  const report: MonthlyReport = useMemo(() => {
    return StorageService.generateMonthlyReport(selectedMonth);
  }, [selectedMonth]);

  const currentMonthIdx = AVAILABLE_MONTHS.findIndex((m) => m.key === selectedMonth);

  const handlePrevMonth = () => {
    if (currentMonthIdx < AVAILABLE_MONTHS.length - 1) {
      setSelectedMonth(AVAILABLE_MONTHS[currentMonthIdx + 1].key);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIdx > 0) {
      setSelectedMonth(AVAILABLE_MONTHS[currentMonthIdx - 1].key);
    }
  };

  const donutSlices = report.categoryBreakdown.map((c) => ({
    name: c.categoryName,
    value: c.total,
    color: c.color,
    percentage: c.percentage,
  }));

  const handlePrintOrSave = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `auraspend_report_${selectedMonth}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
      {/* Month Switcher Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-2 px-3">
        <button
          onClick={handlePrevMonth}
          disabled={currentMonthIdx >= AVAILABLE_MONTHS.length - 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous Month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-white tracking-wide">
            {AVAILABLE_MONTHS.find((m) => m.key === selectedMonth)?.label}
          </span>
        </div>

        <button
          onClick={handleNextMonth}
          disabled={currentMonthIdx <= 0}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next Month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* High-Level Monthly KPI Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-1">
            <ArrowDownRight className="w-3 h-3 text-rose-400" /> Total Debits
          </div>
          <span className="text-sm font-extrabold text-white font-mono block">
            {formatCurrency(report.totalDebit)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-1">
            <ArrowUpRight className="w-3 h-3 text-sky-400" /> Total Credits
          </div>
          <span className="text-sm font-extrabold text-sky-400 font-mono block">
            {formatCurrency(report.totalCredit)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-1">
            <TrendingUp className="w-3 h-3 text-blue-400" /> Net Savings
          </div>
          <span
            className={`text-sm font-extrabold font-mono block ${
              report.netSavings >= 0 ? 'text-blue-300' : 'text-rose-400'
            }`}
          >
            {formatCurrency(report.netSavings)}
          </span>
        </div>
      </div>

      {/* Automated Financial Insights Panel */}
      <div className="p-3.5 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-900/40 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          Automated Monthly Insights
        </div>
        <div className="space-y-1.5 text-xs text-slate-300">
          {report.insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-sky-400 text-xs mt-0.5">•</span>
              <p className="leading-relaxed text-[11px] text-slate-300">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category Spend Distribution Donut Chart */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <PieIcon className="w-3.5 h-3.5 text-blue-400" />
            Category Spend Breakdown
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {report.categoryBreakdown.length} Categories
          </span>
        </div>

        <CategoryDonutChart slices={donutSlices} totalSpend={report.totalDebit} />
      </div>

      {/* Detailed Category Breakdown Table */}
      <div className="p-3.5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
        <h3 className="text-xs font-bold text-white">Category Ledger Analytics</h3>

        <div className="space-y-2">
          {report.categoryBreakdown.map((cat) => (
            <div
              key={cat.categoryId}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="min-w-0">
                  <span className="font-semibold text-slate-200 block truncate">
                    {cat.categoryName}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {cat.count} transactions · {cat.percentage.toFixed(1)}% of total
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-white tabular-nums block">
                  {formatCurrency(cat.total)}
                </span>
                {typeof cat.budget === 'number' && (
                  <span
                    className={`text-[10px] font-mono ${
                      cat.isOverBudget ? 'text-rose-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Cap: {formatCurrency(cat.budget)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Spending Merchants List */}
      <div className="p-3.5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-blue-400" />
            Top Spending Vendors
          </h3>
          <span className="text-[10px] text-slate-500">Ranked by volume</span>
        </div>

        <div className="space-y-2">
          {report.topMerchants.map((merchant, idx) => (
            <div
              key={merchant.merchant}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span className="text-slate-200 font-medium truncate">{merchant.merchant}</span>
              </div>
              <span className="font-mono font-bold text-white shrink-0">
                {formatCurrency(merchant.total)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Export / Share Actions */}
      <div className="flex gap-2 pt-1 pb-4">
        <button
          onClick={handleDownloadJSON}
          className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          Download JSON
        </button>
        <button
          onClick={handlePrintOrSave}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/30 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          Print / PDF
        </button>
      </div>
    </div>
  );
};
