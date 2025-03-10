import { supabase, logError, logSuccess, logInfo } from '../../integrations/supabase/client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  points: number;
}

export interface Company {
  id: string;
  name: string;
  totalPoints: number;
  memberCount: number;
  ytdSpend?: number;
  companyId?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: string;
  points: number;
  description: string;
  date: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  createdAt: string;
}

export interface RedemptionRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  requestedBy: string;
  requestedByName: string;
  points: number;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  approvedBy: string | null;
  approvedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CSVUpload {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedByName: string;
  rowCount: number;
  createdAt: string;
}

export const fetchUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, company, total_points');
    
  if (error) {
    logError('Failed to fetch users', error);
    throw error;
  }
  
  const { data: roleData, error: roleError } = await supabase
    .from('user_platform_roles')
    .select('user_id, role');
    
  if (roleError) {
    logError('Failed to fetch user roles', roleError);
  }
  
  const roleMap = new Map();
  if (roleData) {
    roleData.forEach(item => {
      roleMap.set(item.user_id, item.role);
    });
  }
  
  return data.map(user => ({
    id: user.id,
    name: user.full_name || 'Unknown',
    email: user.email || 'No email',
    role: roleMap.get(user.id) || 'user',
    company: user.company || 'No company',
    points: user.total_points || 0
  }));
};

export const fetchCompanies = async (): Promise<Company[]> => {
  console.log('TRACE: Starting fetchCompanies function');
  try {
    // Use minimal fields to avoid errors with missing columns
    console.log('TRACE: Querying organizations table');
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, company_id, total_points');
      
    if (error) {
      console.error('TRACE: Error fetching companies:', error);
      return []; 
    }
    
    console.log('TRACE: Received response from database', { 
      dataExists: !!data, 
      count: data?.length || 0,
      firstRecord: data?.[0] || 'no records'
    });
    
    // Using an explicit cast to avoid type issues
    const orgs = data ? [...data] : [];
    console.log('TRACE: Processed organizations array', { count: orgs.length });
    
    // Map to Company interface with appropriate defaults for missing columns
    console.log('TRACE: Starting to map organizations to Company interface');
    const companies = orgs.map(org => {
      const company = {
        id: org.id || '',
        name: org.name || 'Unnamed Organization',
        companyId: org.company_id || '',
        totalPoints: org.total_points || 0,
        memberCount: 0,  // We'll populate this later if possible
        ytdSpend: 0  // Default value since this column doesn't exist anymore
      };
      console.log('TRACE: Mapped organization', { id: company.id, name: company.name });
      return company;
    });
    
    console.log('TRACE: Companies mapping complete', { count: companies.length });
    return companies;
  } catch (error) {
    console.error('TRACE: Unexpected error in fetchCompanies:', error);
    return [];
  }
};

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, user_id, points, description, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
    
  if (error) {
    logError('Failed to fetch transactions', error);
    throw error;
  }
  
  const userIds = [...new Set(data.map(tx => tx.user_id))];
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);
    
  if (userError) {
    logError('Failed to fetch user data for transactions', userError);
    throw userError;
  }
  
  const userMap = new Map();
  userData.forEach(user => {
    userMap.set(user.id, user.full_name || user.email || 'Unknown User');
  });
  
  return data.map(tx => ({
    id: tx.id,
    userId: tx.user_id,
    userName: userMap.get(tx.user_id) || 'Unknown User',
    type: tx.points >= 0 ? 'Earned' : 'Spent',
    points: Math.abs(tx.points),
    description: tx.description || 'No description',
    date: tx.created_at
  }));
};

export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
    
  if (error) {
    logError('Failed to fetch audit logs', error);
    throw error;
  }
  
  const userIds = [...new Set(data.map(log => log.user_id).filter(Boolean))];
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);
    
  if (userError) {
    logError('Failed to fetch user data for audit logs', userError);
    throw userError;
  }
  
  const userMap = new Map();
  userData.forEach(user => {
    userMap.set(user.id, user.full_name || user.email || 'Unknown User');
  });
  
  return data.map(log => ({
    id: log.id,
    userId: log.user_id,
    userName: log.user_id ? userMap.get(log.user_id) || 'Unknown User' : 'System',
    action: log.action,
    entityType: log.entity_type,
    entityId: log.entity_id,
    details: log.details,
    createdAt: log.created_at
  }));
};

export const fetchRedemptionRequests = async (): Promise<RedemptionRequest[]> => {
  const { data, error } = await supabase
    .from('redemption_requests')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    logError('Failed to fetch redemption requests', error);
    throw error;
  }
  
  const orgIds = [...new Set(data.map(req => req.organization_id))];
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', orgIds);
    
  if (orgError) {
    logError('Failed to fetch organization data', orgError);
    throw orgError;
  }
  
  const orgMap = new Map();
  orgData.forEach(org => {
    orgMap.set(org.id, org.name);
  });
  
  const userIds = [
    ...new Set([
      ...data.map(req => req.requested_by),
      ...data.map(req => req.approved_by).filter(Boolean)
    ])
  ];
  
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);
    
  if (userError) {
    logError('Failed to fetch user data for redemption requests', userError);
    throw userError;
  }
  
  const userMap = new Map();
  userData.forEach(user => {
    userMap.set(user.id, user.full_name || user.email || 'Unknown User');
  });
  
  return data.map(req => ({
    id: req.id,
    organizationId: req.organization_id,
    organizationName: orgMap.get(req.organization_id) || 'Unknown Organization',
    requestedBy: req.requested_by,
    requestedByName: userMap.get(req.requested_by) || 'Unknown User',
    points: req.points,
    status: req.status as 'pending' | 'approved' | 'rejected',
    reason: req.reason || '',
    approvedBy: req.approved_by,
    approvedByName: req.approved_by ? userMap.get(req.approved_by) || 'Unknown User' : null,
    createdAt: req.created_at,
    updatedAt: req.updated_at
  }));
};

export const fetchCSVUploads = async (): Promise<CSVUpload[]> => {
  try {
    console.log('Fetching CSV uploads from the database');
    
    // Use type assertion to help TypeScript understand the data structure
    type UploadRecord = {
      id: string;
      file_name: string;
      uploaded_by: string | null;
      row_count: number;
      created_at: string;
    };
    
    const { data, error } = await supabase
      .from('organizations_data_uploads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      logError('Failed to fetch CSV uploads', error);
      console.error('CSV uploads fetch error:', error);
      return []; // Return empty array instead of throwing
    }
    
    // Safely type the data
    const uploadsData = data as UploadRecord[] || [];
    
    if (uploadsData.length === 0) {
      console.log('No CSV uploads found');
      return [];
    }
    
    console.log(`Found ${uploadsData.length} CSV uploads`);
    
    // Extract all unique user IDs
    const userIds = uploadsData
      .map(upload => upload.uploaded_by)
      .filter((id): id is string => id !== null && id !== undefined);
    
    // If we have no user IDs to look up, just return uploads with unknown users
    if (userIds.length === 0) {
      return uploadsData.map(upload => ({
        id: upload.id,
        fileName: upload.file_name,
        uploadedBy: upload.uploaded_by || '',
        uploadedByName: 'Unknown User',
        rowCount: upload.row_count,
        createdAt: upload.created_at
      }));
    }
    
    // Fetch user data
    type UserRecord = {
      id: string;
      full_name: string | null;
      email: string | null;
    };
    
    const { data: userDataResult, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    
    if (userError) {
      logError('Failed to fetch user data for CSV uploads', userError);
      console.warn('Will continue with unknown user names');
      
      // Return uploads even if we can't get user names
      return uploadsData.map(upload => ({
        id: upload.id,
        fileName: upload.file_name,
        uploadedBy: upload.uploaded_by || '',
        uploadedByName: 'Unknown User',
        rowCount: upload.row_count,
        createdAt: upload.created_at
      }));
    }
    
    // Safely type user data
    const userData = userDataResult as UserRecord[] || [];
    
    // Create a map of user IDs to names
    const userMap = new Map<string, string>();
    
    userData.forEach(user => {
      if (user.id) {
        userMap.set(user.id, user.full_name || user.email || 'Unknown User');
      }
    });
    
    // Map uploads data to CSVUpload objects with user names
    return uploadsData.map(upload => ({
      id: upload.id,
      fileName: upload.file_name,
      uploadedBy: upload.uploaded_by || '',
      uploadedByName: upload.uploaded_by ? userMap.get(upload.uploaded_by) || 'Unknown User' : 'System',
      rowCount: upload.row_count,
      createdAt: upload.created_at
    }));
    
  } catch (error: any) {
    logError('Unexpected error in fetchCSVUploads', error);
    console.error('Unexpected error fetching CSV uploads:', error?.message || error);
    
    // Return empty array instead of throwing to prevent breaking the UI
    return [];
  }
};
