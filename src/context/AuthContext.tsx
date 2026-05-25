import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole, type UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, fullName: string, phone: string, role?: UserRole, agencyName?: string, streetAddress?: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function handleFetchResponse(response: Response, actionName: string): Promise<any> {
  const contentType = response.headers.get("content-type") || "";
  
  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    if (text.includes("<!DOCTYPE") || text.includes("<html") || text.includes("<body")) {
      throw new Error(
        `সার্ভার থেকে JSON এর পরিবর্তে HTML ডকুমেন্ট পাওয়া গেছে। এর কারণ হতে পারেঃ\n\n` +
        `১. আপনার হোস্টিংয়ে (যেমন Hostinger/cPanel) Node.js ব্যাকএন্ড সার্ভারটি এখনো চালু করা হয়নি বা বন্ধ হয়ে আছে।\n` +
        `২. Nginx, Apache বা .htaccess রিরাইট রুল রিকুয়েস্টটিকে ব্যাকএন্ড প্রক্সি (/api) তে পাঠানোর পরিবর্তে সরাসরি ইন্ডেক্স ফাইলে পাঠিয়ে দিচ্ছে।\n\n` +
        `দয়া করে নিশ্চিত করুন আপনার Node.js সার্ভারটি (পোর্ট ৩০০০) চালু আছে এবং রিভার্স প্রক্সি কনফিগারেশন ঠিক আছে।\n\n` +
        `----------------\n` +
        `English: Server returned HTML instead of JSON. This usually means that your Node.js backend (Port 3000) is either not running on Hostinger/cPanel, or the Reverse Proxy routing for '/api' is missing or misconfigured in your .htaccess / Nginx server blocks.`
      );
    }
    throw new Error(`Server returned non-JSON response (${contentType || "unknown text"}): ${text.substring(0, 150)}`);
  }

  let data: any;
  try {
    data = await response.json();
  } catch (err: any) {
    throw new Error(`Failed to parse JSON response: ${err.message}`);
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || `${actionName} failed`);
  }

  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = React.useCallback(async () => {
    if (!user?.uid) return;
    try {
      const response = await fetch(`/api/users/${user.uid}`);
      if (response.ok) {
        const freshUser = await response.json();
        setUser(freshUser);
        localStorage.setItem('ftf_user', JSON.stringify(freshUser));
      }
    } catch (e) {
      console.error("Failed to refresh profile:", e);
    }
  }, [user?.uid]);

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

      const data = await handleFetchResponse(response, 'Login');
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

  const signup = async (email: string, password: string, fullName: string, phone: string, role?: UserRole, agencyName?: string, streetAddress?: string) => {
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
      agencyName,
      streetAddress,
    };

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await handleFetchResponse(response, 'Signup');

      // After successful signup, we can construct the profile for the state
      const profile: UserProfile = {
        uid,
        tenantId: data.tenantId,
        agencyName: agencyName,
        email,
        fullName,
        phone,
        role: assignedRole,
        streetAddress,
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

      await handleFetchResponse(response, 'Update');

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
    <AuthContext.Provider value={{ user, loading, login, logout, signup, updateProfile, refreshProfile }}>
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
