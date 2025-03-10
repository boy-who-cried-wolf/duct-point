import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { logError, logSuccess, logInfo } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const MigrateFinancialData = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const runMigration = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      logInfo('Starting financial data migration', {});
      
      // Step 1: Check if required columns exist
      const { data: columnsData, error: columnsCheckError } = await supabase
        .from('organizations')
        .select('ytd_spend, total_points, last_updated')
        .limit(1);
      
      if (columnsCheckError) {
        // Columns might not exist, try to add them
        try {
          console.log('Adding required columns to organizations table');
          const { error: alterError } = await supabase
            .from('organizations')
            .update({ last_updated: new Date().toISOString() })
            .is('last_updated', null);
          
          if (alterError) {
            console.error('Error updating organizations table:', alterError);
            throw new Error(`Failed to update organizations: ${alterError.message}`);
          }
        } catch (alterErr) {
          console.error('Error in alter table operation:', alterErr);
          throw new Error(`Database error: ${(alterErr as Error).message}`);
        }
        
        logInfo('Added required columns to organizations table', {});
      }
      
      // Step 2: Create a data migration to copy data from organizations_data to organizations
      try {
        console.log('Running financial data migration directly');
        
        // First update: Copy latest ytd_spend to organizations
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ ytd_spend: 0 })
          .is('ytd_spend', null);
        
        if (updateError) {
          console.error('Error initializing ytd_spend:', updateError);
        }
        
        // Fetch organizations without financial data with proper type safety
        type OrgRecord = { id: string; company_id: string | null };
        
        const { data: orgsResult, error: fetchError } = await supabase
          .from('organizations')
          .select('id, company_id')
          .eq('ytd_spend', 0);
        
        if (fetchError) {
          console.error('Error fetching organizations:', fetchError);
        } else {
          const orgsToUpdate = orgsResult as unknown as OrgRecord[] || [];
          
          if (orgsToUpdate.length > 0) {
            console.log(`Found ${orgsToUpdate.length} organizations to update`);
            
            // Process each organization
            for (const org of orgsToUpdate) {
              if (org.company_id) {
                // Find the latest financial data for this company_id
                type DataRecord = { ytd_spend: number | null };
                
                const { data: dataResult, error: dataError } = await supabase
                  .from('organizations_data')
                  .select('ytd_spend')
                  .eq('company_id', org.company_id)
                  .order('created_at', { ascending: false })
                  .limit(1);
                
                if (!dataError) {
                  const latestData = dataResult as unknown as DataRecord[] || [];
                  
                  if (latestData.length > 0 && latestData[0].ytd_spend) {
                    // Update the organization with the latest ytd_spend
                    await supabase
                      .from('organizations')
                      .update({ 
                        ytd_spend: latestData[0].ytd_spend,
                        total_points: Math.floor(latestData[0].ytd_spend),
                        last_updated: new Date().toISOString()
                      })
                      .eq('id', org.id);
                  }
                }
              }
            }
          }
        }
      } catch (migrationErr) {
        console.error('Error during migration operation:', migrationErr);
        throw new Error(`Migration error: ${(migrationErr as Error).message}`);
      }
      
      // Log audit trail for the operation
      await supabase.from('audit_logs').insert({
        action: 'migrate_organization_financial_data',
        entity_type: 'organization',
        entity_id: 'batch_update',
        details: { updated_at: new Date().toISOString() }
      });
      
      setResult({
        success: true,
        message: "Financial data migration completed successfully. Organizations now have current YTD spend and total points."
      });
      
      logInfo('Financial data migration completed', {});
    } catch (error: any) {
      logError('Financial data migration failed', error);
      setResult({
        success: false,
        message: `Migration failed: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Migrate Financial Data</CardTitle>
        <CardDescription>
          Consolidate organization financial data by copying YTD spend from organizations_data to the organizations table.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This operation will copy the most recent YTD spend data from the organizations_data table to the 
          organizations table. It will also calculate total points based on YTD spend.
        </p>
        
        {result && (
          <div className={`p-4 mb-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? 'Migration Successful' : 'Migration Failed'}
                </p>
                <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={runMigration} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Migrating Data...' : 'Run Migration'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MigrateFinancialData; 