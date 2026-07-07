-- Security note:
-- Do not recreate the old "Enable public access" policies. They bypass RLS.
-- Use the hardened migration instead:
-- supabase/migrations/20260707120000_harden_public_rls_policies.sql

\i supabase/migrations/20260707120000_harden_public_rls_policies.sql
