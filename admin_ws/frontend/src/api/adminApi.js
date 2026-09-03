const ADMIN_API_BASE =
  import.meta.env.VITE_ADMIN_API_BASE_URL ||
  "https://admin.aligngrad.com/api";

function getHeaders() {
  const token = localStorage.getItem('adminToken');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function getJson(path) {
  return fetch(`${ADMIN_API_BASE}${path}`, {
    headers: getHeaders()
  }).then(res => {
    if (res.status === 401) {
      localStorage.removeItem('adminToken');
      window.dispatchEvent(new Event('admin-unauthorized'));
    }
    return res.json();
  });
}

export const adminApi = {
  login: (email, password) => {
    return fetch(`${ADMIN_API_BASE}/auth/login`, {
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
  getJobApplicants: (jobId) => getJson(`/job/${jobId}/applicants`)
};
