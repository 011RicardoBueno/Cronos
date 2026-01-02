-- Add theme_name column to salons table with a default value
ALTER TABLE salons 
ADD COLUMN IF NOT EXISTS theme_name TEXT DEFAULT 'azure-minimalist';

-- End of migration