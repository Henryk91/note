/** HTTP status in an error thrown by the API layer ("Failed to …: 429 Too Many Requests") or set as `status`. */
export const errorStatus = (error: unknown): number | null => {
  const s = (error as { status?: unknown } | null)?.status;
  if (typeof s === 'number') return s;
  const m = /:\s(\d{3})\b/.exec((error as Error | null)?.message ?? '');
  return m ? Number(m[1]) : null;
};

/**
 * TanStack Query `retry` that only retries network errors and 5xx. A 4xx (above all 429 Too Many Requests)
 * gives the same answer again, so retrying only multiplies the requests and the console errors.
 */
export const retryUnlessClientError =
  (maxRetries: number) =>
  (failureCount: number, error: unknown): boolean => {
    const status = errorStatus(error);
    if (status !== null && status >= 400 && status < 500) return false;
    return failureCount < maxRetries;
  };
