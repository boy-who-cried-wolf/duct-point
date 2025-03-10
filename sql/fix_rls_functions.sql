
-- Create explicit security definer functions to safely check user roles
-- This will prevent the infinite recursion in RLS policies

-- Function to get a user's platform role safely
CREATE OR REPLACE FUNCTION public.get_user_platform_role_direct(user_uuid uuid)
RETURNS platform_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role 
  FROM public.user_platform_roles 
  WHERE user_id = user_uuid
  LIMIT 1;
$$;

-- Function to get current user's platform role
CREATE OR REPLACE FUNCTION public.get_current_user_platform_role()
RETURNS platform_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.get_user_platform_role_direct(auth.uid());
$$;

-- Function to safely check if a user has a specific platform role
CREATE OR REPLACE FUNCTION public.has_platform_role_safe(required_role platform_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role platform_role;
BEGIN
  -- Get the user's role directly without going through RLS
  user_role := public.get_user_platform_role_direct(auth.uid());
  
  -- Return true if the user has the required role or higher
  RETURN 
    user_role = required_role OR
    (required_role = 'user' AND (user_role = 'super_admin' OR user_role = 'staff')) OR
    (required_role = 'staff' AND user_role = 'super_admin');
END;
$$;

-- Fix RLS policies on user_platform_roles table
ALTER TABLE public.user_platform_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on user_platform_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_platform_roles;
DROP POLICY IF EXISTS "Only super_admins can manage roles" ON public.user_platform_roles;

-- Create new policies using security definer functions
CREATE POLICY "Users can view their own roles"
ON public.user_platform_roles
FOR SELECT
USING (auth.uid() = user_id OR public.has_platform_role_safe('staff'));

CREATE POLICY "Only super_admins can manage roles"
ON public.user_platform_roles
FOR ALL
USING (public.has_platform_role_safe('super_admin'))
WITH CHECK (public.has_platform_role_safe('super_admin'));

-- Also fix policies on organizations tables
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Everyone can view organizations"
ON public.organizations
FOR SELECT
USING (true);

-- Fix storage bucket permissions
ALTER TABLE IF EXISTS storage.buckets ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow public access to avatars"
ON storage.buckets
FOR SELECT
USING (name = 'avatars');

-- Fix objects permissions
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload avatar objects"
ON storage.objects
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Allow public to view avatar objects"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');
