import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi.js';

/** The admin's login state. The API client fires "admin-unauthorized" when a token is refused. */
export default function useAdminAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'));

  useEffect(() => {
    const onUnauthorized = () => setToken(null);
    window.addEventListener('admin-unauthorized', onUnauthorized);
    return () => window.removeEventListener('admin-unauthorized', onUnauthorized);
  }, []);

  /** Throws an Error with a plain message when the credentials are refused. */
  const login = useCallback(async (email, password) => {
    const data = await adminApi.login(email, password);
    if (!data.token) throw new Error(data.error || 'Invalid email or password');
    localStorage.setItem('adminToken', data.token);
    setToken(data.token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    setToken(null);
  }, []);

  return { token, login, logout };
}
