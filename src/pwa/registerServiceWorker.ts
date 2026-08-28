const LEGACY_CACHE_PREFIX = 'hotel-os-shell-';

async function clearLegacyPwaState() {
  if (typeof window === 'undefined') return;

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }
  } catch (error) {
    console.warn('Não foi possível remover o service worker legado do Hotel OS.', error);
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(key => key.startsWith(LEGACY_CACHE_PREFIX))
          .map(key => caches.delete(key)),
      );
    }
  } catch (error) {
    console.warn('Não foi possível limpar o cache PWA legado do Hotel OS.', error);
  }
}

/**
 * GitHub Pages serves versioned Vite assets reliably on its own. The previous
 * shell service worker could keep an old index.html alive after a deploy and
 * point it at JavaScript chunks that no longer existed, resulting in a blank
 * screen. Keep this compatibility entry point while actively removing the
 * legacy worker/cache. A future PWA can be reintroduced with version-aware
 * asset handling.
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  window.addEventListener('load', () => {
    void clearLegacyPwaState();
  }, { once: true });
}
