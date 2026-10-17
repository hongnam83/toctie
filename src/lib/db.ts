// Unified Database Layer for Tóc.Tie Loyalty
// Connects to Supabase with seamless disk-persisted fallback

import { supabaseAdmin } from "./supabase";
import {
  getStore,
  persistStore,
  generateId,
  simpleHash,
  User,
  RedemptionCode,
} from "./store";

export { simpleHash, generateId, persistStore };
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
        connected: true, // Key works, but table not created yet
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
      const u: User = {
        id: data.id,
        fullName: data.full_name,
        passwordHash: data.password_hash,
        createdAt: data.created_at,
        unlockedPieces: data.unlocked_pieces || [],
        redeemedCodes: data.redeemed_codes || [],
      };
      // Keep local store in sync
      const store = getStore();
      store.users.set(u.id, u);
      store.usersByName.set(u.fullName.toLowerCase(), u.id);
      persistStore();
      return u;
    }
  } catch {
    // Supabase unavailable, fall through
  }

  // Local persistent fallback
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
      const u: User = {
        id: data.id,
        fullName: data.full_name,
        passwordHash: data.password_hash,
        createdAt: data.created_at,
        unlockedPieces: data.unlocked_pieces || [],
        redeemedCodes: data.redeemed_codes || [],
      };
      const store = getStore();
      store.users.set(u.id, u);
      store.usersByName.set(u.fullName.toLowerCase(), u.id);
      persistStore();
      return u;
    }
  } catch {
    // Fall through
  }

  const store = getStore();
  return store.users.get(id) || null;
}

/**
 * Create a new user (guaranteed to appear in backend immediately)
 */
export async function createUser(
  fullName: string,
  passwordHash: string = "passwordless"
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

  // 1. Always save to local persistent store immediately
  const store = getStore();
  store.users.set(id, newUser);
  store.usersByName.set(name.toLowerCase(), id);
  persistStore();

  // 2. Sync to Supabase if available
  try {
    await supabaseAdmin.from("users").insert({
      id,
      full_name: name,
      password_hash: passwordHash,
      unlocked_pieces: [],
      redeemed_codes: [],
      created_at: createdAt,
    });
  } catch (err) {
    console.warn("Supabase insert user failed (using disk backup):", err);
  }

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

  // 1. Update in local persistent store
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
  persistStore();

  // 2. Sync to Supabase
  try {
    await Promise.all([
      supabaseAdmin
        .from("redemption_codes")
        .update({
          is_used: true,
          used_by: user.fullName,
          used_at: now,
        })
        .eq("code", normalized),
      supabaseAdmin
        .from("users")
        .update({
          unlocked_pieces: updatedPieces,
          redeemed_codes: updatedCodes,
        })
        .eq("id", user.id),
    ]);
  } catch {
    // Handled by disk persistence
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
  const store = getStore();

  try {
    const [usersRes, codesRes] = await Promise.all([
      supabaseAdmin.from("users").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("redemption_codes").select("*").order("code", { ascending: true }),
    ]);

    if (!usersRes.error && !codesRes.error && usersRes.data && codesRes.data) {
      usersRes.data.forEach((u) => {
        const pieces = u.unlocked_pieces || [];
        const userObj: User = {
          id: u.id,
          fullName: u.full_name,
          passwordHash: u.password_hash,
          createdAt: u.created_at,
          unlockedPieces: pieces,
          redeemedCodes: u.redeemed_codes || [],
        };
        store.users.set(u.id, userObj);
        store.usersByName.set(u.full_name.toLowerCase(), u.id);
      });

      codesRes.data.forEach((c) => {
        store.codes.set(c.code.toUpperCase(), {
          code: c.code.toUpperCase(),
          isUsed: c.is_used,
          usedBy: c.used_by,
          usedAt: c.used_at,
        });
      });

      persistStore();
    }
  } catch {
    // Fallback to local store
  }

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

    if (store.codes.has(code)) {
      skipped.push(code);
    } else {
      store.codes.set(code, { code, isUsed: false });
      added.push(code);
      toInsert.push({ code, is_used: false });
    }
  }

  persistStore();

  if (toInsert.length > 0) {
    try {
      await supabaseAdmin
        .from("redemption_codes")
        .upsert(toInsert, { onConflict: "code", ignoreDuplicates: true });
    } catch {
      // Handled by disk persistence
    }
  }

  return { added, skipped };
}

/**
 * Delete a single redemption code (Admin)
 */
export async function deleteRedemptionCode(
  code: string
): Promise<{ success: boolean; code: string }> {
  const normalized = code.trim().toUpperCase();

  // 1. Delete from local persistent store
  const store = getStore();
  const existed = store.codes.delete(normalized);
  persistStore();

  // 2. Delete from Supabase
  try {
    await supabaseAdmin
      .from("redemption_codes")
      .delete()
      .eq("code", normalized);
  } catch (err) {
    console.warn("Lỗi khi xóa mã trên Supabase:", err);
  }

  return { success: existed, code: normalized };
}

/**
 * Delete multiple redemption codes in batch (Admin)
 */
export async function deleteBatchRedemptionCodes(
  codes: string[]
): Promise<{ success: boolean; deletedCount: number }> {
  const normalizedList = codes.map((c) => c.trim().toUpperCase()).filter(Boolean);
  if (normalizedList.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  const store = getStore();
  let count = 0;
  for (const c of normalizedList) {
    if (store.codes.delete(c)) {
      count++;
    }
  }
  persistStore();

  try {
    await supabaseAdmin
      .from("redemption_codes")
      .delete()
      .in("code", normalizedList);
  } catch (err) {
    console.warn("Lỗi khi xóa danh sách mã trên Supabase:", err);
  }

  return { success: true, deletedCount: count };
}

/**
 * Delete all unused redemption codes (Admin)
 */
export async function deleteUnusedRedemptionCodes(): Promise<{
  success: boolean;
  deletedCount: number;
}> {
  const store = getStore();
  let count = 0;
  const deletedCodes: string[] = [];

  for (const [key, val] of Array.from(store.codes.entries())) {
    if (!val.isUsed) {
      store.codes.delete(key);
      deletedCodes.push(key);
      count++;
    }
  }
  persistStore();

  try {
    await supabaseAdmin
      .from("redemption_codes")
      .delete()
      .eq("is_used", false);
  } catch (err) {
    console.warn("Lỗi khi xóa các mã chưa dùng trên Supabase:", err);
  }

  return { success: true, deletedCount: count };
}

/**
 * Reset password for a user (Admin/Backend only)
 */
export async function resetUserPassword(
  identifier: string,
  newPassword?: string
): Promise<{
  success: boolean;
  newPassword?: string;
  user?: { id: string; fullName: string };
  error?: string;
}> {
  if (!identifier || !identifier.trim()) {
    return { success: false, error: "Thiếu thông tin người dùng (ID hoặc Tên)." };
  }

  const targetId = identifier.trim();

  let user = await findUserById(targetId);
  if (!user) {
    user = await findUserByName(targetId);
  }

  if (!user) {
    return { success: false, error: `Không tìm thấy tài khoản với thông tin: "${targetId}".` };
  }

  const finalPassword =
    newPassword && newPassword.trim().length >= 4
      ? newPassword.trim()
      : `toctie${Math.floor(1000 + Math.random() * 9000)}`;

  const newHash = simpleHash(finalPassword);

  const store = getStore();
  const memUser = store.users.get(user.id);
  if (memUser) {
    memUser.passwordHash = newHash;
  }
  persistStore();

  try {
    await supabaseAdmin
      .from("users")
      .update({ password_hash: newHash })
      .eq("id", user.id);
  } catch (err) {
    console.warn("Lỗi kết nối Supabase khi đổi mật khẩu:", err);
  }

  return {
    success: true,
    newPassword: finalPassword,
    user: {
      id: user.id,
      fullName: user.fullName,
    },
  };
}

/**
 * Rename / Update user account name (Admin only)
 */
export async function renameUserAccount(
  userId: string,
  newAccountName: string
): Promise<{ success: boolean; newName?: string; error?: string }> {
  const trimmed = newAccountName.trim();
  if (!trimmed || trimmed.length < 2) {
    return { success: false, error: "Tên tài khoản mới phải có ít nhất 2 ký tự." };
  }

  const existing = await findUserByName(trimmed);
  if (existing && existing.id !== userId) {
    return { success: false, error: `Tên tài khoản "${trimmed}" đã có người sử dụng.` };
  }

  const store = getStore();
  const user = store.users.get(userId);
  if (user) {
    store.usersByName.delete(user.fullName.toLowerCase());
    user.fullName = trimmed;
    store.usersByName.set(trimmed.toLowerCase(), userId);
    persistStore();
  }

  try {
    await supabaseAdmin
      .from("users")
      .update({ full_name: trimmed })
      .eq("id", userId);
  } catch (err) {
    console.warn("Lỗi kết nối Supabase khi đổi tên tài khoản:", err);
  }

  return { success: true, newName: trimmed };
}

/**
 * Update / Edit a redemption code (Admin)
 * Supports renaming the code and updating its used status / usedBy info.
 */
export async function updateRedemptionCode(
  oldCode: string,
  updates: {
    newCode?: string;
    isUsed?: boolean;
    usedBy?: string | null;
  }
): Promise<{
  success: boolean;
  code?: RedemptionCode;
  error?: string;
}> {
  const normOld = oldCode.trim().toUpperCase();
  const store = getStore();
  const current = store.codes.get(normOld);

  if (!current) {
    return { success: false, error: `Không tìm thấy mã "${normOld}" trong hệ thống.` };
  }

  let finalCode = normOld;

  // 1. Rename check
  if (updates.newCode !== undefined) {
    const normNew = updates.newCode.trim().toUpperCase();
    if (!normNew || normNew.length < 3) {
      return { success: false, error: "Mã dự thưởng mới phải có ít nhất 3 ký tự." };
    }
    if (normNew !== normOld && store.codes.has(normNew)) {
      return { success: false, error: `Mã "${normNew}" đã tồn tại trong hệ thống.` };
    }
    finalCode = normNew;
  }

  // 2. Prepare updated object
  const newIsUsed = updates.isUsed !== undefined ? updates.isUsed : current.isUsed;
  const newUsedBy =
    newIsUsed === false
      ? undefined
      : updates.usedBy !== undefined
      ? (updates.usedBy && updates.usedBy.trim()) || undefined
      : current.usedBy;

  const newUsedAt =
    newIsUsed === false
      ? undefined
      : newIsUsed && !current.isUsed
      ? new Date().toISOString()
      : current.usedAt || (newIsUsed ? new Date().toISOString() : undefined);

  const updatedObj: RedemptionCode = {
    code: finalCode,
    isUsed: newIsUsed,
    usedBy: newUsedBy,
    usedAt: newUsedAt,
  };

  // 3. Update in-memory store
  if (finalCode !== normOld) {
    store.codes.delete(normOld);
    // If used by a user, update user's redeemedCodes list
    for (const u of store.users.values()) {
      const idx = u.redeemedCodes.indexOf(normOld);
      if (idx !== -1) {
        u.redeemedCodes[idx] = finalCode;
      }
    }
  }
  store.codes.set(finalCode, updatedObj);
  persistStore();

  // 4. Update in Supabase
  try {
    const { error } = await supabaseAdmin
      .from("redemption_codes")
      .update({
        code: finalCode,
        is_used: updatedObj.isUsed,
        used_by: updatedObj.usedBy || null,
        used_at: updatedObj.usedAt || null,
      })
      .eq("code", normOld);

    if (error) {
      console.warn("Lỗi update code Supabase:", error);
    }
  } catch (err) {
    console.warn("Lỗi đồng bộ Supabase khi cập nhật mã:", err);
  }

  return { success: true, code: updatedObj };
}

