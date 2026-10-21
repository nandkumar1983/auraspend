import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, Check, X } from 'lucide-react';

interface SecurityPinModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  savedPin: string;
}

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({
  isOpen,
  onSuccess,
  savedPin,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError(null);

      if (next.length === 4) {
        if (next === savedPin) {
          setTimeout(() => {
            onSuccess();
            setPin('');
          }, 200);
        } else {
          setError('Incorrect PIN. Please re-enter.');
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
      <div className="w-full max-w-xs flex flex-col items-center space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-900/30">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-base font-bold text-white">AuraSpend Security Lock</h2>
          <p className="text-xs text-slate-400 mt-1">Enter 4-digit PIN to access accounts</p>
        </div>

        {/* 4 PIN Dots */}
        <div className="flex items-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? 'bg-blue-500 scale-125 shadow-sm shadow-blue-500'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-xs text-rose-400 font-medium animate-shake">{error}</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[220px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-lg font-bold text-white hover:bg-slate-850 active:scale-95 transition-all flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-lg font-bold text-white hover:bg-slate-850 active:scale-95 transition-all flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-850 active:scale-95 transition-all flex items-center justify-center"
          >
            Del
          </button>
        </div>
      </div>
    </div>
  );
};
