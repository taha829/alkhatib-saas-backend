// Use environment variables for the API URL in production, or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export { BASE_URL };

export const apiFetch = async (endpoint: string, options: any = {}) => {
    const token = localStorage.getItem('token');
    const isFormData = options.body instanceof FormData;
    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const url = `${API_URL}${endpoint}`;

    try {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            console.warn('[API] Unauthorized - Clearing session');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.hash !== '#/auth') {
                window.location.hash = '#/auth';
            }
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            let errorMessage = 'Something went wrong';
            try {
                const error = await response.json();
                errorMessage = error.message || error.error || errorMessage;
            } catch (e) {
                errorMessage = response.statusText || `Server Error (${response.status})`;
            }
            throw new Error(errorMessage);
        }

        return response.json();
    } catch (error: any) {
        console.error('[API] Fetch error:', error.message);
        throw error;
    }
};

export const authApi = {
    login: (credentials: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (data: any) => apiFetch('/users', { method: 'POST', body: JSON.stringify(data) }),
};

export const adminApi = {
    getUsers: () => apiFetch('/users'),
    updateUser: (id: number, data: any) => apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const dataApi = {
    get: (url: string) => apiFetch(url),
    post: (url: string, data: any) => apiFetch(url, { method: 'POST', body: JSON.stringify(data) }),
    patch: (url: string, data: any) => apiFetch(url, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (url: string) => apiFetch(url, { method: 'DELETE' }),
    getContacts: () => apiFetch('/contacts'),
    syncContacts: () => apiFetch('/contacts/sync', { method: 'POST' }),
    getStats: () => apiFetch('/stats'),
};

export const groupsApi = {
    getAll: () => apiFetch('/groups'),
    create: (data: any) => apiFetch('/groups', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string | number, status: string) => apiFetch(`/groups/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string | number) => apiFetch(`/groups/${id}`, { method: 'DELETE' }),
};

export const postsApi = {
    getAll: () => apiFetch('/posts'),
};

export const whatsappApi = {
    getStatus: () => apiFetch('/whatsapp/status'),
    connect: () => apiFetch('/whatsapp/connect', { method: 'POST' }),
    logout: () => apiFetch('/whatsapp/logout', { method: 'DELETE' }),
    // Chats & Messages
    getChats: () => apiFetch('/whatsapp/chats'),
    getMessages: (id: string | number) => apiFetch(`/whatsapp/chats/${id}/messages`),
    send: (data: any) => apiFetch('/whatsapp/send', { method: 'POST', body: JSON.stringify(data) }),
    // Templates
    getTemplates: () => apiFetch('/whatsapp/templates'),
    createTemplate: (data: any) => apiFetch('/whatsapp/templates', { method: 'POST', body: JSON.stringify(data) }),
    updateTemplate: (id: number, data: any) => apiFetch(`/whatsapp/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTemplate: (id: number) => apiFetch(`/whatsapp/templates/${id}`, { method: 'DELETE' }),
};

export const appointmentsApi = {
    getAll: () => apiFetch('/appointments'),
    getStats: () => apiFetch('/appointments/stats'),
    create: (data: any) => apiFetch('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/appointments/${id}`, { method: 'DELETE' }),
};

export const notificationsApi = {
    getAll: () => apiFetch('/notifications'),
    getUnreadCount: () => apiFetch('/notifications/unread-count'),
    markRead: (id: number) => apiFetch(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => apiFetch('/notifications/mark-all-read', { method: 'PUT' }),
};
