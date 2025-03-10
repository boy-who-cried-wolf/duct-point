import React from "react";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { useAuth } from "./contexts/AuthContext";
import { Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { enableRealtimeTracking } from "./integrations/supabase/enableRealtime";
import { Button } from "./components/ui/button";
import { logError, logInfo, logWarning } from "./integrations/supabase/client";
import { useTiers, TiersProvider } from "./contexts/TiersContext";
import { Logo } from "./components/ui/logo";
import { Spinner } from "./components/ui/spinner";
import { ThemeProvider } from "./contexts/ThemeContext";

// Add full width styles to the root HTML element
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('w-full', 'max-w-none');
  document.body.classList.add('w-full', 'max-w-none');
}

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
const LoadingScreen = () => {
  const { isAuthReady, authError } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Logo className="h-16 w-auto mb-8" />
      <p className="text-lg font-medium mb-4">Loading DUCT Points...</p>
      
      {authError ? (
        <div className="bg-destructive/10 border border-destructive rounded-md p-4 my-4 max-w-md">
          <p className="font-semibold text-destructive mb-2">Authentication Error</p>
          <p className="text-sm">{authError}</p>
        </div>
      ) : (
        <Spinner size="lg" />
      )}
      
      <button 
        onClick={() => window.location.reload()}
        className="mt-8 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Refresh Application
      </button>
      <p className="text-xs text-muted-foreground mt-2">
        If loading takes too long, click the button above to refresh
      </p>
    </div>
  );
};

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
  const { isAuthenticated, isAuthReady } = useAuth();
  const { initialized, loading } = useTiers();
  const navigate = useNavigate();

  // Show loading screen until auth is ready
  if (!isAuthReady) {
    return <LoadingScreen />;
  }

  // Show loading screen until tiers are initialized, but only if authenticated
  if (isAuthenticated && !initialized && loading) {
    return <LoadingScreen />;
  }

  // Handle routing based on authentication status
  return <AppRoutes />;
};

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <TiersProvider>
              <Toaster />
              <AppContent />
            </TiersProvider>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
