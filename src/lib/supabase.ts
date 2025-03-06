
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vyidxrwfhwfcvmyelrpz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5aWR4cndmaHdmY3ZteWVscnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMTg4MDAsImV4cCI6MjA1NjY5NDgwMH0.dTUDKsWXiLbxvSws6wKCpc2ZPFC0_dwshoSBKmSWArc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to check if avatars bucket exists and create it if it doesn't
export const ensureAvatarsBucketExists = async () => {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Error checking for avatars bucket:', error.message);
    return;
  }
  
  if (!buckets?.find(bucket => bucket.name === 'avatars')) {
    console.log('Creating avatars storage bucket');
    try {
      const { error: createError } = await supabase.storage.createBucket('avatars', {
        public: true, // Make the bucket public so avatars are accessible
        fileSizeLimit: 1024 * 1024, // 1MB file size limit
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif']
      });
      
      if (createError) {
        console.error('Error creating avatars bucket:', createError.message);
      } else {
        console.log('Avatars bucket created successfully');
      }
    } catch (err) {
      console.error('Failed to create avatars bucket:', err);
    }
  } else {
    console.log('Avatars bucket already exists');
  }
};

// Initialize avatars bucket
ensureAvatarsBucketExists().catch(console.error);
