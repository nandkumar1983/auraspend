import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';

interface DonutSlice {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface CategoryDonutChartProps {
  slices: DonutSlice[];
  totalSpend: number;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ slices, totalSpend }) => {
  const [activeSlice, setActiveSlice] = useState<DonutSlice | null>(null);

  if (slices.length === 0 || totalSpend === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-slate-500 text-xs">
        <span>No debit expenditures recorded for this period.</span>
      </div>
    );
  }

  // Calculate SVG arc paths for donut
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col items-center">
      {/* SVG Donut Ring */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />
          {slices.map((slice, index) => {
            const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += slice.percentage;

            const isHovered = activeSlice?.name === slice.name;

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setActiveSlice(slice)}
                onMouseLeave={() => setActiveSlice(null)}
                onClick={() => setActiveSlice(activeSlice?.name === slice.name ? null : slice)}
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-[10px] text-slate-400 font-medium">
            {activeSlice ? activeSlice.name : 'Total Debit'}
          </span>
          <span className="text-base font-extrabold text-white font-mono tabular-nums leading-tight">
            {formatCurrency(activeSlice ? activeSlice.value : totalSpend)}
          </span>
          <span className="text-[10px] text-sky-400 font-mono">
            {activeSlice ? `${activeSlice.percentage.toFixed(1)}%` : '100%'}
          </span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="w-full grid grid-cols-2 gap-2 mt-4">
        {slices.slice(0, 6).map((slice, idx) => {
          const isSelected = activeSlice?.name === slice.name;
          return (
            <button
              key={idx}
              onClick={() => setActiveSlice(isSelected ? null : slice)}
              className={`flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                isSelected
                  ? 'bg-slate-800 ring-1 ring-slate-700'
                  : 'bg-slate-900/60 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-[11px] text-slate-200 truncate font-medium">
                  {slice.name}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0 ml-1">
                {slice.percentage.toFixed(0)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
