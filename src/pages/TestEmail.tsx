
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const TestEmail = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testEmailIntegration = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-email-integration');
      
      if (error) {
        toast.error('Error testing Loop.so integration', {
          description: error.message,
        });
        setResult({ error: error.message });
        return;
      }
      
      setResult(data);
      
      if (data.success) {
        toast.success('Successfully connected to Loop.so API', {
          description: 'The integration is working properly.',
        });
      } else {
        toast.error('Failed to connect to Loop.so API', {
          description: data.message || 'See details below',
        });
      }
    } catch (err: any) {
      toast.error('Exception occurred', {
        description: err.message,
      });
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Test Loop.so Email Integration</CardTitle>
          <CardDescription>
            This page lets you test if your Loop.so API connection is working properly.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-4">
              Click the button below to test your Loop.so integration. This will check if your API keys are properly configured
              and if the Edge Function can successfully communicate with Loop.so.
            </p>
            
            <Button 
              onClick={testEmailIntegration} 
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Integration...
                </>
              ) : (
                'Test Loop.so Integration'
              )}
            </Button>
          </div>
          
          {result && (
            <div className="mt-6 rounded-md border p-4">
              <h3 className="font-medium mb-2">API Response:</h3>
              <div className="bg-muted p-3 rounded text-sm font-mono overflow-auto max-h-96">
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            If the test fails, verify your Loop.so API Key and Workspace ID are correctly set in Supabase secrets.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TestEmail;
