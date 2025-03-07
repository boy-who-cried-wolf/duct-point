
import { supabase, logError, logSuccess } from "../integrations/supabase/client";

export type PlatformRole = 'super_admin' | 'staff' | 'user';
export type OrganizationRole = 'org_admin' | 'org_user';

/**
 * Assign a platform role to a user - only super_admins can do this
 */
export const assignPlatformRole = async (userId: string, role: PlatformRole): Promise<boolean> => {
  try {
    // Check if a role already exists for this user
    const { data: existingRole } = await supabase
      .from('user_platform_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingRole) {
      // Update existing role
      const { error } = await supabase
        .from('user_platform_roles')
        .update({ role })
        .eq('user_id', userId);
      
      if (error) {
        logError('Failed to update platform role', error);
        if (error.code === '42501') {
          // This error code indicates insufficient permissions
          throw new Error('Only super administrators can modify platform roles');
        }
        throw error;
      }
    } else {
      // Insert new role
      const { error } = await supabase
        .from('user_platform_roles')
        .insert({ user_id: userId, role });
      
      if (error) {
        logError('Failed to assign platform role', error);
        if (error.code === '42501') {
          throw new Error('Only super administrators can assign platform roles');
        }
        throw error;
      }
    }
    
    logSuccess('Platform role assigned successfully', { userId, role });
    return true;
  } catch (error) {
    logError('Error in assignPlatformRole', error);
    throw error;
  }
};

/**
 * Assign an organization role to a user - staff, super_admins, and org_admins can do this
 */
export const assignOrganizationRole = async (
  userId: string, 
  organizationId: string, 
  role: OrganizationRole
): Promise<boolean> => {
  try {
    // Check if a membership already exists
    const { data: existingMembership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .maybeSingle();
    
    if (existingMembership) {
      // Update existing membership
      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', existingMembership.id);
      
      if (error) {
        logError('Failed to update organization role', error);
        if (error.code === '42501') {
          throw new Error('You do not have permission to modify this organization role');
        }
        throw error;
      }
    } else {
      // Insert new membership
      const { error } = await supabase
        .from('organization_members')
        .insert({ 
          user_id: userId, 
          organization_id: organizationId,
          role 
        });
      
      if (error) {
        logError('Failed to assign organization role', error);
        if (error.code === '42501') {
          throw new Error('You do not have permission to assign organization roles');
        }
        throw error;
      }
    }
    
    logSuccess('Organization role assigned successfully', { userId, organizationId, role });
    return true;
  } catch (error) {
    logError('Error in assignOrganizationRole', error);
    throw error;
  }
};

/**
 * Check if current user can assign platform roles
 */
export const canManagePlatformRoles = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_super_admin');
    
    if (error) {
      logError('Error checking if user can manage platform roles', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    logError('Unexpected error in canManagePlatformRoles', error);
    return false;
  }
};

/**
 * Check if current user can assign organization roles for a specific organization
 */
export const canManageOrganizationRoles = async (organizationId: string): Promise<boolean> => {
  try {
    // Check if staff/super_admin
    const { data: isStaffOrAdmin, error: staffError } = await supabase.rpc('is_staff_or_super_admin');
    
    if (staffError) {
      logError('Error checking if user is staff or admin', staffError);
      return false;
    }
    
    if (isStaffOrAdmin === true) {
      return true;
    }
    
    // Check if org admin for this organization
    const { data: isOrgAdmin, error: orgError } = await supabase.rpc('is_org_admin_for', { 
      org_id: organizationId 
    });
    
    if (orgError) {
      logError('Error checking if user is org admin', orgError);
      return false;
    }
    
    return isOrgAdmin === true;
  } catch (error) {
    logError('Unexpected error in canManageOrganizationRoles', error);
    return false;
  }
};
