import React from 'react';

interface AndroidFrameProps {
  children: React.ReactNode;
  isFrameMode: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children, isFrameMode }) => {
  if (!isFrameMode) {
    return (
      <div className="min-h-screen w-full bg-[#0B0F19] text-slate-100 flex flex-col justify-between">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#070A12] text-slate-100 flex items-center justify-center p-2 sm:p-5 md:p-7">
      {/* Vivo X300 Pro Phone Shell with Titanium Obsidian edge and precision curvature */}
      <div className="relative w-full max-w-[430px] h-[890px] max-h-[96vh] rounded-[48px] bg-slate-900 border-[7px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(37,99,235,0.15)] ring-1 ring-white/10 flex flex-col overflow-hidden">
        {/* Hardware volume and power keys */}
        <div className="absolute -left-[10px] top-28 w-[3px] h-12 bg-slate-700 rounded-l" />
        <div className="absolute -left-[10px] top-44 w-[3px] h-12 bg-slate-700 rounded-l" />
        <div className="absolute -right-[10px] top-36 w-[3px] h-16 bg-slate-700 rounded-r" />

        {/* Inner Phone Screen Content */}
        <div className="relative flex-1 flex flex-col w-full h-full bg-[#0B0F19] overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};
