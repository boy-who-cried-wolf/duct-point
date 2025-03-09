
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock, Database, DownloadCloud } from 'lucide-react';
import CSVImport from '@/components/CSVImport';
import { QueryClient } from '@tanstack/react-query';

interface CSVUpload {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedByName: string;
  rowCount: number;
  createdAt: string;
}

interface CSVImportTabProps {
  csvUploads: CSVUpload[];
  isLoading: boolean;
  searchQuery: string;
  queryClient: QueryClient;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const CSVImportTab = ({ csvUploads, isLoading, searchQuery, queryClient }: CSVImportTabProps) => {
  const filteredCSVUploads = csvUploads.filter(upload => 
    upload.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    upload.uploadedByName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="grid gap-4 grid-cols-1">
      <Card>
        <CardHeader>
          <CardTitle>Upload Organization Data</CardTitle>
          <CardDescription>
            Upload a CSV file containing organization data. The file should have columns for Customer ID, Customer Name, and YTD Spend.
            When uploading data for organizations that already exist, the YTD values will be updated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CSVImport 
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['admin', 'csv-uploads'] });
              queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload History</CardTitle>
          <CardDescription>
            Previous CSV uploads and their status. Each upload preserves a historical record of the data at that point in time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading upload history...</div>
          ) : filteredCSVUploads.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No uploads found.</p>
          ) : (
            <div className="space-y-4">
              {filteredCSVUploads.map(upload => (
                <div key={upload.id} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback><Database className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{upload.fileName}</p>
                      <p className="text-sm text-muted-foreground">Uploaded by {upload.uploadedByName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{formatDate(upload.createdAt)}</p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <DownloadCloud className="h-3 w-3" />
                      {upload.rowCount} rows
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CSVImportTab;
