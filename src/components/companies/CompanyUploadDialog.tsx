import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { FC, useState } from 'react';

interface UploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => Promise<{ success: number; skipped: number; errors: number }>;
}

const CompanyUploadDialog: FC<UploadDialogProps> = ({ isOpen, onOpenChange, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'completed' | 'error'>('idle');
  const [uploadResult, setUploadResult] = useState<{ success: number; skipped: number; errors: number } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setProgress(0);

    try {
      const result = await onUpload(file);
      setUploadResult(result);
      setStatus('completed');
    } catch (error) {
      console.error('Upload failed:', error);
      setStatus('error');
    }
  };

  const handleStop = () => {
    setStatus('idle');
    setProgress(0);
    setFile(null);
    setUploadResult(null);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-[400px]">
          <Dialog.Title className="text-lg font-semibold">Upload CSV</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground mb-4">
            Upload a CSV file to add new companies.
          </Dialog.Description>

          <div className="space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            {status === 'uploading' && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            )}

            {status === 'completed' && uploadResult && (
              <div className="p-3 bg-green-50 rounded-md border border-green-200">
                <p className="text-sm text-green-700">Upload completed successfully!</p>
                <ul className="mt-2 text-sm text-green-700">
                  <li>Success: {uploadResult.success}</li>
                  <li>Skipped (duplicates): {uploadResult.skipped}</li>
                  <li>Errors: {uploadResult.errors}</li>
                </ul>
              </div>
            )}

            {status === 'error' && (
              <div className="p-3 bg-red-50 rounded-md border border-red-200">
                <p className="text-sm text-red-700">Upload failed. Please try again.</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            {status === 'uploading' && (
              <button
                onClick={handleStop}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
              >
                Stop
              </button>
            )}

            <Dialog.Close asChild>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                Close
              </button>
            </Dialog.Close>

            {status === 'idle' && file && (
              <button
                onClick={handleUpload}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Upload
              </button>
            )}
          </div>

          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100">
              <Cross2Icon className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CompanyUploadDialog;