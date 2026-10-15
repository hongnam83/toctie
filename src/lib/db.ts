// Unified Database Layer for Tóc.Tie Loyalty
// Connects to Supabase with seamless in-memory fallback

import { supabaseAdmin } from "./supabase";
import { getStore, generateId, simpleHash, User, RedemptionCode } from "./store";

export { simpleHash, generateId };
export type { User, RedemptionCode };

let isSupabaseAvailable: boolean | null = null;

/**
 * Check if Supabase tables exist and connection is functional
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  tablesReady: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from("redemption_codes")
      .select("code")
      .limit(1);

    if (error) {
      return {
        connected: true, // Key works, but table not found yet
        tablesReady: false,
        error: error.message,
      };
    }

    isSupabaseAvailable = true;
    return { connected: true, tablesReady: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    isSupabaseAvailable = false;
    return { connected: false, tablesReady: false, error: errorMsg };
  }
}

/**
 * Find a user by full name (case-insensitive)
 */
export async function findUserByName(fullName: string): Promise<User | null> {
  const normalized = fullName.trim();
  
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .ilike("full_name", normalized)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        fullName: data.full_name,
        passwordHash: data.password_hash,
        createdAt: data.created_at,
        unlockedPieces: data.unlocked_pieces || [],
        redeemedCodes: data.redeemed_codes || [],
      };
    }
  } catch {
    // Supabase unavailable, fall through to memory store
  }

  // In-memory fallback
  const store = getStore();
  const userId = store.usersByName.get(normalized.toLowerCase());
  if (userId) {
    const u = store.users.get(userId);
    return u || null;
  }
  return null;
}

/**
 * Find a user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        fullName: data.full_name,
        passwordHash: data.password_hash,
        createdAt: data.created_at,
        unlockedPieces: data.unlocked_pieces || [],
        redeemedCodes: data.redeemed_codes || [],
      };
    }
  } catch {
    // Fall through
  }

  const store = getStore();
  return store.users.get(id) || null;
}

/**
 * Create a new user
 */
export async function createUser(
  fullName: string,
  passwordHash: string
): Promise<User> {
  const name = fullName.trim();
  const id = generateId();
  const createdAt = new Date().toISOString();
  const newUser: User = {
    id,
    fullName: name,
    passwordHash,
    createdAt,
    unlockedPieces: [],
    redeemedCodes: [],
  };

  try {
    const { error } = await supabaseAdmin.from("users").insert({
      id,
      full_name: name,
      password_hash: passwordHash,
      unlocked_pieces: [],
      redeemed_codes: [],
      created_at: createdAt,
    });

    if (!error) {
      // Also cache in memory for speed
      const store = getStore();
      store.users.set(id, newUser);
      store.usersByName.set(name.toLowerCase(), id);
      return newUser;
    }
  } catch {
    // Fall through
  }

  // In-memory fallback
  const store = getStore();
  store.users.set(id, newUser);
  store.usersByName.set(name.toLowerCase(), id);
  return newUser;
}

/**
 * Get a redemption code
 */
export async function getRedemptionCode(code: string): Promise<RedemptionCode | null> {
  const normalized = code.trim().toUpperCase();

  try {
    const { data, error } = await supabaseAdmin
      .from("redemption_codes")
      .select("*")
      .eq("code", normalized)
      .maybeSingle();

    if (!error && data) {
      return {
        code: data.code,
        isUsed: data.is_used,
        usedBy: data.used_by,
        usedAt: data.used_at,
      };
    }
  } catch {
    // Fall through
  }

  const store = getStore();
  return store.codes.get(normalized) || null;
}

/**
 * Redeem a code and award a new puzzle piece to user
 */
export async function redeemCode(
  user: User,
  code: string,
  newPiece: number
): Promise<{ success: boolean; unlockedPieces: number[] }> {
  const normalized = code.trim().toUpperCase();
  const now = new Date().toISOString();
  const updatedPieces = [...user.unlockedPieces, newPiece];
  const updatedCodes = [...user.redeemedCodes, normalized];

  try {
    // 1. Update code status in Supabase
    await supabaseAdmin
      .from("redemption_codes")
      .update({
        is_used: true,
        used_by: user.fullName,
        used_at: now,
      })
      .eq("code", normalized);

    // 2. Update user puzzle pieces in Supabase
    await supabaseAdmin
      .from("users")
      .update({
        unlocked_pieces: updatedPieces,
        redeemed_codes: updatedCodes,
      })
      .eq("id", user.id);
  } catch {
    // Continue with in-memory sync
  }

  // Update in-memory store
  const store = getStore();
  const memoryCode = store.codes.get(normalized);
  if (memoryCode) {
    memoryCode.isUsed = true;
    memoryCode.usedBy = user.fullName;
    memoryCode.usedAt = now;
  }
  const memoryUser = store.users.get(user.id);
  if (memoryUser) {
    memoryUser.unlockedPieces = updatedPieces;
    memoryUser.redeemedCodes = updatedCodes;
  }

  return { success: true, unlockedPieces: updatedPieces };
}

/**
 * Get all users and codes for Admin Dashboard
 */
export async function getAdminData(): Promise<{
  users: Array<User & { pieceCount: number; isComplete: boolean }>;
  codes: RedemptionCode[];
}> {
  try {
    const [usersRes, codesRes] = await Promise.all([
      supabaseAdmin.from("users").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("redemption_codes").select("*").order("code", { ascending: true }),
    ]);

    if (!usersRes.error && !codesRes.error && usersRes.data && codesRes.data) {
      const users = usersRes.data.map((u) => {
        const pieces = u.unlocked_pieces || [];
        return {
          id: u.id,
          fullName: u.full_name,
          passwordHash: u.password_hash,
          createdAt: u.created_at,
          unlockedPieces: pieces,
          pieceCount: pieces.length,
          isComplete: pieces.length === 4,
          redeemedCodes: u.redeemed_codes || [],
        };
      });

      const codes: RedemptionCode[] = codesRes.data.map((c) => ({
        code: c.code,
        isUsed: c.is_used,
        usedBy: c.used_by,
        usedAt: c.used_at,
      }));

      return { users, codes };
    }
  } catch {
    // Fallback to in-memory
  }

  const store = getStore();
  const users = Array.from(store.users.values()).map((u) => ({
    ...u,
    pieceCount: u.unlockedPieces.length,
    isComplete: u.unlockedPieces.length === 4,
  }));
  const codes = Array.from(store.codes.values());

  return { users, codes };
}

/**
 * Add new codes in batch (Admin)
 */
export async function addBatchCodes(
  codes: string[]
): Promise<{ added: string[]; skipped: string[] }> {
  const store = getStore();
  const added: string[] = [];
  const skipped: string[] = [];

  const toInsert: Array<{ code: string; is_used: boolean }> = [];

  for (const raw of codes) {
    const code = raw.trim().toUpperCase();
    if (!code) continue;

    // Check memory first
    if (store.codes.has(code)) {
      skipped.push(code);
    } else {
      store.codes.set(code, { code, isUsed: false });
      added.push(code);
      toInsert.push({ code, is_used: false });
    }
  }

  if (toInsert.length > 0) {
    try {
      await supabaseAdmin.from("redemption_codes").upsert(toInsert, { onConflict: "code", ignoreDuplicates: true });
    } catch {
      // Handled in memory
    }
  }

  return { added, skipped };
}
