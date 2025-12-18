import axios from 'axios';

// Base URL for API; defaults to local dev, can be overridden via VITE_API_URL at build time
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me')
};

// OTP APIs
export const otpAPI = {
  requestReset: (email) => api.post('/otp/request-reset', { email }),
  verifyOTP: (email, otp) => api.post('/otp/verify', { email, otp }),
  resetPassword: (email, otp, newPassword) => api.post('/otp/reset-password', { email, otp, newPassword })
};

// User APIs
export const userAPI = {
  getAllUsers: (params) => api.get('/users', { params }),
  getTeamLeads: (workspaceId) => api.get(`/users/team-leads/${workspaceId}`),
  addUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getWorkspaces: () => api.get('/users/workspaces/all')
};

// Email APIs
export const emailAPI = {
  syncEmails: () => api.post('/emails/sync'),
  getAllEmails: () => api.get('/emails'),
  getEmailById: (id) => api.get(`/emails/${id}`),
  downloadAttachment: (emailId, attachmentId) => api.get(`/emails/${emailId}/attachments/${attachmentId}`, { responseType: 'blob' }),
  deleteEmail: (id) => api.delete(`/emails/${id}`)
};

// Ticket APIs
export const ticketAPI = {
  getAllTickets: () => api.get('/tickets'),
  createTicket: (ticketData) => api.post('/tickets', ticketData),
  updateTicket: (id, ticketData) => api.put(`/tickets/${id}`, ticketData),
  deleteTicket: (id) => api.delete(`/tickets/${id}`),
  getEmailsByJobId: (jobId) => api.get(`/tickets/emails/${jobId}`),
  assignTicket: (id, payload) => api.post(`/tickets/${id}/assign`, payload)
};

// Team Member APIs
export const teamMemberAPI = {
  getAllTeamMembers: () => api.get('/team-members'),
  getGroupedTeamMembers: () => api.get('/team-members/grouped'),
  getMyTasks: () => api.get('/team-members/my-tasks/current'),
  getTeamMemberTasks: (memberName) => api.get(`/team-members/${encodeURIComponent(memberName)}/tasks`),
  createTeamMember: (memberData) => api.post('/team-members', memberData),
  updateTeamMember: (id, memberData) => api.put(`/team-members/${id}`, memberData),
  deleteTeamMember: (id) => api.delete(`/team-members/${id}`)
};

export default api;
