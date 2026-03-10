import type { CreateDrawRequest, DrawRecord } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}

export const drawApi = {
  list: () => request<DrawRecord[]>('/api/draws'),
  create: (payload: CreateDrawRequest) =>
    request<DrawRecord>('/api/draws', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
