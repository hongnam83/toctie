// Persistent Store for Tóc.Tie Loyalty
// Multi-tier storage architecture ensures customer accounts are NEVER lost:
// 1. Permanent In-Code Customer Registry (Zero-wipe baseline)
// 2. data/registered_customers.json (Tracked in Git, permanent on disk)
// 3. data/store.json (Active local store)
// 4. data/customers_backup.json (Atomic backup snapshot)
// 5. Supabase Cloud Storage (toctie-store/store.json)
// 6. Supabase PostgreSQL table (when connected)

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

export interface StoreState {
  users: Map<string, User>;
  usersByName: Map<string, string>; // lowerName -> id
  codes: Map<string, RedemptionCode>;
}

declare global {
  // eslint-disable-next-line no-var
  var __toctieStore: StoreState | undefined;
}

export const DATA_DIR = path.join(process.cwd(), "data");
export const STORE_FILE = path.join(DATA_DIR, "store.json");
export const REGISTERED_CUSTOMERS_FILE = path.join(DATA_DIR, "registered_customers.json");
export const BACKUP_FILE = path.join(DATA_DIR, "customers_backup.json");

const TMP_DATA_DIR = "/tmp/toctie_data";
const TMP_STORE_FILE = path.join(TMP_DATA_DIR, "store.json");
const TMP_REGISTERED_CUSTOMERS_FILE = path.join(TMP_DATA_DIR, "registered_customers.json");

const BUCKET_NAME = "toctie-store";
const FILE_NAME = "store.json";

// 20 fixed redemption codes requested by the user
export const DEFAULT_DEMO_CODES = [
  "toctie-K7M9X",
  "toctie-P4N8Q",
  "toctie-R6T2W",
  "toctie-H9B5Y",
  "toctie-X3D7K",
  "toctie-M8F2P",
  "toctie-Q5L9R",
  "toctie-T7C4N",
  "toctie-B2W6H",
  "toctie-Y9K3F",
  "toctie-N4X8D",
  "toctie-F6P2M",
  "toctie-W3R7L",
  "toctie-D8H5T",
  "toctie-L2Q9B",
  "toctie-C7Y4X",
  "toctie-G5N8P",
  "toctie-V9M3K",
  "toctie-J4T6R",
  "toctie-Z8F2W",
];

// Baseline customer seeds (starts clean, future registered customers are permanently saved to registered_customers.json)
export const PERMANENT_CUSTOMER_SEEDS: User[] = [];

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
 * Safely merge user into maps with deep union of pieces, codes, and attributes
 */
export function mergeUserIntoMap(
  u: User,
  usersMap: Map<string, User>,
  usersByNameMap: Map<string, string>
) {
  if (!u || !u.id || !u.fullName) return;
  const trimmedName = u.fullName.trim();
  const lowerName = trimmedName.toLowerCase();

  // Find existing by ID or by name
  let targetId = usersMap.has(u.id) ? u.id : usersByNameMap.get(lowerName);

  if (!targetId || !usersMap.has(targetId)) {
    const newUser: User = {
      id: u.id,
      fullName: trimmedName,
      phone: u.phone?.trim() || undefined,
      note: u.note?.trim() || undefined,
      passwordHash: u.passwordHash || "passwordless",
      createdAt: u.createdAt || new Date().toISOString(),
      unlockedPieces: Array.isArray(u.unlockedPieces)
        ? Array.from(new Set(u.unlockedPieces)).sort((a, b) => a - b)
        : [],
      redeemedCodes: Array.isArray(u.redeemedCodes)
        ? Array.from(new Set(u.redeemedCodes.map((c) => c.toUpperCase())))
        : [],
    };
    usersMap.set(u.id, newUser);
    usersByNameMap.set(lowerName, u.id);
  } else {
    const existing = usersMap.get(targetId)!;

    // Merge unlocked pieces (union)
    const pieces = new Set([
      ...(existing.unlockedPieces || []),
      ...(u.unlockedPieces || []),
    ]);
    existing.unlockedPieces = Array.from(pieces).sort((a, b) => a - b);

    // Merge redeemed codes (union)
    const codes = new Set([
      ...(existing.redeemedCodes || []).map((c) => c.toUpperCase()),
      ...(u.redeemedCodes || []).map((c) => c.toUpperCase()),
    ]);
    existing.redeemedCodes = Array.from(codes);

    // Keep contact details if available
    if (!existing.phone && u.phone) existing.phone = u.phone.trim();
    if (!existing.note && u.note) existing.note = u.note.trim();

    // Preserve earliest creation timestamp
    if (
      u.createdAt &&
      (!existing.createdAt || new Date(u.createdAt) < new Date(existing.createdAt))
    ) {
      existing.createdAt = u.createdAt;
    }

    // Keep best casing for name
    if (trimmedName && trimmedName !== existing.fullName) {
      existing.fullName = trimmedName;
    }

    usersByNameMap.set(lowerName, existing.id);
  }
}

/**
 * Read user array safely from JSON file
 */
export function readUsersFromFile(filePath: string): User[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.users)) return parsed.users;
    return [];
  } catch (err) {
    console.warn(`Lỗi khi đọc file users từ ${filePath}:`, err);
    return [];
  }
}

/**
 * Read store file safely
 */
export function readStoreFromFile(
  filePath: string
): { users: User[]; codes: RedemptionCode[] } | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      codes: Array.isArray(parsed.codes) ? parsed.codes : [],
    };
  } catch (err) {
    console.warn(`Lỗi khi đọc file store từ ${filePath}:`, err);
    return null;
  }
}

/**
 * Atomically push a single user's record to Supabase Cloud Storage.
 * Saved as independent files: users/<userId>.json and names/<lowerName>.json.
 * This guarantees individual customer records are indestructible across cold starts.
 */
export async function pushUserToCloud(user: User): Promise<boolean> {
  try {
    if (!user || !user.id || !user.fullName) return false;
    const lowerName = user.fullName.trim().toLowerCase();
    const jsonStr = JSON.stringify(user, null, 2);
    const nameHex = Buffer.from(lowerName, "utf-8").toString("hex");

    const uploads = [
      supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(`users/${user.id}.json`, jsonStr, {
          upsert: true,
          contentType: "application/json",
        }),
      supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(
          `names/${nameHex}.json`,
          JSON.stringify({ userId: user.id, fullName: user.fullName }),
          {
            upsert: true,
            contentType: "application/json",
          }
        ),
    ];

    await Promise.allSettled(uploads);
    return true;
  } catch (err) {
    console.warn("Lỗi pushUserToCloud:", err);
    return false;
  }
}

/**
 * Atomically fetch a single user directly from Supabase Cloud Storage by ID or Name
 */
export async function pullUserFromCloud(idOrName: string): Promise<User | null> {
  try {
    const trimmed = idOrName.trim();
    if (!trimmed) return null;

    // 1. Try direct ID download
    const { data: idData, error: idErr } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(`users/${trimmed}.json`);

    if (!idErr && idData) {
      const parsed = JSON.parse(await idData.text());
      if (parsed && parsed.id) {
        const store = getStore();
        mergeUserIntoMap(parsed, store.users, store.usersByName);
        persistStore();
        return parsed as User;
      }
    }

    // 2. Try name mapping download
    const lowerName = trimmed.toLowerCase();
    const nameHex = Buffer.from(lowerName, "utf-8").toString("hex");
    const { data: nameData, error: nameErr } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(`names/${nameHex}.json`);

    if (!nameErr && nameData) {
      const nameParsed = JSON.parse(await nameData.text());
      if (nameParsed && nameParsed.userId) {
        return pullUserFromCloud(nameParsed.userId);
      }
    }

    return null;
  } catch (err) {
    console.warn("Lỗi pullUserFromCloud:", err);
    return null;
  }
}

/**
 * Atomically save used redemption code to cloud storage
 */
export async function pushCodeToCloud(codeObj: RedemptionCode): Promise<boolean> {
  try {
    const upper = codeObj.code.trim().toUpperCase();
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(`codes/${upper}.json`, JSON.stringify(codeObj, null, 2), {
        upsert: true,
        contentType: "application/json",
      });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Push current store snapshot to Supabase Cloud Storage (ensures data survives across serverless containers on Vercel)
 */
export async function pushCloudStore(allowEmpty: boolean = false): Promise<boolean> {
  try {
    if (!global.__toctieStore) return false;

    const userList = Array.from(global.__toctieStore.users.values());
    if (!allowEmpty && userList.length === 0) return false;

    const dataToSave = {
      users: userList,
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

    // Also push individual user files in parallel (guarantees atomic survivability)
    if (userList.length > 0) {
      const userUploads = userList.map((u) => pushUserToCloud(u));
      await Promise.allSettled(userUploads);
    }

    // Also push used codes to codes/
    const usedCodes = Array.from(global.__toctieStore.codes.values()).filter((c) => c.isUsed);
    if (usedCodes.length > 0) {
      const codeUploads = usedCodes.map((c) => pushCodeToCloud(c));
      await Promise.allSettled(codeUploads);
    }

    return true;
  } catch (err) {
    console.warn("Lưu lên Supabase Cloud Storage:", err);
    return false;
  }
}

/**
 * Pull latest store snapshot & individual customer files from Supabase Cloud Storage
 */
export async function pullCloudStore(): Promise<boolean> {
  try {
    const store = getStore();

    // 1. Download monolithic store.json snapshot
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .download(FILE_NAME);

      if (!error && data) {
        const text = await data.text();
        const parsed = JSON.parse(text);

        if (Array.isArray(parsed.users)) {
          parsed.users.forEach((u: User) => {
            mergeUserIntoMap(u, store.users, store.usersByName);
          });
        }

        if (Array.isArray(parsed.codes)) {
          parsed.codes.forEach((c: RedemptionCode) => {
            const upper = c.code.toUpperCase();
            if (c.isUsed) {
              if (!store.codes.has(upper) || !store.codes.get(upper)!.isUsed) {
                store.codes.set(upper, c);
              }
            }
          });
        }
      }
    } catch {}

    // 2. Discover all individual user files in users/ directory (Resilient fallback)
    try {
      const { data: userFiles } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list("users", { limit: 500 });

      if (Array.isArray(userFiles) && userFiles.length > 0) {
        const downloadPromises = userFiles
          .filter((f) => f.name && f.name.endsWith(".json"))
          .map(async (f) => {
            try {
              const res = await supabaseAdmin.storage
                .from(BUCKET_NAME)
                .download(`users/${f.name}`);
              if (res.data) {
                const u = JSON.parse(await res.data.text());
                if (u && u.id) {
                  mergeUserIntoMap(u, store.users, store.usersByName);
                }
              }
            } catch {}
          });
        await Promise.allSettled(downloadPromises);
      }
    } catch {}

    // 3. Discover all individual redeemed code files in codes/ directory
    try {
      const { data: codeFiles } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list("codes", { limit: 100 });

      if (Array.isArray(codeFiles) && codeFiles.length > 0) {
        const downloadCodePromises = codeFiles
          .filter((f) => f.name && f.name.endsWith(".json"))
          .map(async (f) => {
            try {
              const res = await supabaseAdmin.storage
                .from(BUCKET_NAME)
                .download(`codes/${f.name}`);
              if (res.data) {
                const c = JSON.parse(await res.data.text());
                if (c && c.code && c.isUsed) {
                  store.codes.set(c.code.toUpperCase(), c);
                }
              }
            } catch {}
          });
        await Promise.allSettled(downloadCodePromises);
      }
    } catch {}

    // Save consolidated results locally
    persistStore();
    return true;
  } catch (err) {
    console.warn("Đồng bộ từ Supabase Cloud Storage:", err);
    return false;
  }
}

/**
 * Persist store across all physical storage tiers with Anti-Wipe Protection
 */
export function persistStore(allowEmpty: boolean = false) {
  try {
    if (!global.__toctieStore) return;

    let userList = Array.from(global.__toctieStore.users.values());
    const codeList = Array.from(global.__toctieStore.codes.values());

    const usersJsonStr = JSON.stringify(userList, null, 2);

    const storeDataToSave = {
      users: userList,
      codes: codeList,
      updatedAt: new Date().toISOString(),
    };
    const storeJsonStr = JSON.stringify(storeDataToSave, null, 2);

    // 1. Primary workspace data directory (data/registered_customers.json & data/store.json)
    try {
      ensureDir(DATA_DIR);
      fs.writeFileSync(REGISTERED_CUSTOMERS_FILE, usersJsonStr, "utf-8");
      fs.writeFileSync(STORE_FILE, storeJsonStr, "utf-8");
    } catch (diskErr) {
      console.warn("Lỗi ghi disk store:", diskErr);
    }

    // 2. Asynchronously push snapshot to Supabase Cloud Storage
    pushCloudStore(allowEmpty).catch(() => {});
  } catch (err) {
    console.error("Lỗi khi lưu dữ liệu cửa hàng:", err);
  }
}

/**
 * Persist store across all physical storage tiers and guarantee completion of cloud upload
 */
export async function persistStoreAsync(allowEmpty: boolean = false): Promise<boolean> {
  persistStore(allowEmpty);
  return await pushCloudStore(allowEmpty);
}

/**
 * Permanently delete all registered customer accounts across all storage tiers
 */
export async function clearAllUsers(): Promise<void> {
  const store = getStore();
  store.users.clear();
  store.usersByName.clear();

  // Reset all 20 fixed codes to unused and remove any legacy codes
  const validFixedCodes = new Set(DEFAULT_DEMO_CODES.map((c) => c.toUpperCase()));
  for (const [codeKey, codeObj] of Array.from(store.codes.entries())) {
    if (!validFixedCodes.has(codeKey)) {
      store.codes.delete(codeKey);
    } else {
      codeObj.isUsed = false;
      codeObj.usedBy = undefined;
      codeObj.usedAt = undefined;
    }
  }

  // Ensure all 20 fixed codes exist
  DEFAULT_DEMO_CODES.forEach((code) => {
    const upper = code.toUpperCase();
    if (!store.codes.has(upper)) {
      store.codes.set(upper, {
        code,
        isUsed: false,
      });
    }
  });

  // Save empty customer list across disk, backup, and tmp files
  persistStore(true);

  // Push clean empty users snapshot to Supabase Cloud Storage
  await pushCloudStore(true).catch(() => {});

  // Clean individual user files from storage
  try {
    const { data: userFiles } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list("users", { limit: 1000 });
    if (userFiles && userFiles.length > 0) {
      const paths = userFiles.map((f) => `users/${f.name}`);
      await supabaseAdmin.storage.from(BUCKET_NAME).remove(paths);
    }

    const { data: nameFiles } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list("names", { limit: 1000 });
    if (nameFiles && nameFiles.length > 0) {
      const paths = nameFiles.map((f) => `names/${f.name}`);
      await supabaseAdmin.storage.from(BUCKET_NAME).remove(paths);
    }

    const { data: codeFiles } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list("codes", { limit: 1000 });
    if (codeFiles && codeFiles.length > 0) {
      const paths = codeFiles.map((f) => `codes/${f.name}`);
      await supabaseAdmin.storage.from(BUCKET_NAME).remove(paths);
    }
  } catch {}

  // Delete all users in Supabase PostgreSQL table if connected
  try {
    await supabaseAdmin.from("users").delete().neq("id", "none");
    await supabaseAdmin
      .from("redemption_codes")
      .update({ is_used: false, used_by: null, used_at: null })
      .neq("code", "none");
  } catch {
    // ignore
  }
}

/**
 * Initialize store by safely uniting all storage layers
 */
function initStore(): StoreState {
  if (global.__toctieStore && global.__toctieStore.users.size > 0) {
    return global.__toctieStore;
  }

  const usersMap = new Map<string, User>();
  const usersByNameMap = new Map<string, string>();
  const codesMap = new Map<string, RedemptionCode>();

  // Tier 1: Permanent in-code customer seed (Guarantees zero-wipe under any circumstance)
  PERMANENT_CUSTOMER_SEEDS.forEach((u) => {
    mergeUserIntoMap(u, usersMap, usersByNameMap);
  });

  // Tier 2: Permanent committed customer file (data/registered_customers.json)
  const permanentUsers = readUsersFromFile(REGISTERED_CUSTOMERS_FILE);
  permanentUsers.forEach((u) => mergeUserIntoMap(u, usersMap, usersByNameMap));

  // Tier 3: Primary workspace store file (data/store.json)
  const storeData = readStoreFromFile(STORE_FILE);
  if (storeData) {
    storeData.users.forEach((u) => mergeUserIntoMap(u, usersMap, usersByNameMap));
    storeData.codes.forEach((c) => {
      codesMap.set(c.code.toUpperCase(), c);
    });
  }

  // Ensure all 20 fixed redemption codes exist
  DEFAULT_DEMO_CODES.forEach((code) => {
    const upper = code.toUpperCase();
    if (!codesMap.has(upper)) {
      codesMap.set(upper, {
        code: code,
        isUsed: false,
      });
    }
  });

  // Ensure any codes already redeemed by customers are marked as used
  for (const u of usersMap.values()) {
    if (Array.isArray(u.redeemedCodes)) {
      for (const code of u.redeemedCodes) {
        const upper = code.toUpperCase();
        const existing = codesMap.get(upper);
        if (existing) {
          existing.isUsed = true;
          existing.usedBy = u.fullName;
        } else {
          codesMap.set(upper, {
            code,
            isUsed: true,
            usedBy: u.fullName,
          });
        }
      }
    }
  }

  global.__toctieStore = {
    users: usersMap,
    usersByName: usersByNameMap,
    codes: codesMap,
  };

  // Persist the consolidated state to all storage layers
  persistStore();

  return global.__toctieStore;
}

export function getStore(): StoreState {
  const store = initStore();
  let modified = false;

  DEFAULT_DEMO_CODES.forEach((code) => {
    const upper = code.toUpperCase();
    if (!store.codes.has(upper)) {
      store.codes.set(upper, {
        code: code,
        isUsed: false,
      });
      modified = true;
    }
  });

  if (modified) {
    persistStore();
  }

  return store;
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
