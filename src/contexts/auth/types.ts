
import { Session, User } from "@supabase/supabase-js";

export interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{
    data: {
      user: User | null;
      session: Session | null;
    } | null;
    error: Error | null;
  }>;
  signup: (email: string, password: string, fullName: string) => Promise<{
    data: {
      user: User | null;
      session: Session | null;
    } | null;
    error: Error | null;
  }>;
  logout: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}
