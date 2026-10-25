// Central fetch wrapper that automatically handles 401 Session Timeout
export async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/assets/login';
    }
  }
  return res;
}
