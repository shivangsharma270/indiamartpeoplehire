-- Update exit_requests table to add 'revoked' status
ALTER TABLE exit_requests DROP CONSTRAINT IF EXISTS exit_requests_status_check;
ALTER TABLE exit_requests ADD CONSTRAINT exit_requests_status_check CHECK (status IN ('pending', 'approved', 'interview_completed', 'rejected', 'revoked'));
