import { onBeforeUnmount, onMounted } from 'vue';

export type HotkeyMap = Record<string, (event: KeyboardEvent) => void>;

const TEXT_INPUTS = new Set(['text', 'search', 'email', 'number', 'password', 'url', 'tel']);

/** True when typing in this element should not trigger single-key shortcuts. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  return target instanceof HTMLInputElement && TEXT_INPUTS.has(target.type);
}

/**
 * Single-key shortcuts (e.g. `j`, `a`, `1`) for power users. Ignored while typing, and when a
 * modifier is held so browser and screen-reader shortcuts keep working.
 */
export function useHotkeys(map: HotkeyMap): void {
  const onKey = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (isTypingTarget(event.target)) return;
    const handler = map[event.key];
    if (!handler) return;
    event.preventDefault();
    handler(event);
  };
  onMounted(() => {
    window.addEventListener('keydown', onKey);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey);
  });
}
