-- Update employee_tickets table
ALTER TABLE employee_tickets ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE employee_tickets ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Create ticket_replies table for conversation/thread feature
CREATE TABLE IF NOT EXISTS ticket_replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES employee_tickets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Firebase UID or 'admin'
  user_name TEXT,
  message TEXT NOT NULL,
  sender_type TEXT CHECK (sender_type IN ('employee', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure public access (following project pattern of disabling RLS and granting all)
ALTER TABLE ticket_replies DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE ticket_replies TO anon, authenticated, service_role;
GRANT ALL ON TABLE employee_tickets TO anon, authenticated, service_role;

-- Note: The categories are managed in the UI as the DB column is a generic TEXT type.
