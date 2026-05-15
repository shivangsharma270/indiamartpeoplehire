-- Update exit_requests table
ALTER TABLE exit_requests ADD COLUMN IF NOT EXISTS resignation_date TIMESTAMPTZ;
ALTER TABLE exit_requests ADD COLUMN IF NOT EXISTS last_working_date TIMESTAMPTZ;
ALTER TABLE exit_requests ADD COLUMN IF NOT EXISTS separation_reason TEXT;
ALTER TABLE exit_requests ADD COLUMN IF NOT EXISTS resignation_comments TEXT;
