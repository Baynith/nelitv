import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { syncDynamicDomainMetadata } from './utils/dynamicSeo.ts';

// Auto-sync SEO canonical URLs & metadata for custom domains
syncDynamicDomainMetadata();

// Register Service Worker for PWA Manifest & App Installation
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('PWA ServiceWorker registration failed:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
