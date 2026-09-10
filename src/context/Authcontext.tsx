import React, { createContext, useContext, type ReactNode } from 'react';
import { API_BASE_URL } from '../config/constants';
import { useNavigate } from 'react-router-dom';

interface LoginResponse {
  isSuccess: boolean;
  message?: string;
  token?: string;
  userName?: string;
}

interface AuthContextType {
  login: (usernameOrEmail: string, password: string) => Promise<LoginResponse | undefined>;
  logout: () => void;
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  initializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [user, setUser] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [initializing, setInitializing] = React.useState<boolean>(true); 
  const navigate = useNavigate();

  // Example login function - replace with your API call
  const login = async (
    usernameOrEmail: string,
    password: string
  ): Promise<LoginResponse | undefined> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernameOrEmail,
          password,
        }),
      });

      if (!response.ok) {
        return {
          isSuccess: false,
          message: 'فشل تسجيل الدخول. تحقق من بيانات المستخدم',
        };
      }

      const data: LoginResponse = await response.json();

      if (data.isSuccess && data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.userName || ''));

        setIsAuthenticated(true);
        setUser(data.userName);

        return {
          isSuccess: true,
          message: 'تم تسجيل الدخول بنجاح',
          token: data.token,
        };
      }

      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        isSuccess: false,
        message: 'حدث خطأ في الاتصال. يرجى المحاولة لاحقاً',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/'); // Redirect to login page after logout
  };

React.useEffect(() => {
  const token = localStorage.getItem('authToken');
  const savedUser = localStorage.getItem('user');

  if (token && savedUser) {
    try {
      // If you only ever store a plain username string, just use it directly:
      setUser(savedUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error parsing user data:', error);
      logout();
    }
  }
  setInitializing(false);
}, []);

  const value: AuthContextType = {
    login,
    logout,
    isAuthenticated,
    user,
    loading,
    initializing,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;