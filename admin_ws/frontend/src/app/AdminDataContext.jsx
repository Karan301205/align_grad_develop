import { createContext, useContext } from 'react';
import { adminApi } from '../api/adminApi.js';
import useResource from '../hooks/useResource.js';

const AdminDataContext = createContext(null);

/**
 * The three lists several screens share (the sidebar badge, the dashboard, the
 * Companies and Candidates pages). Loaded once after login; each page's Refresh
 * button reloads the ones it shows.
 */
export function AdminDataProvider({ children }) {
  const stats = useResource(adminApi.getDashboardStats, (json) => json.stats);
  const students = useResource(adminApi.getStudents, (json) => json.students);
  const recruiters = useResource(adminApi.getRecruiters, (json) => json.recruiters);
  return <AdminDataContext.Provider value={{ stats, students, recruiters }}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const value = useContext(AdminDataContext);
  if (!value) throw new Error('useAdminData must be used inside <AdminDataProvider>');
  return value;
}
