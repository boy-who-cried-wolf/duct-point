
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';

const Login = () => {
  const navigate = useNavigate();
  
  // Auto-redirect to dashboard
  useEffect(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Logo className="h-12 w-12" />
          <h1 className="text-3xl font-bold">US-Duct Points</h1>
          <p className="text-muted-foreground">Auto-redirecting to dashboard...</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login Bypassed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center">Authentication has been disabled. You are automatically logged in.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
