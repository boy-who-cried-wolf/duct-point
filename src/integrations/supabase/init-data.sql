-- Migration: Update existing organizations with YTD spend from latest organizations_data
DO $$
DECLARE
    latest_upload_id UUID;
BEGIN
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
            AND o.ytd_spend IS NULL;
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
    SET total_points = FLOOR(ytd_spend)::integer
    WHERE ytd_spend IS NOT NULL;
    
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
        json_build_object('updated_at', CURRENT_TIMESTAMP),
        '00000000-0000-0000-0000-000000000000' -- System user ID
    );
END $$; 