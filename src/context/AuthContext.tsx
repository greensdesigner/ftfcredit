import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole, type UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, fullName: string, phone: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock persistence for demo purposes
  useEffect(() => {
    const savedUser = localStorage.getItem('ftf_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, role: UserRole) => {
    setLoading(true);
    // Mock login logic
    const mockUser: UserProfile = {
      uid: 'user_' + Math.random().toString(36).substr(2, 9),
      email,
      fullName: email.split('@')[0],
      role,
      onboardingStep: role === UserRole.ADMIN ? 4 : 1,
      plaidConnected: false,
      achAuthorized: false,
      createdAt: Date.now(),
    };
    setUser(mockUser);
    localStorage.setItem('ftf_user', JSON.stringify(mockUser));
    setLoading(false);
  };

  const signup = async (email: string, fullName: string, phone: string) => {
    setLoading(true);
    const uid = 'user_' + Math.random().toString(36).substr(2, 9);
    const mockUser: UserProfile = {
      uid,
      email,
      fullName,
      phone,
      role: UserRole.CLIENT,
      onboardingStep: 1,
      plaidConnected: false,
      achAuthorized: false,
      createdAt: Date.now(),
    };

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Signup failed on server');
      }

      setUser(mockUser);
      localStorage.setItem('ftf_user', JSON.stringify(mockUser));
    } catch (error: any) {
      console.error("Signup failed:", error);
      alert(`Signup failed: ${error.message}`);
      setLoading(false);
      throw error; // Re-throw to prevent navigation in the page
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
    <AuthContext.Provider value={{ user, loading, login, logout, signup }}>
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
