
import { supabase, logError, logSuccess, logInfo } from './client';

// Function to ensure the avatars bucket exists
export const ensureAvatarsBucket = async () => {
  try {
    logInfo('STORAGE: Checking if avatars bucket exists', {});
    
    // Check if bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      logError('STORAGE: Error checking buckets', error);
      return false;
    }
    
    const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatars');
    
    if (!avatarsBucket) {
      logInfo('STORAGE: Creating avatars bucket', {});
      
      // Try to create the bucket
      const { error: createError } = await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2, // 2MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif']
      });
      
      if (createError) {
        logError('STORAGE: Failed to create avatars bucket', createError);
        return false;
      }
      
      logSuccess('STORAGE: Successfully created avatars bucket', {});
      return true;
    }
    
    logInfo('STORAGE: Avatars bucket already exists', {});
    return true;
  } catch (err) {
    logError('STORAGE: Unexpected error in ensureAvatarsBucket', err);
    return false;
  }
};
