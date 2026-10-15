// Persistent Store for Tóc.Tie Loyalty
// Automatically persists to local disk (data/store.json) so data is never lost across server restarts
// Also syncs with Supabase database when connected

import fs from "fs";
import path from "path";

export interface User {
  id: string;
  fullName: string;
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

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Lỗi khi tạo thư mục data:", err);
  }
}

export function persistStore() {
  try {
    if (!global.__toctieStore) return;
    ensureDataDir();

    const dataToSave = {
      users: Array.from(global.__toctieStore.users.values()),
      codes: Array.from(global.__toctieStore.codes.values()),
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(STORE_FILE, JSON.stringify(dataToSave, null, 2), "utf-8");
  } catch (err) {
    console.error("Lỗi khi lưu dữ liệu ra file data/store.json:", err);
  }
}

function initStore(): StoreState {
  if (global.__toctieStore) {
    return global.__toctieStore;
  }

  ensureDataDir();

  const usersMap = new Map<string, User>();
  const usersByNameMap = new Map<string, string>();
  const codesMap = new Map<string, RedemptionCode>();

  // Check if store file exists on disk
  if (fs.existsSync(STORE_FILE)) {
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
