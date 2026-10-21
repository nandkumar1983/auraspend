import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Signal to inline HTML preloader that React mounted successfully
(window as any).__auraspend_mounted__ = true;

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

// Register Service Worker for PWA installation & offline functionality
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      console.log('AuraSpend PWA Service Worker registered:', registration.scope);
    })
    .catch((err) => {
      console.warn('Service Worker registration failed:', err);
    });
}
