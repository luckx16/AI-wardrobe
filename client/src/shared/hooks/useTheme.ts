'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'ai-wardrobe-theme';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const CHANGE_EVENT = 'ai-wardrobe-theme-change';

// ── External store helpers ────────────────────────────────────────────────────

function subscribe(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb);
  return () => window.removeEventListener(CHANGE_EVENT, cb);
}

function getSnapshot(): Theme {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'light' ? 'light' : 'dark';
}

// Server always returns dark (default). Cookie handles SSR correctness via layout.tsx.
function getServerSnapshot(): Theme {
  return 'dark';
}

// ── Side-effects ──────────────────────────────────────────────────────────────

function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

function persistTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  // Cookie is read server-side in layout.tsx to set data-theme before first paint.
  document.cookie = `${STORAGE_KEY}=${theme}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  // Notify useSyncExternalStore subscribers in this tab.
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    const next: Theme = getSnapshot() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    persistTheme(next);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    persistTheme(next);
  }, []);

  return { theme, setTheme, toggleTheme };
}
