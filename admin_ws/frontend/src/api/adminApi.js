// Validate required environment configuration
const rawAdminApiBase = import.meta.env.VITE_ADMIN_API_BASE_URL;

if (!rawAdminApiBase && import.meta.env.PROD) {
  throw new Error('[Admin Portal Config Error] VITE_ADMIN_API_BASE_URL is required in production mode but is not defined.');
}

if (!rawAdminApiBase && import.meta.env.DEV) {
  console.warn('[Admin Portal Config Warning] VITE_ADMIN_API_BASE_URL is not set. Defaulting to local: http://localhost:5002/api');
}

// Consistent trailing-slash normalization
const ADMIN_API_BASE = (rawAdminApiBase || (import.meta.env.DEV ? 'http://localhost:5002/api' : '')).replace(/\/+$/, '');

function buildUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${ADMIN_API_BASE}${normalizedPath}`;
}

function getHeaders() {
  const token = localStorage.getItem('adminToken');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function getJson(path) {
  return fetch(buildUrl(path), {
    headers: getHeaders()
  }).then(res => {
    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      window.dispatchEvent(new Event('admin-unauthorized'));
    }
    return res.json();
  });
}

function sendJson(path, method, body) {
  const headers = { ...getHeaders(), 'Content-Type': 'application/json' };
  return fetch(buildUrl(path), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  }).then(res => {
    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      window.dispatchEvent(new Event('admin-unauthorized'));
    }
    return res.json();
  });
}

function postJson(path, body) { return sendJson(path, 'POST', body); }
function putJson(path, body) { return sendJson(path, 'PUT', body); }
function deleteJson(path) { return sendJson(path, 'DELETE'); }

export const adminApi = {
  login: (email, password) => {
    return fetch(buildUrl('/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    }).then(res => {
      if (!res.ok) {
        return res.json().then(err => {
          throw new Error(err.error || 'Authentication failed');
        });
      }
      return res.json();
    });
  },
  getDashboardStats: () => getJson('/dashboard/stats'),
  getStudents: () => getJson('/student'),
  getRecruiters: () => getJson('/recruiter'),
  getJobs: () => getJson('/job'),
  getStorage: () => getJson('/storage/explorer'),
  getAnalytics: () => getJson('/analytics'),
  getJobApplicants: (jobId) => getJson(`/job/${jobId}/applicants`),

  // Course & Lecture Video Management
  getCourses: () => getJson('/courses'),
  getCourse: (id) => getJson(`/courses/${id}`),
  createCourse: (data) => postJson('/courses', data),
  updateCourse: (id, data) => putJson(`/courses/${id}`, data),
  deleteCourse: (id) => deleteJson(`/courses/${id}`),
  getUploadUrl: (data) => postJson('/courses/upload-url', data),
  addModule: (courseId, data) => postJson(`/courses/${courseId}/modules`, data),
  updateModule: (courseId, moduleId, data) => putJson(`/courses/${courseId}/modules/${moduleId}`, data),
  deleteModule: (courseId, moduleId) => deleteJson(`/courses/${courseId}/modules/${moduleId}`),
  addLesson: (courseId, moduleId, data) => postJson(`/courses/${courseId}/modules/${moduleId}/lessons`, data),
  updateLesson: (courseId, moduleId, lessonId, data) => putJson(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, data),
  deleteLesson: (courseId, moduleId, lessonId) => deleteJson(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`)
};

