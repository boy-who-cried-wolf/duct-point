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
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, company_id');
    
  if (error) {
    logError('Failed to fetch companies', error);
    throw error;
  }
  
  const companyIds = data.map(org => org.id);
  const { data: memberData, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id, user_id')
    .in('organization_id', companyIds);
    
  if (memberError) {
    logError('Failed to fetch organization members', memberError);
    throw memberError;
  }
  
  const memberCounts = new Map();
  memberData.forEach(member => {
    const count = memberCounts.get(member.organization_id) || 0;
    memberCounts.set(member.organization_id, count + 1);
  });
  
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, total_points');
    
  if (profilesError) {
    logError('Failed to fetch user profiles', profilesError);
    throw profilesError;
  }
  
  const pointsMap = new Map();
  profilesData.forEach(profile => {
    pointsMap.set(profile.id, profile.total_points || 0);
  });
  
  const orgUserMap = new Map();
  memberData.forEach(member => {
    const users = orgUserMap.get(member.organization_id) || [];
    users.push(member.user_id);
    orgUserMap.set(member.organization_id, users);
  });
  
  const orgPoints = new Map();
  for (const [orgId, userIds] of orgUserMap.entries()) {
    let totalPoints = 0;
    userIds.forEach(userId => {
      totalPoints += pointsMap.get(userId) || 0;
    });
    orgPoints.set(orgId, totalPoints);
  }

  const orgCompanyIds = data
    .filter(org => org.company_id)
    .map(org => org.company_id);
  
  const ytdSpendMap = new Map();
  
  if (orgCompanyIds.length > 0) {
    try {
      for (const companyId of orgCompanyIds) {
        if (!companyId) continue;
        
        const { data: latestData, error: latestError } = await supabase
          .from('organizations_data')
          .select('company_id, ytd_spend, created_at')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (latestError) {
          logError(`Failed to fetch latest YTD for company ${companyId}`, latestError);
          continue;
        }
        
        if (latestData && latestData.length > 0) {
          ytdSpendMap.set(companyId, latestData[0].ytd_spend || 0);
        }
      }
    } catch (ytdError) {
      logError('Error fetching YTD spend values', ytdError);
    }
  }
  
  return data.map(org => {
    const ytdSpend = org.company_id ? ytdSpendMap.get(org.company_id) : undefined;
    
    return {
      id: org.id,
      name: org.name,
      totalPoints: orgPoints.get(org.id) || 0,
      memberCount: memberCounts.get(org.id) || 0,
      ytdSpend: ytdSpend
    };
  });
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
  const { data, error } = await supabase
    .from('organizations_data_uploads')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    logError('Failed to fetch CSV uploads', error);
    throw error;
  }
  
  const userIds = [...new Set(data.map(upload => upload.uploaded_by).filter(Boolean))];
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);
    
  if (userError) {
    logError('Failed to fetch user data for CSV uploads', userError);
    throw userError;
  }
  
  const userMap = new Map();
  userData.forEach(user => {
    userMap.set(user.id, user.full_name || user.email || 'Unknown User');
  });
  
  return data.map(upload => ({
    id: upload.id,
    fileName: upload.file_name,
    uploadedBy: upload.uploaded_by,
    uploadedByName: userMap.get(upload.uploaded_by) || 'Unknown User',
    rowCount: upload.row_count,
    createdAt: upload.created_at
  }));
};
