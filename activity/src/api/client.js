const API_URL = import.meta.env.VITE_API_URL || '/api';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      'ngrok-skip-browser-warning': 'true',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.error || `Error ${res.status}`);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined }),
  postForm: (path, formData) => request(path, { method: 'POST', body: formData }),
  put: (path, body) => request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path, body) => request(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
};
