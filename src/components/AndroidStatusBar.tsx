import React, { useEffect, useState } from 'react';
import { Wifi, Signal, BatteryCharging, ShieldCheck } from 'lucide-react';

interface AndroidStatusBarProps {
  unreadSyncCount?: number;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({ unreadSyncCount = 0 }) => {
  const [time, setTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative z-30 flex items-center justify-between px-6 pt-3 pb-1 text-xs font-semibold text-slate-300 select-none bg-slate-950/80 backdrop-blur-sm">
      {/* Time & Bank Sync Indicator */}
      <div className="flex items-center gap-2">
        <span className="font-mono tracking-tight text-white">{time}</span>
        {unreadSyncCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-sky-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            Live Sync
          </span>
        )}
      </div>

      {/* Android Center Camera Hole Punch Notch */}
      <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-3.5 h-3.5 rounded-full bg-black ring-1 ring-slate-800 shadow-inner flex items-center justify-center pointer-events-none">
        <div className="w-1 h-1 rounded-full bg-slate-900" />
      </div>

      {/* Android System Icons (5G, WiFi, Battery) */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-[10px] font-bold text-slate-400">5G</span>
        <Signal className="w-3 h-3 text-slate-300" />
        <Wifi className="w-3.5 h-3.5 text-slate-300" />
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono tabular-nums text-slate-300">98%</span>
          <BatteryCharging className="w-3.5 h-3.5 text-sky-400" />
        </div>
      </div>
    </div>
  );
};
