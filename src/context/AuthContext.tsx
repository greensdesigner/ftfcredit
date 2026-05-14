import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole, type UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, fullName: string, phone: string, role?: UserRole) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock persistence for demo purposes
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('ftf_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Failed to restore session:", e);
      localStorage.removeItem('ftf_user');
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      const loggedUser: UserProfile = data.user;
      
      setUser(loggedUser);
      localStorage.setItem('ftf_user', JSON.stringify(loggedUser));
    } catch (error: any) {
      console.error("Login failed:", error);
      alert(`Login failed: ${error.message}`);
      setLoading(false);
      throw error;
    }
    setLoading(false);
  };

  const signup = async (email: string, password: string, fullName: string, phone: string, role?: UserRole) => {
    setLoading(true);
    const uid = 'user_' + Math.random().toString(36).substr(2, 9);
    const assignedRole = role || UserRole.CLIENT;
    
    const userData = {
      uid,
      email,
      password,
      fullName,
      phone,
      role: assignedRole,
    };

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Signup failed on server');
      }

      const data = await response.json();

      // After successful signup, we can construct the profile for the state
      const profile: UserProfile = {
        uid,
        tenantId: data.tenantId,
        email,
        fullName,
        phone,
        role: assignedRole,
        onboardingStep: 1,
        plaidConnected: false,
        achAuthorized: false,
        createdAt: Date.now(),
      };

      setUser(profile);
      localStorage.setItem('ftf_user', JSON.stringify(profile));
    } catch (error: any) {
      console.error("Signup failed:", error);
      alert(`Signup failed: ${error.message}`);
      setLoading(false);
      throw error;
    }
    setLoading(false);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          ...data
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Update failed on server');
      }

      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('ftf_user', JSON.stringify(updatedUser));
    } catch (error: any) {
      console.error("Update profile failed:", error);
      alert(`Update failed: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('ftf_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
