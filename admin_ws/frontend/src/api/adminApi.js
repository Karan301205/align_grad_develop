// Validate required environment configuration
const rawAdminApiBase = import.meta.env.VITE_ADMIN_API_BASE_URL;

if (!rawAdminApiBase) {
  const errorMsg = '[Admin Portal Config Error] VITE_ADMIN_API_BASE_URL is not defined in environment variables. Please set it in your .env file to connect to the Admin backend.';
  if (import.meta.env.PROD) {
    throw new Error(errorMsg);
  } else {
    console.warn(errorMsg);
  }
}

// Consistent trailing-slash normalization
const ADMIN_API_BASE = (rawAdminApiBase || '').replace(/\/+$/, '');

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

const NETWORK_MESSAGE = "Can't reach the admin server right now. Check your connection and try again.";

// Every request goes through here. Failures are printed to the browser console with
// the technical detail (status, path, server `detail`); the UI only ever gets the
// plain `error` text from the server, or NETWORK_MESSAGE when the server can't be
// reached.
async function request(path, options = {}) {
  const method = options.method || 'GET';
  let res;
  try {
    res = await fetch(buildUrl(path), options);
  } catch (err) {
    console.error(`[admin api] ${method} ${path} could not reach the server:`, err);
    throw new Error(NETWORK_MESSAGE);
  }
  if (res.status === 401) {
    localStorage.removeItem('adminToken');
    window.dispatchEvent(new Event('admin-unauthorized'));
  }
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    console.error(`[admin api] ${method} ${path} → HTTP ${res.status}, response is not JSON:`, text.slice(0, 500));
    data = { success: false, error: 'Something went wrong on our side. Please try again in a moment.' };
  }
  if (!res.ok || data.success === false) {
    console.error(`[admin api] ${method} ${path} → HTTP ${res.status}:`, data.detail || data.error || data);
    if (data.success === undefined) data.success = false;
  }
  return data;
}

function getJson(path) {
  return request(path, { headers: getHeaders() });
}

function sendJson(path, method, body) {
  return request(path, {
    method,
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
}

function postJson(path, body) { return sendJson(path, 'POST', body); }
function putJson(path, body) { return sendJson(path, 'PUT', body); }
function deleteJson(path) { return sendJson(path, 'DELETE'); }
function patchJson(path, body) { return sendJson(path, 'PATCH', body); }

export const adminApi = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then((data) => {
      if (data.success === false || data.error) throw new Error(data.error || 'Authentication failed');
      return data;
    }),
  getDashboardStats: () => getJson('/dashboard/stats'),
  getOpportunityMetrics: () => getJson('/dashboard/opportunities'),
  getStudents: () => getJson('/student'),
  getRecruiters: () => getJson('/recruiter'),
  // decision: 'APPROVE' | 'REJECT'; reason required for rejections
  reviewRecruiterVerification: (recruiterId, decision, reason) =>
    patchJson(`/recruiter/${recruiterId}/verification`, { decision, reason }),
  getJobs: () => getJson('/job'),
  getStorage: () => getJson('/storage/explorer'),
  getAnalytics: () => getJson('/analytics'),
  getJobApplicants: (jobId) => getJson(`/job/${jobId}/applicants`),

  // Help & support tickets raised by candidates and recruiters
  getSupportTickets: () => getJson('/support/tickets'),
  getSupportTicket: (ticketId) => getJson(`/support/tickets/${ticketId}`),
  // Emails the reply to the requester; `resolve` also closes the ticket. `seenLastMessageAt` is the
  // conversation the admin is looking at: the server refuses (409, `stale`) if the requester wrote since.
  replyToSupportTicket: (ticketId, message, resolve = false, seenLastMessageAt) =>
    postJson(`/support/tickets/${ticketId}/reply`, { message, resolve, seenLastMessageAt }),
  // status: 'OPEN' | 'PENDING' | 'RESOLVED' (RESOLVED emails the requester)
  updateSupportTicketStatus: (ticketId, status, seenLastMessageAt) =>
    patchJson(`/support/tickets/${ticketId}/status`, { status, seenLastMessageAt }),

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

