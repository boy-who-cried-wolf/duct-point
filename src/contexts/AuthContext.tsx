
import { createContext, useContext, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  isAuthenticated: boolean;
  platformRole: 'super_admin' | 'staff' | 'user' | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  logAuditEvent: (action: string, entityType: string, entityId: string, details?: any) => Promise<void>;
  isAuthReady: boolean;
  requestPasswordReset: (email: string) => Promise<void>;
}

// Create a mock user object
const mockUser = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "user@example.com",
  user_metadata: {
    full_name: "Demo User"
  },
  app_metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  aud: "authenticated",
} as User;

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Always set to authenticated with super_admin role
  const [isAuthenticated] = useState(true);
  const [platformRole] = useState<'super_admin' | 'staff' | 'user'>('super_admin');
  const [user] = useState<User | null>(mockUser);
  const [isAuthReady] = useState(true);

  // Mock functions that do nothing
  const login = async () => {
    console.log("Login bypassed - always authenticated");
  };

  const signup = async () => {
    console.log("Signup bypassed - always authenticated");
  };

  const logout = () => {
    console.log("Logout bypassed - always authenticated");
  };

  const logAuditEvent = async () => {
    console.log("Audit logging bypassed");
  };

  const requestPasswordReset = async () => {
    console.log("Password reset bypassed");
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated,
        platformRole,
        user,
        login, 
        logout,
        signup,
        logAuditEvent,
        isAuthReady,
        requestPasswordReset
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
