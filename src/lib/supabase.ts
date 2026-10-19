import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _cachedClient: SupabaseClient<any> | null = null;
let _cachedUrl = "";
let _cachedKey = "";

export function getSupabaseAdmin(): SupabaseClient<any> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && typeof window === "undefined") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { loadEnvConfig } = require("@next/env");
      loadEnvConfig(process.cwd());
    } catch {}
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!_cachedClient || _cachedUrl !== url || _cachedKey !== key) {
    if (!url || !key) {
      console.warn("Cảnh báo Vercel/Node: Chưa cấu hình đầy đủ NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.");
    }

    _cachedClient = createClient(
      url || "https://placeholder.supabase.co",
      key || "placeholder-key",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            "User-Agent": "toc-tie-backend",
          },
        },
      }
    );
    _cachedUrl = url;
    _cachedKey = key;
  }

  return _cachedClient;
}

// Server-side admin client proxy (dynamically resolves environment variables on Vercel across cold starts)
export const supabaseAdmin: SupabaseClient<any> = new Proxy(
  {} as SupabaseClient<any>,
  {
    get(_target, prop) {
      const client = getSupabaseAdmin();
      const value = (client as any)[prop];
      if (typeof value === "function") {
        return value.bind(client);
      }
      return value;
    },
  }
);
