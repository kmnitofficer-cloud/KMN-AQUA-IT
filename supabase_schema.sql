-- ==========================================================
-- KMN AQUA SERVICES (PVT) LTD - IT ASSET SYSTEM SCHEMA
-- Supabase PostgreSQL Database Setup Script
-- ==========================================================

-- 1. Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create 'machines' Table
CREATE TABLE IF NOT EXISTS public.machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verified_no TEXT,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other Accessory',
    office TEXT NOT NULL DEFAULT 'Chilaw Office',
    assigned_to TEXT DEFAULT 'Unassigned',
    status TEXT NOT NULL DEFAULT 'Working',
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create 'service_records' Table
CREATE TABLE IF NOT EXISTS public.service_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
    verified_no TEXT,
    device_name TEXT NOT NULL,
    assigned_to TEXT DEFAULT 'Unassigned',
    service_details TEXT,
    charges NUMERIC(12, 2) DEFAULT 0.00,
    vendor_remarks TEXT DEFAULT 'KMN IT Solution',
    service_date DATE DEFAULT CURRENT_DATE,
    last_service DATE,
    next_service DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_machines_verified_no ON public.machines(verified_no);
CREATE INDEX IF NOT EXISTS idx_machines_office ON public.machines(office);
CREATE INDEX IF NOT EXISTS idx_machines_status ON public.machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_category ON public.machines(category);
CREATE INDEX IF NOT EXISTS idx_machines_assigned ON public.machines(assigned_to);

CREATE INDEX IF NOT EXISTS idx_service_verified_no ON public.service_records(verified_no);
CREATE INDEX IF NOT EXISTS idx_service_date ON public.service_records(service_date);

-- 5. Auto-update 'updated_at' trigger for machines
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_machines_timestamp ON public.machines;
CREATE TRIGGER set_machines_timestamp
    BEFORE UPDATE ON public.machines
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies (Allow Read & Write via Anon / Authenticated keys)
-- You can tighten these policies as needed once user authentication is enabled in Supabase.

DROP POLICY IF EXISTS "Allow public read access on machines" ON public.machines;
CREATE POLICY "Allow public read access on machines"
    ON public.machines FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Allow public insert access on machines" ON public.machines;
CREATE POLICY "Allow public insert access on machines"
    ON public.machines FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on machines" ON public.machines;
CREATE POLICY "Allow public update access on machines"
    ON public.machines FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access on machines" ON public.machines;
CREATE POLICY "Allow public delete access on machines"
    ON public.machines FOR DELETE
    TO public
    USING (true);

-- Service Records Policies
DROP POLICY IF EXISTS "Allow public read access on service_records" ON public.service_records;
CREATE POLICY "Allow public read access on service_records"
    ON public.service_records FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Allow public insert access on service_records" ON public.service_records;
CREATE POLICY "Allow public insert access on service_records"
    ON public.service_records FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on service_records" ON public.service_records;
CREATE POLICY "Allow public update access on service_records"
    ON public.service_records FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access on service_records" ON public.service_records;
CREATE POLICY "Allow public delete access on service_records"
    ON public.service_records FOR DELETE
    TO public
    USING (true);

-- ==========================================================
-- Done! Copy and paste this script into your Supabase SQL Editor.
-- ==========================================================
