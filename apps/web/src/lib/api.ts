const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options;
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      (body as { message?: string }).message ?? 'Error en la petición',
    );
  }

  return res.json() as Promise<T>;
}

function filenameFromDisposition(header: string | null, fallback: string) {
  if (!header) return fallback;
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match?.[1] ?? fallback;
}

async function downloadBlob(
  path: string,
  token: string,
  fallbackFilename: string,
): Promise<void> {
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { method: 'GET', headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      (body as { message?: string }).message ?? 'Error al descargar',
    );
  }

  const blob = await res.blob();
  const filename = filenameFromDisposition(
    res.headers.get('Content-Disposition'),
    fallbackFilename,
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'GET', token }),

  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), token }),

  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),

  delete: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'DELETE', token }),

  download: (path: string, token: string, fallbackFilename: string) =>
    downloadBlob(path, token, fallbackFilename),
};
