// src/api.ts

// IMPORTANT: keep API_BASE as a SAME-ORIGIN prefix so browser requests go to :3000,
// then Next.js rewrites will proxy to :4000.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

export function mediaUrl(id?: string) {
  return id ? `/media/${encodeURIComponent(id)}` : undefined; // same-origin -> rewritten
}

function buildUrl(endpoint: string, params?: Record<string, any>) {
  const url = new URL(
    `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
    // make it relative to current origin (works on server/client)
    typeof window === 'undefined'
      ? 'https://mranalini.in' // SSR fallback (won't be used by the browser)
      : window.location.origin
  );
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

export async function getApi<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = buildUrl(endpoint, params);
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${endpoint} failed: ${text || res.status}`);
  }
  return res.json();
}

export async function postApi<T = any>(endpoint: string, body?: Record<string, any>): Promise<T> {
  const url = buildUrl(endpoint);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST ${endpoint} failed: ${text || res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function delApi<T = any>(
  endpoint: string,
  { query, body }: { query?: Record<string, any>; body?: Record<string, any> } = {}
): Promise<T> {
  const url = buildUrl(endpoint, query);
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`DELETE ${endpoint} failed: ${text || res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') || '';
  if (!ct.toLowerCase().includes('application/json')) return undefined as T;
  return res.json();
}
