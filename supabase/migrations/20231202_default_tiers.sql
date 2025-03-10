-- Function to insert default tiers if none exist
CREATE OR REPLACE FUNCTION insert_default_tiers()
RETURNS void AS $$
DECLARE
  tier_count integer;
BEGIN
  -- Check if tiers already exist
  SELECT COUNT(*) INTO tier_count FROM tiers;
  
  -- Only insert if no tiers exist
  IF tier_count = 0 THEN
    -- Insert default tiers
    INSERT INTO tiers (id, name, min_points, max_points)
    VALUES 
      ('bronze-default', 'Bronze', 0, 99999),
      ('silver-default', 'Silver', 100000, 299999),
      ('gold-default', 'Gold', 300000, NULL);
      
    RAISE NOTICE 'Default tiers have been inserted';
  ELSE
    RAISE NOTICE 'Tiers already exist, no default tiers inserted';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to insert default milestones if none exist
CREATE OR REPLACE FUNCTION insert_default_milestones()
RETURNS void AS $$
DECLARE
  milestone_count integer;
  bronze_id text;
  silver_id text;
  gold_id text;
BEGIN
  -- Check if milestones already exist
  SELECT COUNT(*) INTO milestone_count FROM milestones;
  
  -- Only insert if no milestones exist
  IF milestone_count = 0 THEN
    -- Get tier IDs
    SELECT id INTO bronze_id FROM tiers WHERE name = 'Bronze' LIMIT 1;
    SELECT id INTO silver_id FROM tiers WHERE name = 'Silver' LIMIT 1;
    SELECT id INTO gold_id FROM tiers WHERE name = 'Gold' LIMIT 1;
    
    -- Insert default milestones
    INSERT INTO milestones (tier_id, name, description, points_required, max_value)
    VALUES 
      (bronze_id, 'Bronze Welcome Gift', 'Welcome to the Bronze tier! Claim your welcome gift.', 0, 1),
      (bronze_id, 'First 10K Points', 'Congratulations on reaching 10,000 points!', 10000, 1),
      (bronze_id, 'First 50K Points', 'You''ve reached 50,000 points!', 50000, 1),
      (silver_id, 'Silver Welcome Gift', 'Welcome to the Silver tier! Claim your welcome gift.', 100000, 1),
      (silver_id, 'Silver Milestone', 'You''ve reached 150,000 points!', 150000, 1),
      (silver_id, 'Silver Elite', 'You''ve reached 200,000 points!', 200000, 1),
      (gold_id, 'Gold Welcome Gift', 'Welcome to the Gold tier! Claim your welcome gift.', 300000, 1),
      (gold_id, 'Gold Milestone', 'You''ve reached 400,000 points!', 400000, 1),
      (gold_id, 'Gold Elite', 'You''ve reached 500,000 points!', 500000, 1);
      
    RAISE NOTICE 'Default milestones have been inserted';
  ELSE
    RAISE NOTICE 'Milestones already exist, no default milestones inserted';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the functions
SELECT insert_default_tiers();
SELECT insert_default_milestones(); 