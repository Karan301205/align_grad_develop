import { BookOpen, Briefcase, Building2, ChartColumn, HardDrive, LayoutDashboard, LifeBuoy, Users } from 'lucide-react';

// Only screens the admin backend can serve. `id` is the key in app/AdminShell.jsx.
export const NAV_GROUPS = [
  { label: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'Manage',
    items: [
      { id: 'companies', label: 'Companies (HR)', icon: Building2 },
      { id: 'candidates', label: 'Candidates', icon: Users },
      { id: 'jobs', label: 'Job postings', icon: Briefcase },
      { id: 'support', label: 'Support tickets', icon: LifeBuoy }
    ]
  },
  { label: 'Learning', items: [{ id: 'courses', label: 'Course management', icon: BookOpen }] },
  {
    label: 'Insights',
    items: [
      { id: 'analytics', label: 'Analytics', icon: ChartColumn },
      { id: 'storage', label: 'Storage explorer', icon: HardDrive }
    ]
  }
];
