import { createContext, useContext } from 'react';
import { adminApi } from '../api/adminApi.js';
import useAutoRefresh from '../hooks/useAutoRefresh.js';
import useResource from '../hooks/useResource.js';

const AdminDataContext = createContext(null);

/**
 * The lists several screens share (the sidebar badges, the dashboard, the Companies,
 * Candidates and Support tickets pages). Loaded once after login; each page's Refresh
 * button reloads the ones it shows. Support tickets also refresh silently every 30 s
 * while the browser tab is in front.
 */
export function AdminDataProvider({ children }) {
  const stats = useResource(adminApi.getDashboardStats, (json) => json.stats);
  const students = useResource(adminApi.getStudents, (json) => json.students);
  const recruiters = useResource(adminApi.getRecruiters, (json) => json.recruiters);
  const supportTickets = useResource(adminApi.getSupportTickets, (json) => json.tickets);
  // New tickets show up (sidebar badge, Support tickets page) without a manual refresh.
  useAutoRefresh(supportTickets.reload, { intervalMs: 30000 });
  return <AdminDataContext.Provider value={{ stats, students, recruiters, supportTickets }}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const value = useContext(AdminDataContext);
  if (!value) throw new Error('useAdminData must be used inside <AdminDataProvider>');
  return value;
}
