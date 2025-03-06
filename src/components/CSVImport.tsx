
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, FileText, CheckCircle } from 'lucide-react';
import { supabase, logError, logInfo, logSuccess } from '@/integrations/supabase/client';
import { useAuth } from '@/App';
import Papa from 'papaparse';

interface CSVImportProps {
  onSuccess?: () => void;
}

interface CSVRow {
  company_id: string;
  company_name: string;
  ytd_spend: string;
  [key: string]: string; // Allow for any additional columns
}

const CSVImport = ({ onSuccess }: CSVImportProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, logAuditEvent } = useAuth();

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

  const validateCSV = (results: Papa.ParseResult<CSVRow>): boolean => {
    // Check if we have data
    if (!results.data || results.data.length === 0) {
      toast.error('The CSV file is empty.');
      return false;
    }

    // Check for required headers
    const headers = Object.keys(results.data[0]);
    const requiredHeaders = ['company_id', 'company_name', 'ytd_spend'];

    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        toast.error(`Missing required column: ${header}`);
        return false;
      }
    }

    // Check for empty cells in required fields
    for (let i = 0; i < results.data.length; i++) {
      const row = results.data[i];
      for (const header of requiredHeaders) {
        if (!row[header]) {
          toast.error(`Row ${i + 1} has missing ${header}`);
          return false;
        }
      }

      // Validate YTD spend is a number
      if (isNaN(parseFloat(row.ytd_spend))) {
        toast.error(`Row ${i + 1} has invalid YTD spend: ${row.ytd_spend}`);
        return false;
      }
    }

    return true;
  };

  const handleUpload = () => {
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          logInfo('CSV parsing complete', { rows: results.data.length, errors: results.errors });

          // Validate CSV content
          if (!validateCSV(results)) {
            setIsUploading(false);
            return;
          }

          setUploadProgress(30);

          // Create an upload record
          const { data: uploadData, error: uploadError } = await supabase
            .from('organizations_data_uploads')
            .insert({
              uploaded_by: user?.id,
              file_name: file.name,
              row_count: results.data.length
            })
            .select();

          if (uploadError) {
            throw uploadError;
          }

          const uploadId = uploadData[0].id;
          logInfo('Created upload record', { uploadId });
          setUploadProgress(50);

          // Process each row
          const organizationsToInsert = [];
          const organizationsDataToInsert = [];

          for (const row of results.data) {
            // Create or update organization
            organizationsToInsert.push({
              name: row.company_name,
              company_id: row.company_id
            });

            // Add data to organizations_data
            organizationsDataToInsert.push({
              upload_id: uploadId,
              company_id: row.company_id,
              company_name: row.company_name,
              ytd_spend: parseFloat(row.ytd_spend)
            });
          }

          setUploadProgress(70);

          // Batch insert organizations
          for (const org of organizationsToInsert) {
            // First check if organization exists with this company_id
            const { data: existingOrg } = await supabase
              .from('organizations')
              .select('id')
              .eq('company_id', org.company_id)
              .maybeSingle();

            if (!existingOrg) {
              // Create new organization
              await supabase
                .from('organizations')
                .insert(org);
            } else {
              // Update existing organization
              await supabase
                .from('organizations')
                .update({ name: org.name })
                .eq('company_id', org.company_id);
            }
          }

          setUploadProgress(85);

          // Batch insert organizations_data
          const { error: dataError } = await supabase
            .from('organizations_data')
            .insert(organizationsDataToInsert);

          if (dataError) {
            throw dataError;
          }

          setUploadProgress(100);

          // Log audit event
          await logAuditEvent(
            'organization_data_upload',
            'organizations_data_uploads',
            uploadId,
            { file_name: file.name, row_count: results.data.length }
          );

          logSuccess('CSV import successful', { uploadId, rows: results.data.length });
          toast.success(`Successfully imported ${results.data.length} rows of organization data.`);
          
          resetFileInput();
          
          if (onSuccess) {
            onSuccess();
          }
        } catch (error) {
          logError('CSV import failed', error);
          toast.error('Failed to import CSV file.');
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        logError('CSV parsing error', error);
        toast.error('Failed to parse CSV file.');
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
            CSV file must have columns for company_id, company_name, and ytd_spend.
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
