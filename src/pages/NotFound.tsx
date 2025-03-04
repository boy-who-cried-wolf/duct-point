
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
      <Logo size="lg" className="mb-4" />
      <h1 className="text-7xl font-bold tracking-tighter mb-2">404</h1>
      <p className="text-xl mb-8">Oops! The page you're looking for doesn't exist.</p>
      <Button onClick={() => navigate('/dashboard')}>
        Return to Dashboard
      </Button>
    </div>
  );
};

export default NotFound;
