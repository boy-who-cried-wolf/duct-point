
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
import { logError, logInfo, logWarning } from "./integrations/supabase/client";

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
  const { isAuthReady, user, platformRole } = useAuth();
  const [realtimeError, setRealtimeError] = useState<Error | null>(null);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);
  const MAX_INIT_ATTEMPTS = 3;
  
  // Initialize realtime tracking when app loads
  useEffect(() => {
    let isMounted = true;
    
    const initializeApp = async () => {
      try {
        // Add a small delay to ensure authentication is properly initialized
        // Increase delay with each attempt
        const delayMs = 500 * (initAttempts + 1);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        logInfo("APP: Attempting to initialize app", { 
          attempt: initAttempts + 1, 
          maxAttempts: MAX_INIT_ATTEMPTS,
          isAuthReady,
          userId: user?.id,
          role: platformRole
        });
        
        // Enable realtime tracking
        await enableRealtimeTracking();
        
        logInfo("APP: Realtime tracking enabled", {
          userId: user?.id,
          role: platformRole
        });
        
        if (isMounted) {
          setInitializationComplete(true);
        }
      } catch (err: any) {
        const newAttempt = initAttempts + 1;
        
        if (newAttempt < MAX_INIT_ATTEMPTS && isMounted) {
          logWarning("APP: Init attempt failed, will retry", { 
            error: err.message, 
            attempt: newAttempt,
            maxAttempts: MAX_INIT_ATTEMPTS 
          });
          
          setInitAttempts(newAttempt);
          return;
        }
        
        logError("APP: Failed to initialize app after max attempts", { 
          error: err.message,
          attempts: newAttempt
        });
        
        if (isMounted) {
          setRealtimeError(err);
          // Still mark as initialized to show the error UI instead of infinite loading
          setInitializationComplete(true);
        }
      }
    };
    
    // Only try to initialize if auth is ready
    if (isAuthReady && !initializationComplete && !realtimeError) {
      initializeApp();
    } else if (!isAuthReady) {
      logInfo("APP: Waiting for auth to be ready before initializing", {});
    }
    
    return () => {
      isMounted = false;
    };
  }, [isAuthReady, initAttempts, user?.id, platformRole, initializationComplete, realtimeError]);

  // Show loading until both auth is ready and initialization is complete
  if (!isAuthReady || !initializationComplete) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Loading application...</p>
        <p className="text-sm text-muted-foreground mt-2">
          {!isAuthReady ? "Checking authentication..." : "Initializing features..."}
        </p>
        {initAttempts > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Attempt {initAttempts + 1} of {MAX_INIT_ATTEMPTS}
          </p>
        )}
      </div>
    );
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
