export function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveLocal<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('unlam:local', { detail: { key } }));
  } catch {
    // Ignore storage errors (e.g. Safari private mode)
  }
}

export function removeLocal(key: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent('unlam:local', { detail: { key } }));
  } catch {
    // Ignore storage errors (e.g. Safari private mode)
  }
}
