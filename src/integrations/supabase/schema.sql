-- Add ytd_spend and total_points columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS ytd_spend NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create index on company_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_company_id ON organizations(company_id);

-- Add a comment to explain the table changes
COMMENT ON TABLE organizations IS 'Core organization data including current financial information';
COMMENT ON COLUMN organizations.ytd_spend IS 'Current year-to-date spend amount';
COMMENT ON COLUMN organizations.total_points IS 'Current total points for the organization';
COMMENT ON COLUMN organizations.last_updated IS 'Timestamp when financial data was last updated'; 