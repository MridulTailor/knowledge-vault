"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import { graphqlClient, useMutation } from "@/lib/graphql/client";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
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

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      graphqlClient.setToken(token);
      // Fetch user data
      graphqlClient
        .request<{ me: User }>(ME_QUERY)
        .then((data) => {
          if (data.me) {
            setUser(data.me);
          }
        })
        .catch(() => {
          // Token is invalid, remove it
          localStorage.removeItem("token");
          graphqlClient.setToken(null);
        })
        .finally(() => {
          setInitialLoading(false);
        });
    } else {
      setInitialLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const result = await loginMutation.execute({ email, password });
    const { token, user: userData } = result.login;

    graphqlClient.setToken(token);
    setUser(userData);
  };

  const signup = async (email: string, password: string, name?: string) => {
    const result = await signupMutation.execute({ email, password, name });
    const { token, user: userData } = result.signup;

    graphqlClient.setToken(token);
    setUser(userData);
  };

  const logout = () => {
    graphqlClient.setToken(null);
    setUser(null);
    // Ensure localStorage is cleared
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
