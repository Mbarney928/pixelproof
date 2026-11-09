import { useQuery } from '@tanstack/vue-query';

import { fetchReport, useReportSource } from '@/shared/api';

/** The run report. It never changes while open, so it is fetched once and kept. */
export function useReport() {
  const source = useReportSource();
  return useQuery({
    queryKey: ['report', source.url],
    queryFn: () => fetchReport(source.url, source.fetch),
    staleTime: Infinity,
    retry: (count, error) => error.name !== 'ReportError' && count < 2,
  });
}
