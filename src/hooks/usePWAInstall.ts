import { useState, useEffect, useCallback } from 'react';

// Global singleton to capture beforeinstallprompt at module load time
// so that it is never missed even if the user taps install later.
let globalDeferredPrompt: any = null;
const promptListeners = new Set<() => void>();

function getActivePrompt() {
  if (globalDeferredPrompt) return globalDeferredPrompt;
  if (typeof window !== 'undefined' && (window as any).__auraspend_deferred_prompt__) {
    return (window as any).__auraspend_deferred_prompt__;
  }
  return null;
}

if (typeof window !== 'undefined') {
  if ((window as any).__auraspend_deferred_prompt__) {
    globalDeferredPrompt = (window as any).__auraspend_deferred_prompt__;
  }

  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    (window as any).__auraspend_deferred_prompt__ = e;
    promptListeners.forEach((callback) => callback());
  });

  window.addEventListener('pwa:installable', () => {
    if ((window as any).__auraspend_deferred_prompt__) {
      globalDeferredPrompt = (window as any).__auraspend_deferred_prompt__;
    }
    promptListeners.forEach((callback) => callback());
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    (window as any).__auraspend_deferred_prompt__ = null;
    promptListeners.forEach((callback) => callback());
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(getActivePrompt());
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    // Check if inside an iframe (like AI Studio preview)
    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch {
      inIframe = true;
    }
    setIsInIframe(inIframe);

    // Standalone mode check:
    // If inside an iframe, it is DEFINITELY NOT installed standalone!
    const checkStandalone = () => {
      if (inIframe) {
        setIsInstalled(false);
        return;
      }

      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;

      setIsInstalled(isStandalone);
    };

    checkStandalone();

    const ua = (navigator.userAgent || '').toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));

    const updateState = () => {
      setDeferredPrompt(getActivePrompt());
      checkStandalone();
    };

    promptListeners.add(updateState);
    updateState();

    return () => {
      promptListeners.delete(updateState);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const promptObj = getActivePrompt();
    if (!promptObj) {
      return 'unavailable';
    }

    try {
      await promptObj.prompt();
      const choice = await promptObj.userChoice;
      if (choice && choice.outcome === 'accepted') {
        globalDeferredPrompt = null;
        if (typeof window !== 'undefined') {
          (window as any).__auraspend_deferred_prompt__ = null;
        }
        setDeferredPrompt(null);
        setIsInstalled(true);
        return 'accepted';
      }
      return 'dismissed';
    } catch (err) {
      console.warn('Install prompt error:', err);
      return 'unavailable';
    }
  }, []);

  return {
    isInstallable: !!deferredPrompt || !!getActivePrompt(),
    isInstalled,
    isIOS,
    isAndroid,
    isInIframe,
    deferredPrompt,
    install,
  };
}
