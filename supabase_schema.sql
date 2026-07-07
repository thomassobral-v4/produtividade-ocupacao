-- Create health_inputs table if it doesn't exist
CREATE TABLE IF NOT EXISTS health_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL,
    month_key TEXT NOT NULL,
    
    -- Vertical 1: Engajamento
    checkin TEXT,
    whatsapp TEXT,
    adimplencia TEXT,
    recarga TEXT,
    
    -- Vertical 2: Resultados
    roi_bucket TEXT,
    growth TEXT,
    engagement_vs_avg TEXT,
    
    -- Vertical 3: Relacionamento
    checkin_produtivo TEXT,
    progresso TEXT,
    relacionamento_interno TEXT,
    aviso_previo TEXT,
    pesquisa_respondida TEXT,
    
    -- Vertical 4: Pesquisas
    csat_tecnico TEXT,
    nps TEXT,
    mhs TEXT,
    pesquisa_geral_respondida TEXT,
    
    -- Metadata
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE, -- Legacy/Fallback
    
    -- Unique constraint to prevent duplicates per client/month
    UNIQUE(client_id, month_key)
);

-- Add new columns for Health Dashboard enhancements (Idempotent)
DO $$
BEGIN
    -- results_focus
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'health_inputs' AND column_name = 'results_focus') THEN
        ALTER TABLE health_inputs ADD COLUMN results_focus TEXT DEFAULT 'both';
    END IF;

    -- social_profile
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'health_inputs' AND column_name = 'social_profile') THEN
        ALTER TABLE health_inputs ADD COLUMN social_profile TEXT;
    END IF;

    -- Granular timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'health_inputs' AND column_name = 'last_updated_engagement') THEN
        ALTER TABLE health_inputs ADD COLUMN last_updated_engagement TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'health_inputs' AND column_name = 'last_updated_results') THEN
        ALTER TABLE health_inputs ADD COLUMN last_updated_results TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'health_inputs' AND column_name = 'last_updated_relationship') THEN
        ALTER TABLE health_inputs ADD COLUMN last_updated_relationship TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'health_inputs' AND column_name = 'last_updated_surveys') THEN
        ALTER TABLE health_inputs ADD COLUMN last_updated_surveys TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create app_state table for JSON storage (Productivity Module)
CREATE TABLE IF NOT EXISTS app_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_email)
);

-- Enable Row Level Security (RLS)
ALTER TABLE health_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_v4_user()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(auth.jwt() ->> 'email', '') ILIKE '%@v4company.com';
$$;

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) = ANY (ARRAY[
      'bianca.segato@v4company.com'
    ]);
$$;

DROP POLICY IF EXISTS "Enable public access" ON health_inputs;
DROP POLICY IF EXISTS "Enable public access" ON app_state;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON health_inputs;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON app_state;
DROP POLICY IF EXISTS "health_inputs_select_v4_users" ON health_inputs;
DROP POLICY IF EXISTS "health_inputs_insert_admins" ON health_inputs;
DROP POLICY IF EXISTS "health_inputs_update_admins" ON health_inputs;
DROP POLICY IF EXISTS "health_inputs_delete_admins" ON health_inputs;
DROP POLICY IF EXISTS "app_state_select_v4_users" ON app_state;
DROP POLICY IF EXISTS "app_state_insert_admins" ON app_state;
DROP POLICY IF EXISTS "app_state_update_admins" ON app_state;
DROP POLICY IF EXISTS "app_state_delete_admins" ON app_state;

CREATE POLICY "health_inputs_select_v4_users" ON health_inputs
    FOR SELECT TO authenticated USING (public.is_v4_user());

CREATE POLICY "health_inputs_insert_admins" ON health_inputs
    FOR INSERT TO authenticated WITH CHECK (public.is_app_admin());

CREATE POLICY "health_inputs_update_admins" ON health_inputs
    FOR UPDATE TO authenticated USING (public.is_app_admin()) WITH CHECK (public.is_app_admin());

CREATE POLICY "health_inputs_delete_admins" ON health_inputs
    FOR DELETE TO authenticated USING (public.is_app_admin());

CREATE POLICY "app_state_select_v4_users" ON app_state
    FOR SELECT TO authenticated USING (public.is_v4_user());

CREATE POLICY "app_state_insert_admins" ON app_state
    FOR INSERT TO authenticated WITH CHECK (public.is_app_admin());

CREATE POLICY "app_state_update_admins" ON app_state
    FOR UPDATE TO authenticated USING (public.is_app_admin()) WITH CHECK (public.is_app_admin());

CREATE POLICY "app_state_delete_admins" ON app_state
    FOR DELETE TO authenticated USING (public.is_app_admin());
