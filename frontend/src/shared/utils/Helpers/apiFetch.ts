async function refreshToken(): Promise<Response> {
  const res = await fetch('/api/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '',
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.reload();
  }
  return res;
}

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
  });

  if (res.status === 401) {
    const refRes = await refreshToken();
    if (refRes?.ok) return apiFetch(url, options);
  }

  return res;
}
