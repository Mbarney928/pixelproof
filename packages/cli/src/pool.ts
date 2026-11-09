/**
 * Runs `worker` over `items` with at most `concurrency` in flight and returns results in input order.
 * The first failure rejects the whole run once in-flight work settles, so no browser page leaks.
 */
export async function runPool<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  let failure: { error: unknown } | undefined;
  const lane = async () => {
    while (failure === undefined && next < items.length) {
      const index = next++;
      try {
        results[index] = await worker(items[index] as T, index);
      } catch (error) {
        failure ??= { error };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, lane));
  if (failure) throw failure.error;
  return results;
}
