-- ========================================================
-- TÓC TIE LOYALTY CAMPAIGN - PRODUCTION SUPABASE SCHEMA
-- ========================================================
-- Chạy script này trong Supabase Dashboard -> SQL Editor
-- Link: https://supabase.com/dashboard/project/ylydytwnzelogiwurxcl/sql/new

-- 1. Bảng Khách Hàng (users)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  full_name TEXT UNIQUE NOT NULL,
  phone TEXT,
  note TEXT,
  password_hash TEXT NOT NULL,
  unlocked_pieces INT[] DEFAULT '{}',
  redeemed_codes TEXT[] DEFAULT '{}',
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Đảm bảo các cột tồn tại nếu bảng đã được tạo trước đó
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Bảng Mã Dự Thưởng (redemption_codes)
CREATE TABLE IF NOT EXISTS public.redemption_codes (
  code TEXT PRIMARY KEY,
  is_used BOOLEAN DEFAULT FALSE,
  used_by TEXT,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tạo chỉ mục tìm kiếm tối ưu (Indexes)
CREATE INDEX IF NOT EXISTS idx_users_full_name_lower ON public.users(LOWER(full_name));
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_codes_is_used ON public.redemption_codes(is_used);

-- 4. Bật Row Level Security (RLS) & Phân quyền
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemption_codes ENABLE ROW LEVEL SECURITY;

-- Cấp quyền toàn phần cho service_role (Next.js Backend API Route Handlers)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role Full Access Users' AND tablename = 'users') THEN
    CREATE POLICY "Service Role Full Access Users" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role Full Access Codes' AND tablename = 'redemption_codes') THEN
    CREATE POLICY "Service Role Full Access Codes" ON public.redemption_codes FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 5. Đảm bảo Bucket lưu trữ toctie-store tồn tại
INSERT INTO storage.buckets (id, name, public)
VALUES ('toctie-store', 'toctie-store', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Nạp sẵn chính xác 20 mã dự thưởng cố định của chiến dịch
INSERT INTO public.redemption_codes (code, is_used)
VALUES
  ('TOCTIE-K7M9X', false),
  ('TOCTIE-P4N8Q', false),
  ('TOCTIE-R6T2W', false),
  ('TOCTIE-H9B5Y', false),
  ('TOCTIE-X3D7K', false),
  ('TOCTIE-M8F2P', false),
  ('TOCTIE-Q5L9R', false),
  ('TOCTIE-T7C4N', false),
  ('TOCTIE-B2W6H', false),
  ('TOCTIE-Y9K3F', false),
  ('TOCTIE-N4X8D', false),
  ('TOCTIE-F6P2M', false),
  ('TOCTIE-W3R7L', false),
  ('TOCTIE-D8H5T', false),
  ('TOCTIE-L2Q9B', false),
  ('TOCTIE-C7Y4X', false),
  ('TOCTIE-G5N8P', false),
  ('TOCTIE-V9M3K', false),
  ('TOCTIE-J4T6R', false),
  ('TOCTIE-Z8F2W', false)
ON CONFLICT (code) DO NOTHING;
