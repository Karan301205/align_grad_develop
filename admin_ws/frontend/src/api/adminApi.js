// Admin Portal API client. Centralizes the backend base URL (previously
// hardcoded at every call site) and the "fetch -> res.json()" step behind named
// methods. Callers keep their own `.then(data => ...)`/`.catch(...)` handling,
// so response processing and state updates are unchanged.
const ADMIN_API_BASE = 'http://localhost:5002/api';

function getJson(path) {
  return fetch(`${ADMIN_API_BASE}${path}`).then(res => res.json());
}

export const adminApi = {
  getDashboardStats: () => getJson('/dashboard/stats'),
  getStudents: () => getJson('/student'),
  getRecruiters: () => getJson('/recruiter'),
  getJobs: () => getJson('/job'),
  getStorage: () => getJson('/storage/explorer'),
  getAnalytics: () => getJson('/analytics'),
  getJobApplicants: (jobId) => getJson(`/job/${jobId}/applicants`)
};
