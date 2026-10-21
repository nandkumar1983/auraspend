import React, { useState, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  Delete,
  Fingerprint,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { BiometricService } from '../services/biometric';
import { StorageService } from '../services/storage';

interface LockScreenProps {
  savedPin: string;
  onUnlock: () => void;
  onResetPin: (newPin: string) => void;
  onOpenInstall?: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  savedPin,
  onUnlock,
  onResetPin,
  onOpenInstall,
}) => {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState<boolean>(false);

  const isFactoryDefault = savedPin === '1234';
  const userConfig = StorageService.getUserConfig();
  const isBiometricEnabled = userConfig.enableBiometric;

  useEffect(() => {
    // If biometric unlock is enabled, trigger prompt smoothly on mount
    if (isBiometricEnabled && !isSuccess) {
      const timer = setTimeout(() => {
        handleBiometricUnlock();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDigitPress = (digit: string) => {
    if (enteredPin.length < 4 && !isSuccess) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setErrorMsg(null);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const verifyPin = (candidate: string) => {
    // STRICT SECURITY: Only candidate === savedPin is allowed!
    // Never allow '1234' if the user configured a custom PIN!
    if (candidate === savedPin) {
      setIsSuccess(true);
      setTimeout(() => {
        onUnlock();
      }, 350);
    } else {
      setErrorMsg('Incorrect PIN. Please try again.');
      setTimeout(() => {
        setEnteredPin('');
      }, 600);
    }
  };

  const handleDelete = () => {
    if (enteredPin.length > 0 && !isSuccess) {
      setEnteredPin((prev) => prev.slice(0, -1));
      setErrorMsg(null);
    }
  };

  const handleBiometricUnlock = async () => {
    if (!isBiometricEnabled) {
      setErrorMsg('Biometric unlock is disabled. Enable it in Config → Security.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setIsBiometricScanning(true);
    setErrorMsg(null);
    try {
      const res = await BiometricService.verify(userConfig.biometricCredentialId);
      setIsBiometricScanning(false);

      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onUnlock();
        }, 300);
      } else {
        setErrorMsg(res.error || 'Biometric scan was cancelled.');
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } catch (err: any) {
      setIsBiometricScanning(false);
      setErrorMsg(err.message || 'Biometric authentication failed.');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleConfirmReset = () => {
    onResetPin('1234');
    setEnteredPin('');
    setIsResetConfirmOpen(false);
    setErrorMsg('PIN has been reset to 1234. Please enter it now and update it in Settings.');
  };

  return (
    <div className="relative w-full h-full min-h-[640px] bg-[#0B0F19] text-slate-100 flex flex-col justify-between p-6 select-none overflow-hidden">
      {/* Background Decorative Ambient Sapphire Aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top action bar: Install shortcut */}
      {onOpenInstall && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onOpenInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-semibold shadow-sm active:scale-95 transition-all"
            title="Install AuraSpend"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        </div>
      )}

      {/* Top Lock Header & Branding */}
      <div className="flex flex-col items-center pt-8 space-y-3 z-10">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-[2px] shadow-xl shadow-blue-900/30">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              {isSuccess ? (
                <CheckCircle2 className="w-8 h-8 text-sky-400 animate-bounce" />
              ) : (
                <Lock className="w-7 h-7 text-blue-400" />
              )}
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-[9px] font-bold text-white uppercase tracking-wider">
            Secured
          </span>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
            AuraSpend
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30">
              ₹ INR
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Personal Expense & Debt Tracker
          </p>
        </div>

        {/* Notice ONLY on first initial launch before custom PIN setup */}
        {isFactoryDefault && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/80 border border-blue-800/60 text-xs text-sky-300 shadow-sm">
            <KeyRound className="w-3.5 h-3.5 text-sky-400" />
            <span>Initial Default PIN: <strong className="text-white font-mono">1234</strong></span>
          </div>
        )}
      </div>

      {/* Middle: Biometric Prompt Banner & 4 PIN Indicator Circles */}
      <div className="flex flex-col items-center space-y-3 my-auto z-10">
        {/* Quick Biometric Action if enabled */}
        {isBiometricEnabled && (
          <button
            onClick={handleBiometricUnlock}
            disabled={isBiometricScanning || isSuccess}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-sky-300 text-xs font-bold shadow-lg shadow-blue-900/30 active:scale-95 transition-all"
          >
            <Fingerprint className={`w-4 h-4 text-sky-400 ${isBiometricScanning ? 'animate-spin' : ''}`} />
            <span>{isBiometricScanning ? 'Scanning Biometric...' : 'Tap for Fingerprint / Face Unlock'}</span>
          </button>
        )}

        <div className="text-xs font-semibold text-slate-400 text-center">
          {isSuccess ? (
            <span className="text-sky-400 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-4 h-4" /> Authenticated! Entering...
            </span>
          ) : errorMsg ? (
            <span className="text-rose-400 flex items-center gap-1 font-semibold animate-pulse">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </span>
          ) : isBiometricScanning ? (
            <span className="text-blue-300 flex items-center gap-1.5 font-medium animate-pulse">
              <Fingerprint className="w-4 h-4 text-blue-400 animate-spin" /> Verifying Fingerprint / Face ID...
            </span>
          ) : (
            isBiometricEnabled ? 'Touch fingerprint sensor or enter PIN' : 'Enter 4-digit Security PIN'
          )}
        </div>

        {/* 4 PIN Dots */}
        <div className="flex items-center gap-5 py-2">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = enteredPin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 transform ${
                  isFilled
                    ? 'bg-gradient-to-tr from-blue-500 to-sky-400 scale-125 shadow-lg shadow-blue-500/50'
                    : 'bg-slate-800 border border-slate-700/80'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom Numeric Keypad (Vivo X300 Pro Dialpad design) */}
      <div className="w-full max-w-xs mx-auto z-10 space-y-3 pb-2">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigitPress(digit)}
              className="h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 active:bg-blue-600/30 border border-slate-800/80 text-xl font-bold text-white shadow-md active:scale-90 transition-all duration-150 flex items-center justify-center"
            >
              {digit}
            </button>
          ))}

          {/* Biometric Button */}
          <button
            onClick={handleBiometricUnlock}
            disabled={isBiometricScanning || isSuccess}
            className={`h-16 rounded-2xl border active:scale-90 transition-all flex flex-col items-center justify-center gap-0.5 ${
              isBiometricEnabled
                ? 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/50 text-sky-300 shadow-md shadow-blue-900/30'
                : 'bg-slate-900/40 hover:bg-slate-800/60 border-slate-800/50 text-slate-500'
            }`}
            title="Biometric Fingerprint / Face Unlock (WebAuthn API)"
          >
            <Fingerprint className={`w-6 h-6 ${isBiometricEnabled ? 'text-sky-400' : 'text-slate-500'}`} />
            <span className="text-[9px] font-semibold text-slate-400">
              {isBiometricEnabled ? 'Biometric' : 'Touch'}
            </span>
          </button>

          {/* 0 Key */}
          <button
            onClick={() => handleDigitPress('0')}
            className="h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 active:bg-blue-600/30 border border-slate-800/80 text-xl font-bold text-white shadow-md active:scale-90 transition-all duration-150 flex items-center justify-center"
          >
            0
          </button>

          {/* Backspace Key */}
          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-slate-900/40 hover:bg-slate-800/60 active:bg-rose-500/20 border border-slate-800/50 text-slate-400 hover:text-white active:scale-90 transition-all flex items-center justify-center"
            title="Delete Digit"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Footer helper links: Reset PIN */}
        <div className="flex items-center justify-center pt-2 text-center">
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="text-[11px] text-slate-500 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-slate-600" />
            Forgot PIN? Reset
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center space-y-3 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Reset Security PIN?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Resetting will restore the default PIN code (<strong className="text-white font-mono">1234</strong>) so you can regain access.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-900/40"
              >
                Reset PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
