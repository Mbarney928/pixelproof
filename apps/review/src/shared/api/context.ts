import { inject, type InjectionKey } from 'vue';

export interface ReportSource {
  /** Absolute URL of report.json; images resolve relative to it. */
  url: string;
  fetch: typeof fetch;
}

export const ReportSourceKey: InjectionKey<ReportSource> = Symbol('ReportSource');

export function useReportSource(): ReportSource {
  const source = inject(ReportSourceKey);
  if (!source) throw new Error('ReportSource not provided');
  return source;
}
