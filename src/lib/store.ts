// Persistent Store for Tóc.Tie Loyalty
// Automatically persists to local disk (data/store.json or /tmp fallback) so data is never lost across server restarts
// Also syncs with Supabase database when connected

import fs from "fs";
import path from "path";
import { supabaseAdmin } from "./supabase";

export interface User {
  id: string;
  fullName: string;
  phone?: string;
  note?: string;
  passwordHash: string;
  createdAt: string;
  unlockedPieces: number[];
  redeemedCodes: string[];
}

export interface RedemptionCode {
  code: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
}

interface StoreState {
  users: Map<string, User>;
  usersByName: Map<string, string>; // lowerName -> id
  codes: Map<string, RedemptionCode>;
}

declare global {
  // eslint-disable-next-line no-var
  var __toctieStore: StoreState | undefined;
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");
const TMP_DATA_DIR = "/tmp/toctie_data";
const TMP_STORE_FILE = path.join(TMP_DATA_DIR, "store.json");
const BUCKET_NAME = "toctie-store";
const FILE_NAME = "store.json";

const DEFAULT_DEMO_CODES = [
  "TOCTIE-2010-AAAA",
  "TOCTIE-2010-BBBB",
  "TOCTIE-2010-CCCC",
  "TOCTIE-2010-DDDD",
  "TOCTIE-2010-EEEE",
  "TOCTIE-2010-FFFF",
  "TOCTIE-2010-GGGG",
  "TOCTIE-2010-HHHH",
  "TOCTIE-2010-IIII",
  "TOCTIE-2010-JJJJ",
  "TOCTIE-2010-KKKK",
  "TOCTIE-2010-LLLL",
  "TOCTIE-2010-MMMM",
  "TOCTIE-2010-NNNN",
  "TOCTIE-2010-OOOO",
  "TOCTIE-2010-PPPP",
  "TOCTIE-2010-QQQQ",
  "TOCTIE-2010-RRRR",
  "TOCTIE-2010-SSSS",
  "TOCTIE-2010-TTTT",
];

function ensureDir(dir: string) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // ignore
  }
}

/**
 * Push current store snapshot to Supabase Cloud Storage (ensures data survives across serverless containers on Vercel)
 */
export async function pushCloudStore(): Promise<boolean> {
  try {
    if (!global.__toctieStore) return false;

    const dataToSave = {
      users: Array.from(global.__toctieStore.users.values()),
      codes: Array.from(global.__toctieStore.codes.values()),
      updatedAt: new Date().toISOString(),
    };

    const jsonStr = JSON.stringify(dataToSave, null, 2);

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(FILE_NAME, jsonStr, {
        upsert: true,
        contentType: "application/json",
      });

    if (error) {
      if (
        error.message?.includes("Bucket not found") ||
        error.message?.includes("not found")
      ) {
        await supabaseAdmin.storage.createBucket(BUCKET_NAME, { public: false });
        await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .upload(FILE_NAME, jsonStr, {
            upsert: true,
            contentType: "application/json",
          });
      }
    }
    return true;
  } catch (err) {
    console.warn("Lưu lên Supabase Cloud Storage:", err);
    return false;
  }
}

/**
 * Pull latest store snapshot from Supabase Cloud Storage and merge into memory
 */
export async function pullCloudStore(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(FILE_NAME);

    if (error || !data) return false;

    const text = await data.text();
    const parsed = JSON.parse(text);
    const store = getStore();

    if (Array.isArray(parsed.users)) {
      parsed.users.forEach((u: User) => {
        if (!store.users.has(u.id)) {
          store.users.set(u.id, u);
          store.usersByName.set(u.fullName.toLowerCase(), u.id);
        } else {
          const local = store.users.get(u.id)!;
          if (
            (u.unlockedPieces?.length || 0) >=
            (local.unlockedPieces?.length || 0)
          ) {
            store.users.set(u.id, u);
            store.usersByName.set(u.fullName.toLowerCase(), u.id);
          }
        }
      });
    }

    if (Array.isArray(parsed.codes)) {
      parsed.codes.forEach((c: RedemptionCode) => {
        const upper = c.code.toUpperCase();
        if (!store.codes.has(upper) || c.isUsed) {
          store.codes.set(upper, c);
        }
      });
    }

    return true;
  } catch (err) {
    console.warn("Đồng bộ từ Supabase Cloud Storage:", err);
    return false;
  }
}

export function persistStore() {
  try {
    if (!global.__toctieStore) return;

    const dataToSave = {
      users: Array.from(global.__toctieStore.users.values()),
      codes: Array.from(global.__toctieStore.codes.values()),
      updatedAt: new Date().toISOString(),
    };

    const jsonStr = JSON.stringify(dataToSave, null, 2);

    // 1. Try primary workspace data directory
    try {
      ensureDir(DATA_DIR);
      fs.writeFileSync(STORE_FILE, jsonStr, "utf-8");
    } catch {
      // Fallback to /tmp for serverless environments (Vercel)
      try {
        ensureDir(TMP_DATA_DIR);
        fs.writeFileSync(TMP_STORE_FILE, jsonStr, "utf-8");
      } catch (tmpErr) {
        console.warn("Lưu tmp store thất bại:", tmpErr);
      }
    }

    // 2. Asynchronously sync to Supabase Cloud Storage
    pushCloudStore().catch(() => {});
  } catch (err) {
    console.error("Lỗi khi lưu dữ liệu cửa hàng:", err);
  }
}

function initStore(): StoreState {
  if (global.__toctieStore) {
    return global.__toctieStore;
  }

  const usersMap = new Map<string, User>();
  const usersByNameMap = new Map<string, string>();
  const codesMap = new Map<string, RedemptionCode>();

  let loaded = false;

  // Check /tmp first (in case running in serverless where /tmp was modified)
  if (fs.existsSync(TMP_STORE_FILE)) {
    try {
      const raw = fs.readFileSync(TMP_STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.users)) {
        parsed.users.forEach((u: User) => {
          usersMap.set(u.id, u);
          usersByNameMap.set(u.fullName.toLowerCase(), u.id);
        });
      }
      if (Array.isArray(parsed.codes)) {
        parsed.codes.forEach((c: RedemptionCode) => {
          codesMap.set(c.code.toUpperCase(), c);
        });
      }
      loaded = true;
    } catch {
      // fall through
    }
  }

  // If not loaded from tmp, check workspace STORE_FILE
  if (!loaded && fs.existsSync(STORE_FILE)) {
    try {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed.users)) {
        parsed.users.forEach((u: User) => {
          usersMap.set(u.id, u);
          usersByNameMap.set(u.fullName.toLowerCase(), u.id);
        });
      }

      if (Array.isArray(parsed.codes)) {
        parsed.codes.forEach((c: RedemptionCode) => {
          codesMap.set(c.code.toUpperCase(), c);
        });
      }
    } catch (err) {
      console.error("Lỗi khi đọc file store.json, khởi tạo lại từ đầu:", err);
    }
  }

  // If no codes exist yet, seed demo codes
  if (codesMap.size === 0) {
    DEFAULT_DEMO_CODES.forEach((code) => {
      codesMap.set(code.toUpperCase(), {
        code: code.toUpperCase(),
        isUsed: false,
      });
    });
  }

  global.__toctieStore = {
    users: usersMap,
    usersByName: usersByNameMap,
    codes: codesMap,
  };

  // Save initial snapshot
  persistStore();

  return global.__toctieStore;
}

export function getStore(): StoreState {
  return initStore();
}

export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
