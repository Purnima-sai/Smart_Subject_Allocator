// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

export const API_ENDPOINTS = {
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  AUTH_SIGNUP: `${API_BASE_URL}/auth/signup`,
  STUDENT_DASHBOARD: `${API_BASE_URL}/students/dashboard`,
  STUDENT_SUBJECTS: `${API_BASE_URL}/students/subjects`,
  STUDENT_PREFERENCES: `${API_BASE_URL}/students/preferences`,
  FACULTY_DASHBOARD: `${API_BASE_URL}/faculty/dashboard`,
  ADMIN_DASHBOARD: `${API_BASE_URL}/admin/dashboard`,
  ADMIN_SUBJECTS: `${API_BASE_URL}/subjects`,
};

export default API_BASE_URL;
