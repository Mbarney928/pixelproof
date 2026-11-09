import { createReviewApp } from '@/app/createApp';
import { applyTheme, readTheme } from '@/features/theme-toggle';
import { ReportError, resolveReportUrl } from '@/shared/api';

// Apply the saved theme before the first paint to avoid a light-to-dark flash.
applyTheme(readTheme());

let url: string;
try {
  url = resolveReportUrl(window.location.search, window.location.href);
} catch (error) {
  // An unsafe ?report= value: fall back to an address that will show a clear error state.
  url = new URL('report/invalid-location.json', window.location.href).toString();
  if (error instanceof ReportError) console.warn(error.message);
}

const { app } = createReviewApp({ source: { url, fetch: (...args) => window.fetch(...args) } });
app.mount('#app');
