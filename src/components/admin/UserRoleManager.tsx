
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { PlatformRole, OrganizationRole, assignPlatformRole, assignOrganizationRole, canManagePlatformRoles, canManageOrganizationRoles } from "@/utils/roleManagement";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, AlertTriangle } from "lucide-react";

interface UserRoleManagerProps {
  userId: string;
  currentPlatformRole?: PlatformRole;
  currentOrgRole?: OrganizationRole;
  organizationId?: string;
  onRoleChanged?: () => void;
}

const UserRoleManager = ({ 
  userId, 
  currentPlatformRole = 'user',
  currentOrgRole,
  organizationId,
  onRoleChanged
}: UserRoleManagerProps) => {
  const { isAdmin, user } = useAuth();
  const [selectedPlatformRole, setSelectedPlatformRole] = useState<PlatformRole>(currentPlatformRole);
  const [selectedOrgRole, setSelectedOrgRole] = useState<OrganizationRole>(currentOrgRole || 'org_user');
  const [canEditPlatformRoles, setCanEditPlatformRoles] = useState(false);
  const [canEditOrgRoles, setCanEditOrgRoles] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'platform' | 'organization';
    role: PlatformRole | OrganizationRole;
  } | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      // Check if current user can manage platform roles
      const canManagePlatform = await canManagePlatformRoles();
      setCanEditPlatformRoles(canManagePlatform);
      
      // Check if current user can manage org roles (if an organizationId is provided)
      if (organizationId) {
        const canManageOrg = await canManageOrganizationRoles(organizationId);
        setCanEditOrgRoles(canManageOrg);
      }
    };
    
    checkPermissions();
  }, [organizationId]);

  const handlePlatformRoleChange = (role: PlatformRole) => {
    if (role === 'super_admin' && selectedPlatformRole !== 'super_admin') {
      // Require confirmation for promoting to super_admin
      setPendingAction({ type: 'platform', role });
      setConfirmDialogOpen(true);
    } else {
      setSelectedPlatformRole(role);
      savePlatformRole(role);
    }
  };

  const handleOrgRoleChange = (role: OrganizationRole) => {
    setSelectedOrgRole(role);
    if (organizationId) {
      saveOrgRole(role);
    }
  };

  const savePlatformRole = async (role: PlatformRole) => {
    if (!canEditPlatformRoles) {
      toast.error("You don't have permission to change platform roles");
      return;
    }

    if (userId === user?.id && role !== 'super_admin') {
      toast.error("You cannot downgrade your own admin role");
      return;
    }

    setIsLoading(true);
    try {
      await assignPlatformRole(userId, role);
      toast.success(`Platform role updated to ${role}`);
      if (onRoleChanged) onRoleChanged();
    } catch (error: any) {
      toast.error(error.message || "Failed to update platform role");
      // Reset to previous value if there was an error
      setSelectedPlatformRole(currentPlatformRole);
    } finally {
      setIsLoading(false);
    }
  };

  const saveOrgRole = async (role: OrganizationRole) => {
    if (!canEditOrgRoles || !organizationId) {
      toast.error("You don't have permission to change organization roles");
      return;
    }

    setIsLoading(true);
    try {
      await assignOrganizationRole(userId, organizationId, role);
      toast.success(`Organization role updated to ${role}`);
      if (onRoleChanged) onRoleChanged();
    } catch (error: any) {
      toast.error(error.message || "Failed to update organization role");
      // Reset to previous value if there was an error
      setSelectedOrgRole(currentOrgRole || 'org_user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    
    if (pendingAction.type === 'platform') {
      setSelectedPlatformRole(pendingAction.role as PlatformRole);
      savePlatformRole(pendingAction.role as PlatformRole);
    } else {
      setSelectedOrgRole(pendingAction.role as OrganizationRole);
      if (organizationId) {
        saveOrgRole(pendingAction.role as OrganizationRole);
      }
    }
    
    setConfirmDialogOpen(false);
    setPendingAction(null);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Platform Role Selector */}
        {canEditPlatformRoles && (
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
              <Shield className="h-4 w-4" />
              Platform Role
            </label>
            <Select
              value={selectedPlatformRole}
              onValueChange={(value) => handlePlatformRoleChange(value as PlatformRole)}
              disabled={isLoading || !canEditPlatformRoles}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="super_admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Organization Role Selector */}
        {organizationId && canEditOrgRoles && (
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
              <Shield className="h-4 w-4" />
              Organization Role
            </label>
            <Select
              value={selectedOrgRole}
              onValueChange={(value) => handleOrgRoleChange(value as OrganizationRole)}
              disabled={isLoading || !canEditOrgRoles}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="org_user">Member</SelectItem>
                <SelectItem value="org_admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Role Change
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === 'platform' && pendingAction?.role === 'super_admin' && (
                <>
                  You are about to grant Super Admin privileges to this user. 
                  This will give them complete access to all platform functions, 
                  including the ability to modify other users' roles.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserRoleManager;
