import { apiFetch } from "../Helpers/apiFetch";
import { db, QueuedRequest } from "./db";

export async function enqueueRequest(
  req: Omit<QueuedRequest, "id" | "createdAt">
) {
  await db.requests.add({
    ...req,
    createdAt: Date.now(),
  });
}

export async function getAllRequests() {
  return db.requests.orderBy("createdAt").toArray();
}

export async function deleteRequest(id: number) {
  return db.requests.delete(id);
}

/**
 * Send a JSON request or queue it if offline / network error.
 */
export async function sendOrQueueJSON<TResponse = unknown>(
  url: string,
  body: any,
  init?: {
    method?: "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: Record<string, string>;
  }
): Promise<
  | { queued: true; response?: undefined; error?: string }
  | { queued: false; response: TResponse }
> {
  const method = init?.method ?? "POST";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };

  const request = { url, method, headers, body };

  // If browser reports offline: queue immediately
  if (!navigator.onLine) {
    await enqueueRequest(request);
    return { queued: true };
  }

  try {
    const res = await apiFetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      // HTTP error (but network okay) – do NOT queue, just throw
      throw new Error(`HTTP ${res.status}`);
    }

    const json = (await res.json()) as TResponse;
    return { queued: false, response: json };
  } catch (err) {
    // Network error: queue for later
    await enqueueRequest(request);
    return {
      queued: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Flush all queued requests in FIFO order.
 * Called when app starts (if online) and whenever we get an `online` event.
 */
export async function flushQueue() {
  const items = await getAllRequests();

  for (const item of items) {
    try {
      const res = await apiFetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body != null ? JSON.stringify(item.body) : undefined,
      });

      if (res.ok) {
        if (item.id != null) {
          await deleteRequest(item.id);
        }
      } else {
        // Server reachable but returned error – stop trying this one,
        // but keep it in the queue or handle differently if you want.
        // For now, we leave it in the queue.
        // You could also log this somewhere.
      }
    } catch {
      // Still offline or network flakey – stop here and try again next time.
      break;
    }
  }
}
