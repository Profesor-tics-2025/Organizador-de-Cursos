const API_URL = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth-error'));
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Error en la petición');
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: any) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => fetchApi('/auth/me'),
  updateProfile: (data: any) => fetchApi('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data: any) => fetchApi('/auth/password', { method: 'PUT', body: JSON.stringify(data) }),
  deleteAccount: () => fetchApi('/auth/account', { method: 'DELETE' }),

  // Courses
  getCourses: () => fetchApi('/courses'),
  createCourse: (data: any) => fetchApi('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id: string, data: any) => fetchApi(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id: string) => fetchApi(`/courses/${id}`, { method: 'DELETE' }),

  // Sessions
  getSessions: () => fetchApi('/sessions'),
  createSession: (data: any) => fetchApi('/sessions', { method: 'POST', body: JSON.stringify(data) }),
  deleteSession: (id: string) => fetchApi(`/sessions/${id}`, { method: 'DELETE' }),

  // Clients
  getClients: () => fetchApi('/clients'),
  createClient: (data: any) => fetchApi('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: any) => fetchApi(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) => fetchApi(`/clients/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => fetchApi('/settings'),
  updateSettings: (data: any) => fetchApi('/settings', { method: 'PUT', body: JSON.stringify(data) }),
};
