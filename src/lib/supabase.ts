
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vyidxrwfhwfcvmyelrpz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5aWR4cndmaHdmY3ZteWVscnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMTg4MDAsImV4cCI6MjA1NjY5NDgwMH0.dTUDKsWXiLbxvSws6wKCpc2ZPFC0_dwshoSBKmSWArc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to check if avatars bucket exists and create it if it doesn't
export const ensureAvatarsBucketExists = async () => {
  try {
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
          // Don't throw the error - just log it and continue
        } else {
          console.log('Avatars bucket created successfully');
        }
      } catch (err) {
        console.error('Failed to create avatars bucket:', err);
        // Don't throw the error - just log it and continue
      }
    } else {
      console.log('Avatars bucket already exists');
    }
  } catch (error) {
    console.error('Unexpected error in ensureAvatarsBucketExists:', error);
    // Don't throw the error - just log it and continue
  }
};

// Initialize avatars bucket but catch any errors to prevent app from crashing
ensureAvatarsBucketExists().catch(error => {
  console.error('Error initializing avatars bucket:', error);
  // Don't throw the error - just log it and continue
});
