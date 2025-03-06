
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { useAuth } from "./contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { enableRealtimeTracking } from "./integrations/supabase/enableRealtime";

const queryClient = new QueryClient();

// Loading screen component
const LoadingScreen = () => (
  <div className="h-screen w-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg font-medium">Loading application...</p>
    </div>
  </div>
);

// AppContent component to handle auth ready state
const AppContent = () => {
  const { isAuthReady } = useAuth();
  
  // Initialize realtime tracking when app loads
  useEffect(() => {
    enableRealtimeTracking().catch(err => {
      console.error("Failed to enable realtime tracking:", err);
    });
  }, []);

  if (!isAuthReady) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
