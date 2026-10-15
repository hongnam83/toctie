-- ========================================================
-- TÓC TIE LOYALTY CAMPAIGN - SUPABASE DATABASE SCHEMA
-- ========================================================

-- 1. Bảng Khách Hàng (users)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  full_name TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  unlocked_pieces INT[] DEFAULT '{}',
  redeemed_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng Mã Đổi Thưởng (redemption_codes)
CREATE TABLE IF NOT EXISTS public.redemption_codes (
  code TEXT PRIMARY KEY,
  is_used BOOLEAN DEFAULT FALSE,
  used_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tạo chỉ mục tìm kiếm tối ưu
CREATE INDEX IF NOT EXISTS idx_users_full_name ON public.users(full_name);
CREATE INDEX IF NOT EXISTS idx_codes_is_used ON public.redemption_codes(is_used);

-- 4. Bật Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemption_codes ENABLE ROW LEVEL SECURITY;

-- Cho phép service_role toàn quyền truy cập (Backend Next.js Route Handlers sử dụng Service Role Key)
CREATE POLICY "Service Role Full Access Users" ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service Role Full Access Codes" ON public.redemption_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Nạp sẵn 20 mã dự thưởng khởi đầu cho chiến dịch 20/10
INSERT INTO public.redemption_codes (code, is_used)
VALUES
  ('TOCTIE-2010-AAAA', false),
  ('TOCTIE-2010-BBBB', false),
  ('TOCTIE-2010-CCCC', false),
  ('TOCTIE-2010-DDDD', false),
  ('TOCTIE-2010-EEEE', false),
  ('TOCTIE-2010-FFFF', false),
  ('TOCTIE-2010-GGGG', false),
  ('TOCTIE-2010-HHHH', false),
  ('TOCTIE-2010-IIII', false),
  ('TOCTIE-2010-JJJJ', false),
  ('TOCTIE-2010-KKKK', false),
  ('TOCTIE-2010-LLLL', false),
  ('TOCTIE-2010-MMMM', false),
  ('TOCTIE-2010-NNNN', false),
  ('TOCTIE-2010-OOOO', false),
  ('TOCTIE-2010-PPPP', false),
  ('TOCTIE-2010-QQQQ', false),
  ('TOCTIE-2010-RRRR', false),
  ('TOCTIE-2010-SSSS', false),
  ('TOCTIE-2010-TTTT', false)
ON CONFLICT (code) DO NOTHING;
