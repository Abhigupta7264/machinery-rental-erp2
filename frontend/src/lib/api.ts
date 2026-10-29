const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `Request failed with status ${response.status}` };
    }
    const message = errorData.detail || errorData.error || (typeof errorData === 'object' ? JSON.stringify(errorData) : 'API Error');
    throw new Error(message);
  }

  // Handle empty 204 or responses with no body
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    apiRequest<{ token: string; user: any }>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  logout: () =>
    apiRequest('/api/auth/logout/', { method: 'POST' }),
  getCurrentUser: () =>
    apiRequest('/api/auth/me/'),
  getUsers: (role?: string) =>
    apiRequest(`/api/auth/users/${role ? `?role=${role}` : ''}`),

  // Company Settings
  getSettings: () =>
    apiRequest('/api/common/settings/'),
  updateSettings: (data: any) =>
    apiRequest('/api/common/settings/', { method: 'PUT', body: JSON.stringify(data) }),

  // Dashboard Metrics
  getDashboardMetrics: (params?: { site?: string; date_from?: string; date_to?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return apiRequest(`/api/analytics/dashboard/${q ? `?${q}` : ''}`);
  },

  // Logsheets
  getLogsheets: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest<{ results: any[]; count: number } | any[]>(`/api/logsheets/${q ? `?${q}` : ''}`);
  },
  getLogsheet: (id: string) =>
    apiRequest(`/api/logsheets/${id}/`),
  createLogsheet: (data: any) =>
    apiRequest('/api/logsheets/', { method: 'POST', body: JSON.stringify(data) }),
  updateLogsheet: (id: string, data: any) =>
    apiRequest(`/api/logsheets/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  submitLogsheet: (id: string) =>
    apiRequest(`/api/logsheets/${id}/submit/`, { method: 'POST' }),
  approveLogsheet: (id: string) =>
    apiRequest(`/api/logsheets/${id}/approve/`, { method: 'POST' }),
  rejectLogsheet: (id: string, reason: string) =>
    apiRequest(`/api/logsheets/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  voidLogsheet: (id: string, reason: string) =>
    apiRequest(`/api/logsheets/${id}/void/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getNextLogsheetNumber: () =>
    apiRequest<{ next_number: string }>('/api/logsheets/next_number/'),
  getLogsheetPdfUrl: (id: string) =>
    `${BASE_URL}/api/logsheets/${id}/pdf/`,

  // Fleet
  getMachines: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest<{ results: any[] } | any[]>(`/api/fleet/machines/${q ? `?${q}` : ''}`);
  },
  createMachine: (data: any) =>
    apiRequest('/api/fleet/machines/', { method: 'POST', body: JSON.stringify(data) }),
  getMachineCategories: () =>
    apiRequest<{ results: any[] } | any[]>('/api/fleet/categories/'),

  // Customers & Sites
  getCustomers: () =>
    apiRequest<{ results: any[] } | any[]>('/api/customers/customers/'),
  getProjects: (customerId?: string) =>
    apiRequest<{ results: any[] } | any[]>(`/api/customers/projects/${customerId ? `?customer=${customerId}` : ''}`),
  getSites: (projectId?: string) =>
    apiRequest<{ results: any[] } | any[]>(`/api/customers/sites/${projectId ? `?project=${projectId}` : ''}`),

  // Operators
  getOperators: () =>
    apiRequest<{ results: any[] } | any[]>('/api/operators/'),

  // Fuel Records
  getFuelRecords: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest<{ results: any[] } | any[]>(`/api/fuel/${q ? `?${q}` : ''}`);
  },
  createFuelRecord: (data: any) =>
    apiRequest('/api/fuel/', { method: 'POST', body: JSON.stringify(data) }),

  // Maintenance
  getMaintenanceRecords: () =>
    apiRequest<{ results: any[] } | any[]>('/api/maintenance/'),

  // Invoices & Billing
  getInvoices: () =>
    apiRequest<{ results: any[] } | any[]>('/api/billing/invoices/'),
  generateInvoiceFromLogsheets: (customer: string, logsheet_ids: string[]) =>
    apiRequest('/api/billing/invoices/generate_from_logsheets/', {
      method: 'POST',
      body: JSON.stringify({ customer, logsheet_ids }),
    }),
};

