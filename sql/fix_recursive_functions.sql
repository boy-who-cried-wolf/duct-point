
-- Fix potential recursion issues in user_platform_roles queries

-- First, create a security definer function to safely check platform roles
-- This will prevent infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_user_platform_role_text(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role::text 
  FROM public.user_platform_roles 
  WHERE user_id = user_uuid
  LIMIT 1;
$$;

-- Create a function to check platform role without recursion
CREATE OR REPLACE FUNCTION public.has_platform_role_text(required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the user's role directly without going through RLS
  user_role := public.get_user_platform_role_text(auth.uid());
  
  -- Return true if the user has the required role or higher
  RETURN 
    CASE
      WHEN user_role IS NULL THEN false
      WHEN user_role = required_role THEN true
      WHEN required_role = 'user' AND (user_role = 'super_admin' OR user_role = 'staff') THEN true
      WHEN required_role = 'staff' AND user_role = 'super_admin' THEN true
      ELSE false
    END;
END;
$$;

-- Make sure RLS is enabled on the user_platform_roles table
ALTER TABLE public.user_platform_roles ENABLE ROW LEVEL SECURITY;

-- Create policies using the text-based functions
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_platform_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_platform_roles
FOR SELECT
USING (auth.uid() = user_id OR (SELECT public.has_platform_role_text('staff')));

DROP POLICY IF EXISTS "Only super_admins can manage roles" ON public.user_platform_roles;
CREATE POLICY "Only super_admins can manage roles"
ON public.user_platform_roles
FOR ALL
USING ((SELECT public.has_platform_role_text('super_admin')))
WITH CHECK ((SELECT public.has_platform_role_text('super_admin')));

-- Enable RLS on organizations_data_uploads
ALTER TABLE public.organizations_data_uploads ENABLE ROW LEVEL SECURITY;

-- Allow super_admins and staff to manage uploads
DROP POLICY IF EXISTS "Super admins can manage uploads" ON public.organizations_data_uploads;
CREATE POLICY "Super admins can manage uploads"
ON public.organizations_data_uploads
FOR ALL
USING ((SELECT public.has_platform_role_text('staff')))
WITH CHECK ((SELECT public.has_platform_role_text('staff')));

-- Add policies for organizations_data with safer access
ALTER TABLE IF EXISTS public.organizations_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and admins can manage organization data" ON public.organizations_data;
CREATE POLICY "Staff and admins can manage organization data"
ON public.organizations_data
FOR ALL
USING ((SELECT public.has_platform_role_text('staff')))
WITH CHECK ((SELECT public.has_platform_role_text('staff')));
