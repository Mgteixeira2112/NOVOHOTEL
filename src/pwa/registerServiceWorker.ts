export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL || './'}sw.js`;
    void navigator.serviceWorker.register(swUrl).catch(() => {
      // PWA is progressive enhancement; the application remains usable without SW.
    });
  });
}
