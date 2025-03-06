
-- Functions to check realtime configuration
-- These will be used by the enableRealtime.ts file

-- Check if a publication exists
CREATE OR REPLACE FUNCTION public.check_publication_exists(publication_name text)
RETURNS TABLE(exists boolean) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS (
    SELECT 1 
    FROM pg_publication 
    WHERE pubname = publication_name
  );
END;
$$;

-- Check if a table is included in a publication
CREATE OR REPLACE FUNCTION public.check_table_in_publication(publication_name text, table_name text)
RETURNS TABLE(is_included boolean) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = publication_name 
    AND schemaname = 'public'
    AND tablename = table_name
  );
END;
$$;
