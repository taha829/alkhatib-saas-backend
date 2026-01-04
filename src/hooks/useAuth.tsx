import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
      }
    };
    loadUser();
    setLoading(false);

    const handleUserUpdate = () => loadUser();
    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      await authApi.register({ email, password, name });
      // In our NestJS setup, registration might return the user or an error
      // If the user wants to login immediately:
      return signIn(email, password);
    } catch (err: any) {
      const message = err.message;
      return { error: message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await authApi.login({ email, password });
      // data: { access_token, user }
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return { error: null };
    } catch (err: any) {
      const message = err.message;
      return { error: message };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    return { error: null };
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
};
