"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { graphqlClient, useMutation } from "@/lib/graphql/client";

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  setSession: (token: string, user?: User) => Promise<User | null>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ME_QUERY = `
  query Me {
    me {
      id
      email
      name
    }
  }
`;

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

const SIGNUP_MUTATION = `
  mutation Signup($email: String!, $password: String!, $name: String) {
    signup(email: $email, password: $password, name: $name) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const loginMutation = useMutation<{ login: { token: string; user: User } }>(
    LOGIN_MUTATION
  );
  const signupMutation = useMutation<{ signup: { token: string; user: User } }>(
    SIGNUP_MUTATION
  );

  const fetchCurrentUser = useCallback(async (token: string) => {
    graphqlClient.setToken(token);
    try {
      const data = await graphqlClient.request<{ me: User }>(ME_QUERY);
      if (data?.me) {
        setUser(data.me);
        return data.me;
      }
      return null;
    } catch (err) {
      console.error("Failed to fetch current user with token:", err);
      localStorage.removeItem("token");
      graphqlClient.setToken(null);
      setUser(null);
      return null;
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchCurrentUser(token);
    } else {
      setInitialLoading(false);
    }

    // Handle cross-tab token synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token") {
        if (e.newValue) {
          fetchCurrentUser(e.newValue);
        } else {
          setUser(null);
          graphqlClient.setToken(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchCurrentUser]);

  const setSession = async (token: string, userData?: User): Promise<User | null> => {
    localStorage.setItem("token", token);
    graphqlClient.setToken(token);

    if (userData) {
      setUser(userData);
      setInitialLoading(false);
      return userData;
    }

    setInitialLoading(true);
    return fetchCurrentUser(token);
  };

  const login = async (email: string, password: string) => {
    const result = await loginMutation.execute({ email, password });
    const { token, user: userData } = result.login;

    await setSession(token, userData);
  };

  const signup = async (email: string, password: string, name?: string) => {
    const result = await signupMutation.execute({ email, password, name });
    const { token, user: userData } = result.signup;

    await setSession(token, userData);
  };

  const logout = () => {
    graphqlClient.setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        setSession,
        logout,
        loading: initialLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
