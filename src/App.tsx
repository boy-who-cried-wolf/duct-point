
import React from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { useAuth } from "./contexts/AuthContext";
import { Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { enableRealtimeTracking } from "./integrations/supabase/enableRealtime";
import { Button } from "./components/ui/button";
import { logError, logInfo } from "./integrations/supabase/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      staleTime: 30000
    }
  }
});

// Error boundary component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
  <div className="h-screen w-full flex flex-col items-center justify-center p-6">
    <div className="max-w-md mx-auto flex flex-col items-center gap-4 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
        <Button onClick={resetErrorBoundary}>
          Try Again
        </Button>
      </div>
    </div>
  </div>
);

// Loading screen component
const LoadingScreen = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg font-medium">Loading application...</p>
    </div>
  </div>
);

// Define proper ErrorBoundary interface
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Custom error boundary class
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError("Error caught by boundary:", { error: error.message, info: info.componentStack });
  }
  
  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error as Error} resetErrorBoundary={this.resetErrorBoundary} />;
    }
    
    return this.props.children;
  }
}

// AppContent component to handle auth ready state
const AppContent = () => {
  const { isAuthReady } = useAuth();
  const [realtimeError, setRealtimeError] = useState<Error | null>(null);
  const [initializationComplete, setInitializationComplete] = useState(false);
  
  // Initialize realtime tracking when app loads
  useEffect(() => {
    let isMounted = true;
    
    const initializeApp = async () => {
      try {
        // Add a small delay to ensure authentication is properly initialized
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Enable realtime tracking
        await enableRealtimeTracking();
        
        logInfo("APP: Realtime tracking enabled", {});
        
        if (isMounted) {
          setInitializationComplete(true);
        }
      } catch (err: any) {
        logError("APP: Failed to initialize app", { error: err.message });
        
        if (isMounted) {
          setRealtimeError(err);
          // Still mark as initialized to show the error UI instead of infinite loading
          setInitializationComplete(true);
        }
      }
    };
    
    initializeApp();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Show loading until both auth is ready and initialization is complete
  if (!isAuthReady || !initializationComplete) {
    return <LoadingScreen />;
  }

  // Show error message if realtime setup failed
  if (realtimeError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-background">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Connection Error</h2>
        <p className="text-muted-foreground mb-2 text-center max-w-md">
          There was a problem connecting to the server: {realtimeError.message}
        </p>
        <Button onClick={() => window.location.reload()}>
          Reload Application
        </Button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
