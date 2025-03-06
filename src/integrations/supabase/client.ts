
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vyidxrwfhwfcvmyelrpz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5aWR4cndmaHdmY3ZteWVscnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMTg4MDAsImV4cCI6MjA1NjY5NDgwMH0.dTUDKsWXiLbxvSws6wKCpc2ZPFC0_dwshoSBKmSWArc";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Console logging helper with emojis
export const logInfo = (title: string, data: any) => {
  console.log(`%c 🔵 ${title}`, 'font-weight: bold; font-size: 14px; color: #3b82f6;', data);
};

export const logSuccess = (title: string, data: any) => {
  console.log(`%c ✅ ${title}`, 'font-weight: bold; font-size: 14px; color: #22c55e;', data);
};

export const logError = (title: string, data: any) => {
  console.error(`%c ❌ ${title}`, 'font-weight: bold; font-size: 14px; color: #ef4444;', data);
};

export const logWarning = (title: string, data: any) => {
  console.warn(`%c ⚠️ ${title}`, 'font-weight: bold; font-size: 14px; color: #f59e0b;', data);
};

export const logAuth = (title: string, data: any) => {
  console.log(`%c 🔑 ${title}`, 'font-weight: bold; font-size: 14px; color: #8b5cf6;', data);
};

// Function to check if avatars bucket exists and create it if it doesn't
export const ensureAvatarsBucketExists = async () => {
  try {
    logInfo('STORAGE: Checking for avatars bucket', {});
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      logError('STORAGE: Error checking for avatars bucket', error.message);
      return;
    }
    
    if (!buckets?.find(bucket => bucket.name === 'avatars')) {
      logWarning('STORAGE: Avatars bucket not found, creating it', {});
      try {
        const { error: createError } = await supabase.storage.createBucket('avatars', {
          public: true, // Make the bucket public so avatars are accessible
          fileSizeLimit: 1024 * 1024, // 1MB file size limit
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif']
        });
        
        if (createError) {
          logError('STORAGE: Error creating avatars bucket', createError.message);
        } else {
          logSuccess('STORAGE: Avatars bucket created successfully', {});
        }
      } catch (err) {
        logError('STORAGE: Failed to create avatars bucket', err);
      }
    } else {
      logSuccess('STORAGE: Avatars bucket already exists', {});
    }
  } catch (err) {
    logError('STORAGE: Unexpected error handling avatars bucket', err);
  }
};

// Initialize avatars bucket - but don't block the app if it fails
ensureAvatarsBucketExists();
