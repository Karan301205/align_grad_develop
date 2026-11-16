import LoginPage from '../features/auth/LoginPage.jsx';
import { AdminDataProvider } from './AdminDataContext.jsx';
import { NavigationProvider } from './NavigationContext.jsx';
import AdminShell from './AdminShell.jsx';
import useAdminAuth from './useAdminAuth.js';

export default function App() {
  const { token, login, logout } = useAdminAuth();
  if (!token) return <LoginPage onLogin={login} />;
  return (
    <AdminDataProvider>
      <NavigationProvider>
        <AdminShell onLogout={logout} />
      </NavigationProvider>
    </AdminDataProvider>
  );
}
