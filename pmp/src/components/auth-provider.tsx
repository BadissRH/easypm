
"use client";

import { useRouter, usePathname } from "next/navigation";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * @typedef {object} User - Represents the authenticated user's data.
 * @property {string} id - The user's unique identifier.
 * @property {string} name - The user's full name.
 * @property {string} email - The user's email address.
 * @property {"Administrator" | "Project Manager" | "Collaborator"} role - The user's role, which determines their permissions.
 */
type User = {
  id: string;
  name: string;
  email: string;
  role: "Administrator" | "Project Manager" | "Collaborator";
};

/**
 * @typedef {object} AuthContextType - The shape of the authentication context.
 * @property {User | null} user - The current authenticated user, or null if not logged in.
 * @property {(user: User) => void} login - Function to log in a user.
 * @property {() => void} logout - Function to log out the current user.
 * @property {boolean} loading - A boolean indicating if the initial auth state is being loaded.
 */
type AuthContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provides authentication state and functions to its children.
 * It handles user session management, routing protection, and loading states.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components that need access to the auth context.
 * @returns {JSX.Element} The rendered AuthProvider component.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');
      if (!user && !isAuthPage) {
        router.push("/login");
      } else if (user && isAuthPage) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, pathname, router]);

  const login = (userData: User) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');
  if (!user && !isAuthPage) {
      return (
         <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
  }


  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * A custom hook to access the authentication context.
 * Throws an error if used outside of an `AuthProvider`.
 * @returns {AuthContextType} The authentication context.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
