
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, FileText, CheckCircle } from 'lucide-react';
import { supabase, logError, logInfo, logSuccess, logWarning } from '@/integrations/supabase/client';
import Papa from 'papaparse';

interface CSVImportProps {
  onSuccess?: () => void;
}

interface RawCSVRow {
  'Customer ID': string;
  'Customer name': string;
  'YTD': string;
  [key: string]: string; // Allow for any additional columns
}

interface ProcessedCSVRow {
  company_id: string;
  company_name: string;
  ytd_spend: number;
}

const CSVImport = ({ onSuccess }: CSVImportProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFile(null);
    setUploadProgress(0);
  };

  const validateCSV = (results: Papa.ParseResult<RawCSVRow>): boolean => {
    // Check if we have data
    if (!results.data || results.data.length === 0) {
      toast.error('The CSV file appears to be empty. Please check the file and try again.');
      return false;
    }

    // Check for required headers
    const headers = Object.keys(results.data[0]);
    const requiredHeaders = ['Customer ID', 'Customer name', 'YTD'];

    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        toast.error(`Column '${header}' is missing. Please make sure your CSV has all required columns: Customer ID, Customer name, and YTD.`);
        return false;
      }
    }

    // Check for empty cells in required fields
    for (let i = 0; i < results.data.length; i++) {
      const row = results.data[i];
      
      if (!row['Customer ID']) {
        toast.error(`Row ${i + 1} is missing a Customer ID. Please fill in all required fields.`);
        return false;
      }
      
      if (!row['Customer name']) {
        toast.error(`Row ${i + 1} is missing a Customer name. Please fill in all required fields.`);
        return false;
      }
      
      if (!row['YTD']) {
        toast.error(`Row ${i + 1} is missing YTD value. Please fill in all required fields.`);
        return false;
      }

      // Validate YTD spend is a number
      if (isNaN(parseFloat(row['YTD']))) {
        toast.error(`Row ${i + 1} has an invalid YTD spend amount: ${row['YTD']}. Please make sure all YTD values are numbers.`);
        return false;
      }
    }

    return true;
  };

  const processCSVData = (rawData: RawCSVRow[]): ProcessedCSVRow[] => {
    return rawData.map(row => ({
      company_id: row['Customer ID'],
      company_name: row['Customer name'],
      ytd_spend: parseFloat(row['YTD'])
    }));
  };

  const handleUpload = () => {
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }

    // Check file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'csv') {
      toast.error('The file format is incorrect. Please upload a CSV file.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    Papa.parse<RawCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          logInfo('CSV parsing complete', { rows: results.data.length, errors: results.errors });
          console.log('CSV parsing complete', { rows: results.data.length, errors: results.errors });

          // Validate CSV content
          if (!validateCSV(results)) {
            setIsUploading(false);
            return;
          }

          setUploadProgress(30);

          // Process the data to map from CSV headers to database columns
          const processedData = processCSVData(results.data);
          
          // Create an upload record
          logInfo('Creating upload record', { file_name: file.name });
          
          const { data: uploadData, error: uploadError } = await supabase
            .from('organizations_data_uploads')
            .insert({
              file_name: file.name,
              row_count: processedData.length
            })
            .select();

          if (uploadError) {
            logError('Upload record creation failed', { 
              error: uploadError,
              code: uploadError.code,
              details: uploadError.details,
              message: uploadError.message
            });
            
            toast.error(`Failed to create upload record: ${uploadError.message}`);
            setIsUploading(false);
            return;
          }
          
          if (!uploadData || uploadData.length === 0) {
            logError('Upload record created but no data returned', {});
            toast.error('Failed to create upload record. Please try again or contact support.');
            setIsUploading(false);
            return;
          }

          const uploadId = uploadData[0].id;
          logInfo('Created upload record', { uploadId });
          console.log('Created upload record', { uploadId });
          setUploadProgress(50);

          // Process organizations - first ensure they exist
          const organizationsToInsert = [];
          const organizationsDataToInsert = [];

          for (const row of processedData) {
            // Create or update organization
            organizationsToInsert.push({
              name: row.company_name,
              company_id: row.company_id
            });

            // Add data to organizations_data (tracking history of all uploads)
            organizationsDataToInsert.push({
              upload_id: uploadId,
              company_id: row.company_id,
              company_name: row.company_name,
              ytd_spend: row.ytd_spend
            });
          }

          setUploadProgress(70);
          console.log('Processing organizations', { count: organizationsToInsert.length });

          // Batch insert organizations - create or update existing ones
          let orgInsertErrors = 0;
          for (const org of organizationsToInsert) {
            try {
              // First check if organization exists with this company_id
              const { data: existingOrg, error: queryError } = await supabase
                .from('organizations')
                .select('id')
                .eq('company_id', org.company_id)
                .maybeSingle();

              if (queryError) {
                logError('Error checking for existing organization', { 
                  error: queryError, 
                  company_id: org.company_id 
                });
                orgInsertErrors++;
                continue;
              }

              if (!existingOrg) {
                // Create new organization
                const { error: insertError } = await supabase
                  .from('organizations')
                  .insert(org);
                  
                if (insertError) {
                  logError('Failed to create new organization', { 
                    error: insertError, 
                    org 
                  });
                  orgInsertErrors++;
                } else {
                  console.log('Created new organization', org);
                }
              } else {
                // Update existing organization
                const { error: updateError } = await supabase
                  .from('organizations')
                  .update({ name: org.name })
                  .eq('company_id', org.company_id);
                  
                if (updateError) {
                  logError('Failed to update existing organization', { 
                    error: updateError, 
                    org 
                  });
                  orgInsertErrors++;
                } else {
                  console.log('Updated existing organization', org);
                }
              }
            } catch (err) {
              logError('Unexpected error in organization processing', err);
              orgInsertErrors++;
            }
          }

          if (orgInsertErrors > 0) {
            logWarning('Some organization records failed to process', { count: orgInsertErrors });
          }

          setUploadProgress(85);
          console.log('Inserting organization data', { count: organizationsDataToInsert.length });

          // Batch insert organizations_data with better error handling
          const { error: dataError } = await supabase
            .from('organizations_data')
            .insert(organizationsDataToInsert);

          if (dataError) {
            logError('Organization data insertion failed', { 
              error: dataError,
              code: dataError.code,
              details: dataError.details, 
              message: dataError.message
            });
            
            toast.error(`Failed to import organization data: ${dataError.message}`);
            
            // Even though the data insertion failed, we'll still mark the upload as complete
            // since we successfully created the upload record
            setUploadProgress(100);
            setIsUploading(false);
            return;
          }

          setUploadProgress(100);
          
          logSuccess('CSV import successful', { uploadId, rows: processedData.length });
          console.log('CSV import successful', { uploadId, rows: processedData.length });
          toast.success(`Successfully imported ${processedData.length} organizations from your CSV file.`);
          
          resetFileInput();
          
          if (onSuccess) {
            onSuccess();
          }
        } catch (error: any) {
          logError('CSV import failed', { 
            error, 
            message: error.message,
            stack: error.stack
          });
          console.error('CSV import failed:', error);
          toast.error('Failed to import CSV file. There was a problem processing your data. Please try again or contact support.');
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        logError('CSV parsing error', error);
        console.error('CSV parsing error:', error);
        toast.error('Failed to parse CSV file. Please check the file format and try again.');
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isUploading}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            CSV file must have columns for Customer ID, Customer name, and YTD.
          </p>
        </div>
        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          className="shrink-0"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      </div>

      {file && (
        <div className="flex items-center space-x-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span>{file.name}</span>
          <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {uploadProgress === 100 && !isUploading && (
        <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span>Upload complete</span>
        </div>
      )}
    </div>
  );
};

export default CSVImport;
