import { errorStatus, retryUnlessClientError } from '../src/shared/utils/Helpers/retryPolicy';

describe('query retry policy', () => {
  const retry = retryUnlessClientError(2);
  test('reads the status from the API layer messages', () => {
    expect(errorStatus(new Error('Failed to fetch notes with children: 429 Too Many Requests'))).toBe(429);
    expect(errorStatus(new Error('Search failed: 503'))).toBe(503);
    expect(errorStatus(new TypeError('Failed to fetch'))).toBeNull();
  });
  test('never retries a 4xx (429 Too Many Requests, 404, 400)', () => {
    expect(retry(0, new Error('Failed to fetch note names: 429 Too Many Requests'))).toBe(false);
    expect(retry(0, new Error('Search failed: 404'))).toBe(false);
  });
  test('retries network errors and 5xx up to the limit', () => {
    expect(retry(0, new TypeError('Failed to fetch'))).toBe(true);
    expect(retry(1, new Error('Failed to fetch notes: 500 Internal Server Error'))).toBe(true);
    expect(retry(2, new Error('Failed to fetch notes: 500 Internal Server Error'))).toBe(false);
  });
});
