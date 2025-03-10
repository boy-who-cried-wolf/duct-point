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
    resetFileInput(); // Reset first to clear any previous state
    
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      // Validate file extension
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'csv') {
        toast.error('The file format is incorrect. Please upload a CSV file.');
        resetFileInput();
        return;
      }
      
      // Check file size (limit to 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File is too large. Please upload a CSV file smaller than 5MB.');
        resetFileInput();
        return;
      }
      
      setFile(selectedFile);
      console.log(`Selected file: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`);
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
    console.log('Validating CSV data:', results);
    
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

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    console.log('Starting CSV upload process');

    try {
      // Get current user session first
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        logError('Failed to get current user session', sessionError);
        toast.error('Authentication error. Please try logging in again.');
        setIsUploading(false);
        return;
      }
      
      const userId = sessionData.session?.user?.id;
      
      if (!userId) {
        logError('No authenticated user found for upload', {});
        toast.error('You must be logged in to upload CSV files.');
        setIsUploading(false);
        return;
      }
      
      // Use Promise-based approach for Papa.parse to better handle errors
      const parseCSV = (): Promise<Papa.ParseResult<RawCSVRow>> => {
        return new Promise((resolve, reject) => {
          Papa.parse<RawCSVRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: resolve,
            error: reject
          });
        });
      };
      
      try {
        // Parse the CSV file
        console.log('Parsing CSV file');
        const parseResult = await parseCSV();
        
        logInfo('CSV parsing complete', { rows: parseResult.data.length, errors: parseResult.errors });
        console.log('CSV parsing complete', { 
          rows: parseResult.data.length, 
          errors: parseResult.errors,
          firstFewRows: parseResult.data.slice(0, 3)
        });
        
        // Validate CSV content
        if (!validateCSV(parseResult)) {
          setIsUploading(false);
          return;
        }
        
        setUploadProgress(30);
        
        // Process the data to map from CSV headers to database columns
        const processedData = processCSVData(parseResult.data);
        console.log(`Processed ${processedData.length} rows of data`);
        
        // Create an upload record first
        logInfo('Creating upload record', { fileName: file.name, rowCount: processedData.length });
        
        // Add proper type definition for the uploadRecords
        interface UploadRecord {
          id: string;
          file_name: string;
          row_count: number;
          uploaded_by: string | null;
          created_at: string;
        }
        
        // Fix the type casting for upload records
        const { data: uploadRecords, error: uploadError } = await supabase
          .from('organizations_data_uploads')
          .insert({
            file_name: file.name,
            row_count: processedData.length,
            uploaded_by: userId
          })
          .select();
        
        if (uploadError) {
          throw new Error(`Failed to create upload record: ${uploadError.message}`);
        }
        
        if (!uploadRecords || uploadRecords.length === 0) {
          throw new Error('Upload record created but no ID returned');
        }
        
        // Safely cast to the proper type
        const uploadData = uploadRecords as unknown as UploadRecord[];
        const uploadId = uploadData[0].id;
        
        logInfo('Created upload record', { uploadId });
        console.log('Created upload record with ID:', uploadId);
        
        setUploadProgress(50);
        
        // Process organizations in batches
        const organizationsToInsert = processedData.map(row => ({
          name: row.company_name,
          company_id: row.company_id,
          last_updated: new Date().toISOString()
        }));
        
        const organizationsDataToInsert = processedData.map(row => ({
          upload_id: uploadId,
          company_id: row.company_id,
          company_name: row.company_name,
          ytd_spend: row.ytd_spend
        }));
        
        // Using smaller batches and tracking success/failure
        const batchSize = 15;
        let successCount = 0;
        let failureCount = 0;
        
        // Insert organizations in batches
        console.log(`Inserting/updating ${organizationsToInsert.length} organizations in batches of ${batchSize}`);
        
        for (let i = 0; i < organizationsToInsert.length; i += batchSize) {
          const batch = organizationsToInsert.slice(i, i + batchSize);
          try {
            const { error: batchError } = await supabase
              .from('organizations')
              .upsert(batch, { 
                onConflict: 'company_id',
                ignoreDuplicates: false
              });
            
            if (batchError) {
              console.error('Error in batch:', batchError);
              failureCount += batch.length;
            } else {
              successCount += batch.length;
            }
          } catch (err) {
            console.error('Exception in batch:', err);
            failureCount += batch.length;
          }
          
          // Update progress
          const progress = 50 + Math.floor((i / organizationsToInsert.length) * 30);
          setUploadProgress(Math.min(progress, 80));
        }
        
        console.log(`Organization upsert complete: ${successCount} succeeded, ${failureCount} failed`);
        
        // Update points based on ytd_spend
        try {
          // Instead of trying to update based on ytd_spend (which doesn't exist), 
          // just update the last_updated timestamp
          const { error: updateError } = await supabase
            .from('organizations')
            .update({ 
              last_updated: new Date().toISOString()
            })
            .is('total_points', null);
          
          if (updateError) {
            console.warn('Failed to update organizations timestamps', updateError);
          } else {
            console.log('Successfully updated organization timestamps');
          }
        } catch (updateErr) {
          console.error('Error updating organizations:', updateErr);
        }
        
        // Insert organizations_data records (historical data)
        console.log(`Inserting ${organizationsDataToInsert.length} history records`);
        
        successCount = 0;
        failureCount = 0;
        
        for (let i = 0; i < organizationsDataToInsert.length; i += batchSize) {
          const batch = organizationsDataToInsert.slice(i, i + batchSize);
          try {
            const { error: batchError } = await supabase
              .from('organizations_data')
              .insert(batch);
            
            if (batchError) {
              console.error('Error in data batch:', batchError);
              failureCount += batch.length;
            } else {
              successCount += batch.length;
            }
          } catch (err) {
            console.error('Exception in data batch:', err);
            failureCount += batch.length;
          }
        }
        
        console.log(`History records insert complete: ${successCount} succeeded, ${failureCount} failed`);
        setUploadProgress(90);
        
        // Add audit log
        await supabase
          .from('audit_logs')
          .insert({
            action: 'csv_import_completed',
            entity_type: 'organizations_data_uploads',
            entity_id: uploadId,
            details: {
              fileName: file.name,
              recordCount: processedData.length,
              successfulOrgs: successCount,
              failedOrgs: failureCount
            },
            user_id: userId
          });
        
        setUploadProgress(100);
        
        logSuccess('CSV import successful', {
          uploadId,
          rows: processedData.length,
          successCount,
          failureCount
        });
        
        toast.success(`Successfully imported ${successCount} organizations from CSV. ${failureCount > 0 ? `(${failureCount} records failed)` : ''}`);
        
        // Reset the file input and call onSuccess callback
        resetFileInput();
        if (onSuccess) {
          onSuccess();
        }
      } catch (parseError: any) {
        logError('CSV parsing/processing error', parseError);
        console.error('CSV parsing/processing error:', parseError);
        toast.error(`Error processing CSV: ${parseError.message || 'Unknown error'}`);
        setIsUploading(false);
      }
    } catch (error: any) {
      logError('Unexpected error during CSV import', error);
      toast.error(`An unexpected error occurred: ${error.message || 'Unknown error'}`);
      setIsUploading(false);
    }
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
