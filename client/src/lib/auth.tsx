import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { User } from "@shared/schema";

// Authentication context type
type AuthContextType = {
  user: Omit<User, "password"> | null;
  isLoading: boolean;
  error: Error | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
};

// Register data type
type RegisterData = {
  username: string;
  password: string;
  name?: string;
  bio?: string;
  website?: string;
  profileImage?: string;
};

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Authentication provider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await response.json();
      
      // Save user and token
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      const data = await response.json();
      
      // Save user and token
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Registration failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Provide authentication state and functions
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication state and functions
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Custom fetch function that includes authentication token
 */
export async function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
}