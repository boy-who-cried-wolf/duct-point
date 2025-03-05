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

// Admin utility functions to handle data across tables
export const adminUtils = {
  // Update user admin status
  updateUserAdminStatus: async (userId: string, isAdmin: boolean) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_admin: isAdmin })
        .eq('id', userId);
        
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error updating user admin status:', e);
      throw e;
    }
  },
  
  // Get all users with details
  getAllUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });
        
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error getting all users:', e);
      throw e;
    }
  },
  
  // Get detailed transactions with user info
  getAllTransactions: async () => {
    try {
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (transactionsError) throw transactionsError;
      
      // Get all profiles to map user IDs to names
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email');
        
      if (profilesError) throw profilesError;
      
      // Create a map of user IDs to names
      const userMap = new Map();
      profiles?.forEach(profile => {
        userMap.set(profile.id, profile.full_name || profile.email || 'Unknown User');
      });
      
      // Map transactions with user info
      const formattedTransactions = transactions?.map(transaction => ({
        ...transaction,
        userName: userMap.get(transaction.user_id) || 'Unknown User'
      }));
      
      return formattedTransactions;
    } catch (e) {
      console.error('Error getting all transactions:', e);
      throw e;
    }
  },
  
  // Update tier information
  updateTier: async (tierId: string, tierData: any) => {
    const { data, error } = await supabase
      .from('tiers')
      .update(tierData)
      .eq('id', tierId);
      
    if (error) throw error;
    return data;
  },
  
  // Add new tier
  createTier: async (tierData: any) => {
    const { data, error } = await supabase
      .from('tiers')
      .insert(tierData)
      .select();
      
    if (error) throw error;
    return data;
  },
  
  // Update milestone information
  updateMilestone: async (milestoneId: string, milestoneData: any) => {
    const { data, error } = await supabase
      .from('milestones')
      .update(milestoneData)
      .eq('id', milestoneId);
      
    if (error) throw error;
    return data;
  },
  
  // Create new milestone
  createMilestone: async (milestoneData: any) => {
    const { data, error } = await supabase
      .from('milestones')
      .insert(milestoneData)
      .select();
      
    if (error) throw error;
    return data;
  }
};

// Initialize avatars bucket
ensureAvatarsBucketExists().catch(console.error);
