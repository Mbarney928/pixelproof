import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type ThemeChoice = 'auto' | 'light' | 'dark';
const KEY = 'pixelproof:theme';

export function applyTheme(choice: ThemeChoice, root: HTMLElement = document.documentElement): void {
  if (choice === 'auto') delete root.dataset.theme;
  else root.dataset.theme = choice;
}

export function readTheme(): ThemeChoice {
  try {
    const saved = window.localStorage.getItem(KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'auto';
  } catch {
    return 'auto';
  }
}

export const useThemeStore = defineStore('theme', () => {
  const choice = ref<ThemeChoice>(readTheme());
  watch(
    choice,
    (value) => {
      applyTheme(value);
      try {
        window.localStorage.setItem(KEY, value);
      } catch {
        // Blocked storage only means the choice is not remembered.
      }
    },
    { immediate: true },
  );
  return { choice };
});
