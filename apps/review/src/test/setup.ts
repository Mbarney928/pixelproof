import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/vue';
import { afterEach, beforeEach, vi } from 'vitest';

// jsdom has no layout engine; give components the browser APIs they rely on.
const noop = () => undefined;
class ResizeObserverStub {
  observe = noop;
  unobserve = noop;
  disconnect = noop;
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);
window.scrollTo = () => undefined;

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});
afterEach(() => {
  cleanup();
});
