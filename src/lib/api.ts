// src/api.ts

const API_BASE = process.env.API_BASE || 'http://localhost:4000';

export async function getApi<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${endpoint} failed: ${text || res.status}`);
  }

  return res.json();
}

export async function postApi<T = any>(endpoint: string, body?: Record<string, any>): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${endpoint} failed: ${text || res.status}`);
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

/**
 * DELETE helper.
 * - If you pass `query`, they’ll be appended to the URL as search params.
 * - If you pass `body`, it will be sent as JSON (some backends ignore DELETE bodies; use `query` if unsure).
 * - Handles 204/empty responses.
 */
export async function delApi<T = any>(
  endpoint: string,
  {
    query,
    body,
  }: {
    query?: Record<string, any>;
    body?: Record<string, any>;
  } = {}
): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const res = await fetch(url.toString(), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DELETE ${endpoint} failed: ${text || res.status}`);
  }

  if (res.status === 204) return undefined as T;

  // If server returns no JSON body, avoid parse error:
  const ct = res.headers.get('content-type') || '';
  if (!ct.toLowerCase().includes('application/json')) {
    return undefined as T;
  }

  return res.json();
}
