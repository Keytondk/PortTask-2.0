-- ===========================================
-- Row-Level Security (RLS) Policies for Navo
-- ===========================================
-- This migration adds RLS policies for multi-tenant data isolation.
-- All tenant-scoped tables will have policies that restrict access
-- based on the current session's organization context.
--
-- To use RLS, the application must set the context before each query:
--   SET app.current_organization_id = 'org_xxx';
--   SET app.current_user_id = 'user_xxx';
-- ===========================================

-- Helper function to get current organization ID from session
CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.current_organization_id', true), '');
$$ LANGUAGE SQL STABLE;

-- Helper function to get current user ID from session
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '');
$$ LANGUAGE SQL STABLE;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(current_setting('app.current_user_is_admin', true)::boolean, false);
$$ LANGUAGE SQL STABLE;

-- ===========================================
-- Enable RLS on all tenant-scoped tables
-- ===========================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessel_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE port_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- WORKSPACES - Isolated by organization
-- ===========================================

DROP POLICY IF EXISTS workspace_org_isolation ON workspaces;
CREATE POLICY workspace_org_isolation ON workspaces
  FOR ALL
  USING ("organizationId" = current_organization_id());

-- ===========================================
-- USERS - Isolated by organization
-- ===========================================

DROP POLICY IF EXISTS user_org_isolation ON users;
CREATE POLICY user_org_isolation ON users
  FOR ALL
  USING ("organizationId" = current_organization_id());

-- ===========================================
-- VESSELS - Isolated by workspace -> organization
-- ===========================================

DROP POLICY IF EXISTS vessel_org_isolation ON vessels;
CREATE POLICY vessel_org_isolation ON vessels
  FOR ALL
  USING (
    "workspaceId" IN (
      SELECT id FROM workspaces
      WHERE "organizationId" = current_organization_id()
    )
  );

-- ===========================================
-- VESSEL_POSITIONS - Through vessel -> workspace
-- ===========================================

DROP POLICY IF EXISTS vessel_position_org_isolation ON vessel_positions;
CREATE POLICY vessel_position_org_isolation ON vessel_positions
  FOR ALL
  USING (
    "vesselId" IN (
      SELECT v.id FROM vessels v
      JOIN workspaces w ON v."workspaceId" = w.id
      WHERE w."organizationId" = current_organization_id()
    )
  );

-- ===========================================
-- PORT_CALLS - Isolated by workspace -> organization
-- ===========================================

DROP POLICY IF EXISTS port_call_org_isolation ON port_calls;
CREATE POLICY port_call_org_isolation ON port_calls
  FOR ALL
  USING (
    "workspaceId" IN (
      SELECT id FROM workspaces
      WHERE "organizationId" = current_organization_id()
    )
  );

-- ===========================================
-- SERVICE_ORDERS - Through port_call -> workspace
-- ===========================================

DROP POLICY IF EXISTS service_order_org_isolation ON service_orders;
CREATE POLICY service_order_org_isolation ON service_orders
  FOR ALL
  USING (
    "portCallId" IN (
      SELECT pc.id FROM port_calls pc
      JOIN workspaces w ON pc."workspaceId" = w.id
      WHERE w."organizationId" = current_organization_id()
    )
  );

-- ===========================================
-- RFQS - Through port_call -> workspace
-- ===========================================

DROP POLICY IF EXISTS rfq_org_isolation ON rfqs;
CREATE POLICY rfq_org_isolation ON rfqs
  FOR ALL
  USING (
    "portCallId" IN (
      SELECT pc.id FROM port_calls pc
      JOIN workspaces w ON pc."workspaceId" = w.id
      WHERE w."organizationId" = current_organization_id()
    )
  );

-- ===========================================
-- QUOTES - Through RFQ -> port_call -> workspace
-- Also allow vendor organization to see their quotes
-- ===========================================

DROP POLICY IF EXISTS quote_org_isolation ON quotes;
CREATE POLICY quote_org_isolation ON quotes
  FOR ALL
  USING (
    "rfqId" IN (
      SELECT r.id FROM rfqs r
      JOIN port_calls pc ON r."portCallId" = pc.id
      JOIN workspaces w ON pc."workspaceId" = w.id
      WHERE w."organizationId" = current_organization_id()
    )
    OR
    "vendorId" IN (
      SELECT id FROM vendors
      WHERE "organizationId" = current_organization_id()
    )
  );

-- ===========================================
-- VENDORS - Isolated by organization
-- ===========================================

DROP POLICY IF EXISTS vendor_org_isolation ON vendors;
CREATE POLICY vendor_org_isolation ON vendors
  FOR ALL
  USING ("organizationId" = current_organization_id());

-- ===========================================
-- AGENTS - Isolated by organization
-- ===========================================

DROP POLICY IF EXISTS agent_org_isolation ON agents;
CREATE POLICY agent_org_isolation ON agents
  FOR ALL
  USING ("organizationId" = current_organization_id());

-- ===========================================
-- DOCUMENTS - Through entity relationships
-- ===========================================

DROP POLICY IF EXISTS document_org_isolation ON documents;
CREATE POLICY document_org_isolation ON documents
  FOR ALL
  USING (
    -- Document owner's organization
    "uploadedBy" IN (
      SELECT id FROM users
      WHERE "organizationId" = current_organization_id()
    )
    OR
    -- Or through port call
    ("entityType" = 'port_call' AND "entityId" IN (
      SELECT pc.id FROM port_calls pc
      JOIN workspaces w ON pc."workspaceId" = w.id
      WHERE w."organizationId" = current_organization_id()
    ))
    OR
    -- Or through service order
    ("entityType" = 'service_order' AND "entityId" IN (
      SELECT so.id FROM service_orders so
      JOIN port_calls pc ON so."portCallId" = pc.id
      JOIN workspaces w ON pc."workspaceId" = w.id
      WHERE w."organizationId" = current_organization_id()
    ))
  );

-- ===========================================
-- INCIDENTS - Through relationships
-- ===========================================

DROP POLICY IF EXISTS incident_org_isolation ON incidents;
CREATE POLICY incident_org_isolation ON incidents
  FOR ALL
  USING (
    "createdBy" IN (
      SELECT id FROM users
      WHERE "organizationId" = current_organization_id()
    )
  );

-- ===========================================
-- NOTIFICATIONS - User's own notifications
-- ===========================================

DROP POLICY IF EXISTS notification_user_isolation ON notifications;
CREATE POLICY notification_user_isolation ON notifications
  FOR ALL
  USING (
    "userId" IN (
      SELECT id FROM users
      WHERE "organizationId" = current_organization_id()
    )
  );

-- ===========================================
-- MESSAGES - Through channel relationships
-- ===========================================

DROP POLICY IF EXISTS message_org_isolation ON messages;
CREATE POLICY message_org_isolation ON messages
  FOR ALL
  USING (
    -- Sender's organization
    "senderId" IN (
      SELECT id FROM users
      WHERE "organizationId" = current_organization_id()
    )
    OR
    -- Or through port call channel
    ("channelType" = 'port_call' AND "channelId" IN (
      SELECT pc.id FROM port_calls pc
      JOIN workspaces w ON pc."workspaceId" = w.id
      WHERE w."organizationId" = current_organization_id()
    ))
  );

-- ===========================================
-- AUTOMATION_RULES - By creator's organization
-- ===========================================

DROP POLICY IF EXISTS automation_rule_org_isolation ON automation_rules;
CREATE POLICY automation_rule_org_isolation ON automation_rules
  FOR ALL
  USING (
    "createdBy" IN (
      SELECT id FROM users
      WHERE "organizationId" = current_organization_id()
    )
  );

-- ===========================================
-- AUDIT_LOGS - By organization
-- ===========================================

DROP POLICY IF EXISTS audit_log_org_isolation ON audit_logs;
CREATE POLICY audit_log_org_isolation ON audit_logs
  FOR SELECT  -- Read-only, only admins can delete via direct access
  USING ("organizationId" = current_organization_id());

-- Insert policy for audit logs - any authenticated user
DROP POLICY IF EXISTS audit_log_insert ON audit_logs;
CREATE POLICY audit_log_insert ON audit_logs
  FOR INSERT
  WITH CHECK ("organizationId" = current_organization_id());

-- ===========================================
-- FEATURE_FLAGS - Global read access
-- Only admins can modify (handled at application level)
-- ===========================================

DROP POLICY IF EXISTS feature_flag_read ON feature_flags;
CREATE POLICY feature_flag_read ON feature_flags
  FOR SELECT
  USING (true);  -- All users can read feature flags

-- ===========================================
-- PORTS & SERVICE_TYPES - Global reference data
-- No RLS needed (public reference data)
-- ===========================================

-- Ensure these are excluded from RLS
ALTER TABLE ports DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_types DISABLE ROW LEVEL SECURITY;

-- ===========================================
-- Grant permissions to application role
-- ===========================================

-- This assumes you have a role called 'navo_app' for the application
-- Uncomment and modify as needed for your setup:
--
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO navo_app;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO navo_app;

-- ===========================================
-- Index optimization for RLS queries
-- ===========================================

-- These indexes help RLS policies perform well

-- Workspace lookup by org
CREATE INDEX IF NOT EXISTS idx_workspaces_org_id ON workspaces("organizationId");

-- Port call lookup by workspace
CREATE INDEX IF NOT EXISTS idx_port_calls_workspace_id ON port_calls("workspaceId");

-- User lookup by org
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users("organizationId");

-- Vessel lookup by workspace
CREATE INDEX IF NOT EXISTS idx_vessels_workspace_id ON vessels("workspaceId");

-- Vendor/Agent lookup by org
CREATE INDEX IF NOT EXISTS idx_vendors_org_id ON vendors("organizationId");
CREATE INDEX IF NOT EXISTS idx_agents_org_id ON agents("organizationId");

-- Audit log lookup by org
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs("organizationId");

-- ===========================================
-- Rollback script (run to disable RLS)
-- ===========================================
--
-- ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE vessels DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE vessel_positions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE port_calls DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE service_orders DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE rfqs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE incidents DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE automation_rules DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE feature_flags DISABLE ROW LEVEL SECURITY;
--
-- DROP FUNCTION IF EXISTS current_organization_id();
-- DROP FUNCTION IF EXISTS current_user_id();
-- DROP FUNCTION IF EXISTS is_current_user_admin();
