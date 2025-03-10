-- Function to update organization total_points based on ytd_spend
CREATE OR REPLACE FUNCTION update_organization_points()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update total_points in organizations based on ytd_spend
  -- Using a simple 1:1 ratio (1 dollar = 1 point)
  -- This can be adjusted with a more complex formula as needed
  UPDATE organizations
  SET total_points = FLOOR(ytd_spend)::integer,
      last_updated = CURRENT_TIMESTAMP;
  
  -- Log the update to audit_logs
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    details,
    user_id
  ) VALUES (
    'update_organization_points',
    'organization',
    'batch_update',
    json_build_object('updated_at', CURRENT_TIMESTAMP),
    '00000000-0000-0000-0000-000000000000' -- System user ID
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_organization_points() TO authenticated;

-- Function to check if columns exist in a table
CREATE OR REPLACE FUNCTION check_organization_columns(
  table_name TEXT,
  required_columns TEXT[]
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  missing_columns TEXT[] := '{}';
  column_exists BOOLEAN;
  col TEXT;
BEGIN
  FOREACH col IN ARRAY required_columns
  LOOP
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = check_organization_columns.table_name
      AND column_name = col
    ) INTO column_exists;
    
    IF NOT column_exists THEN
      missing_columns := array_append(missing_columns, col);
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'all_columns_exist', array_length(missing_columns, 1) IS NULL,
    'missing_columns', missing_columns
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_organization_columns(TEXT, TEXT[]) TO authenticated;

-- Function to execute SQL (admin only)
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user is admin
  IF NOT (SELECT has_platform_role('super_admin') OR has_platform_role('staff')) THEN
    RAISE EXCEPTION 'Only administrators can execute SQL';
  END IF;
  
  -- Execute the SQL
  EXECUTE sql;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO authenticated;

-- Function to migrate financial data from organizations_data to organizations
CREATE OR REPLACE FUNCTION migrate_financial_data()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    latest_upload_id UUID;
BEGIN
    -- Check if user is admin
    IF NOT (SELECT has_platform_role('super_admin') OR has_platform_role('staff')) THEN
      RAISE EXCEPTION 'Only administrators can migrate financial data';
    END IF;
    
    -- Get the latest upload ID
    SELECT id INTO latest_upload_id
    FROM organizations_data_uploads
    ORDER BY created_at DESC
    LIMIT 1;

    IF latest_upload_id IS NOT NULL THEN
        -- Update organizations with data from the latest upload
        UPDATE organizations o
        SET 
            ytd_spend = od.ytd_spend,
            last_updated = CURRENT_TIMESTAMP
        FROM organizations_data od
        WHERE 
            o.company_id = od.company_id
            AND od.upload_id = latest_upload_id;
            
        -- For any organizations that don't have data in the latest upload,
        -- find their most recent historical data
        UPDATE organizations o
        SET 
            ytd_spend = latest_data.ytd_spend,
            last_updated = CURRENT_TIMESTAMP
        FROM (
            SELECT DISTINCT ON (company_id) 
                company_id,
                ytd_spend,
                created_at
            FROM organizations_data
            ORDER BY company_id, created_at DESC
        ) latest_data
        WHERE 
            o.company_id = latest_data.company_id
            AND (o.ytd_spend IS NULL OR o.ytd_spend = 0);
    ELSE
        -- No uploads found, get the most recent data for each organization
        UPDATE organizations o
        SET 
            ytd_spend = latest_data.ytd_spend,
            last_updated = CURRENT_TIMESTAMP
        FROM (
            SELECT DISTINCT ON (company_id) 
                company_id,
                ytd_spend,
                created_at
            FROM organizations_data
            ORDER BY company_id, created_at DESC
        ) latest_data
        WHERE 
            o.company_id = latest_data.company_id;
    END IF;
    
    -- Now update total_points based on ytd_spend
    UPDATE organizations
    SET total_points = FLOOR(COALESCE(ytd_spend, 0))::integer;
    
    -- Log the update to audit_logs
    INSERT INTO audit_logs (
        action,
        entity_type,
        entity_id,
        details,
        user_id
    ) VALUES (
        'migrate_organization_financial_data',
        'organization',
        'batch_update',
        jsonb_build_object('updated_at', CURRENT_TIMESTAMP),
        auth.uid()
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION migrate_financial_data() TO authenticated; 