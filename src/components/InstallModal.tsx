import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Share2,
  Globe,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isInIframe, install } = usePWAInstall();
  const [isCopied, setIsCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const appUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://ais-dev-3rsahelvcmfz5ls4j4ohyy-174631317751.asia-east1.run.app';

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setFeedback('Opening install prompt...');
    const result = await install();
    if (result === 'accepted') {
      setFeedback('✓ AuraSpend is being added to your phone home screen!');
    } else if (result === 'dismissed') {
      setFeedback('Installation cancelled. You can tap Install anytime.');
    } else {
      setFeedback('In Chrome: Tap the 3 dots (⋮) in top right → Tap "Add to Home screen"');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setIsCopied(true);
      setFeedback('✓ App link copied to clipboard! Paste it into Chrome or Vivo Browser.');
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      setFeedback('Link: ' + appUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-900/40 font-bold text-sm">
              ₹
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                Install AuraSpend
              </h2>
              <p className="text-[10px] text-slate-400">Add to your phone Home Screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* Status if truly running in standalone (never shown inside preview iframe) */}
          {isInstalled && !isInIframe && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-700/60 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-200 text-xs">AuraSpend is Installed</p>
                <p className="text-[11px] text-emerald-300/80 mt-0.5 leading-relaxed">
                  The app is installed and running in full-screen standalone mode with offline storage and PIN security.
                </p>
              </div>
            </div>
          )}

          {/* If inside AI Studio Preview iframe */}
          {isInIframe ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5 shadow-lg">
              <div className="flex items-center gap-2 text-sky-300 font-bold text-xs">
                <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Install on Mobile (Vivo / Android)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                You are currently previewing AuraSpend inside the AI Studio viewer. To install the app with the <strong>₹ icon</strong> onto your mobile home screen, open it directly in Chrome:
              </p>

              {/* Direct anchor link that bypasses popup blockers */}
              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 hover:opacity-95 active:scale-98 transition-all text-center block text-xs"
              >
                <ExternalLink className="w-4 h-4 inline stroke-[2.5]" />
                <span>Open in Chrome to Install</span>
              </a>

              <div className="flex items-center justify-center pt-1">
                <button
                  onClick={handleCopyLink}
                  className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium flex items-center gap-1.5 active:scale-95 transition-all text-[11px]"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Link Copied!' : 'Copy Direct App Link'}</span>
                </button>
              </div>

              {feedback && (
                <div className="text-[11px] text-sky-200 bg-blue-950/70 p-2.5 rounded-xl border border-blue-700/60 font-medium leading-relaxed">
                  {feedback}
                </div>
              )}
            </div>
          ) : (
            /* When viewing directly in Chrome/browser */
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  Quick Installation
                </span>
                {isInstallable && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-medium">
                    Ready
                  </span>
                )}
              </div>

              <button
                onClick={handleInstallClick}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 hover:opacity-95 active:scale-98 transition-all"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Install App / Add to Home Screen</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleCopyLink}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition-all text-[11px]"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Link Copied!' : 'Copy Link'}</span>
                </button>

                <a
                  href={appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition-all text-[11px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Tab</span>
                </a>
              </div>

              {feedback && (
                <div className="text-[11px] text-sky-200 bg-blue-950/70 p-2.5 rounded-xl border border-blue-700/60 font-medium leading-relaxed">
                  {feedback}
                </div>
              )}
            </div>
          )}

          {/* Simple 2-Step Chrome Guide */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Easy 2-Step Installation in Chrome:
            </div>

            <div className="space-y-2 text-slate-300 text-[11px]">
              <div className="flex items-start gap-2.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  Tap the <strong>three dots (⋮)</strong> at the top-right corner of Chrome.
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  Tap <strong>"Add to Home screen"</strong> (or <strong>"Install app"</strong>) &rarr; tap <strong>Add</strong>.
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-[10px] text-sky-300 leading-relaxed flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong>Pro Tip:</strong> Tapping <strong>"Add to Home screen"</strong> instantly adds the AuraSpend ₹ icon to your phone with full-screen launch and offline support!
              </div>
            </div>
          </div>

          {/* Vivo Browser / iPhone Quick Note */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/70 text-[11px] text-slate-300 space-y-1.5">
            <span className="font-semibold text-slate-200">Other Browsers:</span>
            <ul className="space-y-1 text-[10px] text-slate-400 list-disc list-inside">
              <li>
                <strong>Vivo Browser:</strong> Tap the bottom menu (<span className="text-white">≡</span>) &rarr; tap <strong>"Add to Desktop"</strong>.
              </li>
              <li>
                <strong>iPhone (Safari):</strong> Tap the <strong>Share</strong> button (<Share2 className="w-3 h-3 inline mx-0.5" />) &rarr; tap <strong>"Add to Home Screen"</strong>.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
