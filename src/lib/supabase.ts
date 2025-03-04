
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vyidxrwfhwfcvmyelrpz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5aWR4cndmaHdmY3ZteWVscnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMTg4MDAsImV4cCI6MjA1NjY5NDgwMH0.dTUDKsWXiLbxvSws6wKCpc2ZPFC0_dwshoSBKmSWArc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to check if avatars bucket exists and create it if it doesn't
export const ensureAvatarsBucketExists = async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  
  if (!buckets?.find(bucket => bucket.name === 'avatars')) {
    console.log('Creating avatars storage bucket');
    await supabase.storage.createBucket('avatars', {
      public: true, // Make the bucket public so avatars are accessible
      fileSizeLimit: 1024 * 1024, // 1MB file size limit
    });
  }
};

// Initialize avatars bucket
ensureAvatarsBucketExists().catch(console.error);
