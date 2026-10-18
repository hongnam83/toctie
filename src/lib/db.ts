// Unified Database Layer for Tóc.Tie Loyalty
// Connects to Supabase PostgreSQL & Cloud Storage with seamless multi-tier persistence

import { supabaseAdmin } from "./supabase";
import {
  getStore,
  persistStore,
  persistStoreAsync,
  generateId,
  simpleHash,
  pushCloudStore,
  pullCloudStore,
  pushUserToCloud,
  pullUserFromCloud,
  pushCodeToCloud,
  User,
  RedemptionCode,
  mergeUserIntoMap,
  DEFAULT_DEMO_CODES,
  readUsersFromFile,
  REGISTERED_CUSTOMERS_FILE,
  clearAllUsers,
} from "./store";
import { hashPassword, verifyPassword } from "./auth-crypto";

export {
  simpleHash,
  hashPassword,
  verifyPassword,
  generateId,
  persistStore,
  persistStoreAsync,
  pushCloudStore,
  pullCloudStore,
  pushUserToCloud,
  pullUserFromCloud,
  pushCodeToCloud,
  clearAllUsers,
};
export type { User, RedemptionCode };

export interface SanitizedUser {
  id: string;
  fullName: string;
  phone?: string;
  note?: string;
  createdAt: string;
  unlockedPieces: number[];
  redeemedCodes: string[];
  isComplete: boolean;
}

/**
 * Strips sensitive fields (like passwordHash) before sending to client
 */
export function sanitizeUser(u: User): SanitizedUser {
  return {
    id: u.id,
    fullName: u.fullName,
    phone: u.phone,
    note: u.note,
    createdAt: u.createdAt,
    unlockedPieces: Array.isArray(u.unlockedPieces) ? u.unlockedPieces : [],
    redeemedCodes: Array.isArray(u.redeemedCodes) ? u.redeemedCodes : [],
    isComplete: Array.isArray(u.unlockedPieces) && u.unlockedPieces.length === 4,
  };
}

let isSupabaseAvailable: boolean | null = null;

/**
 * Check if Supabase connection, storage, and PostgreSQL tables are functional
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  tablesReady: boolean;
  usersTableReady: boolean;
  codesTableReady: boolean;
  storageReady: boolean;
  error?: string;
}> {
  let connected = false;
  let usersTableReady = false;
  let codesTableReady = false;
  let storageReady = false;
  let errorMsg: string | undefined = undefined;

  // 1. Test Supabase Cloud Storage
  try {
    const { error: storageErr } = await supabaseAdmin.storage
      .from("toctie-store")
      .list("", { limit: 1 });
    if (!storageErr) {
      connected = true;
      storageReady = true;
    }
  } catch {
    // storage not ready or network issue
  }

  // 2. Test users table
  try {
    const { error: usersErr } = await supabaseAdmin
      .from("users")
      .select("id")
      .limit(1);
    if (!usersErr) {
      connected = true;
      usersTableReady = true;
    } else if (usersErr.code !== "PGRST205") {
      connected = true;
      errorMsg = usersErr.message;
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  // 3. Test redemption_codes table
  try {
    const { error: codesErr } = await supabaseAdmin
      .from("redemption_codes")
      .select("code")
      .limit(1);
    if (!codesErr) {
      connected = true;
      codesTableReady = true;
    } else if (codesErr.code !== "PGRST205") {
      connected = true;
      if (!errorMsg) errorMsg = codesErr.message;
    }
  } catch (err) {
    if (!errorMsg) errorMsg = err instanceof Error ? err.message : String(err);
  }

  const tablesReady = usersTableReady && codesTableReady;
  isSupabaseAvailable = connected;

  return {
    connected,
    tablesReady,
    usersTableReady,
    codesTableReady,
    storageReady,
    error: errorMsg,
  };
}


/**
 * Find a user by full name (case-insensitive)
 */
export async function findUserByName(fullName: string): Promise<User | null> {
  const normalized = fullName.trim();
  const lowerName = normalized.toLowerCase();

  // 1. In-memory check (fastest)
  const store = getStore();
  let userId = store.usersByName.get(lowerName);
  if (userId) {
    const u = store.users.get(userId);
    if (u) return u;
  }

  // 2. Direct atomic Cloud Storage lookup by Name
  try {
    const cloudUser = await pullUserFromCloud(lowerName);
    if (cloudUser) return cloudUser;
  } catch {}

  // 3. Supabase PostgreSQL check
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
        phone: data.phone || undefined,
        note: data.note || undefined,
        passwordHash: data.password_hash,
        createdAt: data.created_at,
        unlockedPieces: data.unlocked_pieces || [],
        redeemedCodes: data.redeemed_codes || [],
      };
      mergeUserIntoMap(u, store.users, store.usersByName);
      persistStore();
      return u;
    }
  } catch {
    // Supabase unavailable, fall through
  }

  // 4. Permanent disk file check (restores user even after server restart or dev rebuild)
  const diskUsers = readUsersFromFile(REGISTERED_CUSTOMERS_FILE);
  for (const u of diskUsers) {
    mergeUserIntoMap(u, store.users, store.usersByName);
  }
  userId = store.usersByName.get(lowerName);
  if (userId) {
    const u = store.users.get(userId);
    if (u) return u;
  }

  // 5. Pull latest snapshot from Supabase Cloud Storage
  await pullCloudStore().catch(() => { });
  userId = store.usersByName.get(lowerName);
  if (userId) {
    const u = store.users.get(userId);
    if (u) return u;
  }

  return null;
}

/**
 * Find a user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  const trimmedId = id.trim();
  const store = getStore();

  // 1. In-memory check
  let user = store.users.get(trimmedId);
  if (user) return user;

  // 2. Direct atomic Cloud Storage lookup by ID
  try {
    const cloudUser = await pullUserFromCloud(trimmedId);
    if (cloudUser) return cloudUser;
  } catch {}

  // 3. Supabase PostgreSQL check
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", trimmedId)
      .maybeSingle();

    if (!error && data) {
      const u: User = {
        id: data.id,
        fullName: data.full_name,
        phone: data.phone || undefined,
        note: data.note || undefined,
        passwordHash: data.password_hash,
        createdAt: data.created_at,
        unlockedPieces: data.unlocked_pieces || [],
        redeemedCodes: data.redeemed_codes || [],
      };
      mergeUserIntoMap(u, store.users, store.usersByName);
      persistStore();
      return u;
    }
  } catch {
    // Fall through
  }

  // 4. Permanent disk file check
  const diskUsers = readUsersFromFile(REGISTERED_CUSTOMERS_FILE);
  for (const u of diskUsers) {
    mergeUserIntoMap(u, store.users, store.usersByName);
  }
  user = store.users.get(trimmedId);
  if (user) return user;

  // 5. Try pulling from cloud storage
  await pullCloudStore().catch(() => { });
  user = store.users.get(trimmedId);
  return user || null;
}

/**
 * Create a new user (guaranteed to be saved permanently and appear in backend immediately)
 */
export async function createUser(
  fullName: string,
  rawPassword?: string,
  phone?: string,
  note?: string,
  initialPieces?: number[]
): Promise<User> {
  const name = fullName.trim();
  if (!name || name.length < 2) {
    throw new Error("Tên tài khoản phải có ít nhất 2 ký tự.");
  }

  // Check if user already exists in any storage tier
  const existing = await findUserByName(name);
  if (existing) {
    return existing;
  }

  // Ensure password is securely hashed via scrypt
  const secureHash = rawPassword && rawPassword.startsWith("scrypt:v1:")
    ? rawPassword
    : hashPassword(rawPassword || "passwordless");

  const id = generateId();
  const createdAt = new Date().toISOString();
  const cleanPhone = phone?.trim() || undefined;
  const cleanNote = note?.trim() || undefined;
  const pieces = Array.isArray(initialPieces) ? initialPieces : [];

  const newUser: User = {
    id,
    fullName: name,
    phone: cleanPhone,
    note: cleanNote,
    passwordHash: secureHash,
    createdAt,
    unlockedPieces: pieces,
    redeemedCodes: [],
  };

  // 1. Sync to Supabase PostgreSQL table if table exists
  try {
    await supabaseAdmin.from("users").insert({
      id,
      full_name: name,
      phone: cleanPhone || null,
      note: cleanNote || null,
      password_hash: secureHash,
      unlocked_pieces: pieces,
      redeemed_codes: [],
      is_complete: pieces.length === 4,
      created_at: createdAt,
      updated_at: createdAt,
    });
  } catch (err) {
    console.warn("Ngoại lệ khi insert Supabase users:", err);
  }

  // 2. Save to local persistent store & permanent customer registry immediately
  const store = getStore();
  mergeUserIntoMap(newUser, store.users, store.usersByName);

  // 3. Atomically push individual user file to Supabase Cloud Storage (indestructible)
  await pushUserToCloud(newUser);

  // 4. Guarantee persistence to Supabase Cloud Storage across all serverless containers
  await persistStoreAsync();

  return newUser;
}

/**
 * Update user information (fullName, phone, note, unlockedPieces, redeemedCodes)
 */
export async function updateUser(
  userId: string,
  updates: {
    fullName?: string;
    phone?: string;
    note?: string;
    unlockedPieces?: number[];
    redeemedCodes?: string[];
  }
): Promise<{ success: boolean; user?: User; error?: string }> {
  const store = getStore();
  const current = store.users.get(userId);
  if (!current) {
    return { success: false, error: "Không tìm thấy tài khoản người dùng." };
  }

  if (updates.fullName !== undefined) {
    const trimmed = updates.fullName.trim();
    if (!trimmed || trimmed.length < 2) {
      return { success: false, error: "Tên tài khoản phải có ít nhất 2 ký tự." };
    }
    const existing = await findUserByName(trimmed);
    if (existing && existing.id !== userId) {
      return { success: false, error: `Tên tài khoản "${trimmed}" đã có người sử dụng.` };
    }
    store.usersByName.delete(current.fullName.toLowerCase());
    current.fullName = trimmed;
    store.usersByName.set(trimmed.toLowerCase(), userId);
  }

  if (updates.phone !== undefined) {
    current.phone = updates.phone.trim() || undefined;
  }

  if (updates.note !== undefined) {
    current.note = updates.note.trim() || undefined;
  }

  if (updates.unlockedPieces !== undefined) {
    current.unlockedPieces = updates.unlockedPieces;
  }

  if (updates.redeemedCodes !== undefined) {
    current.redeemedCodes = updates.redeemedCodes;
  }

  await pushUserToCloud(current);
  await persistStoreAsync();

  try {
    await supabaseAdmin
      .from("users")
      .update({
        full_name: current.fullName,
        phone: current.phone || null,
        note: current.note || null,
        unlocked_pieces: current.unlockedPieces,
        redeemed_codes: current.redeemedCodes,
        is_complete: current.unlockedPieces.length === 4,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  } catch (err) {
    console.warn("Lỗi sync Supabase updateUser:", err);
  }

  return { success: true, user: current };
}

/**
 * Delete a user account (Admin)
 */
export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const store = getStore();
  const user = store.users.get(userId);
  if (!user) {
    return { success: false, error: "Không tìm thấy người dùng." };
  }

  const nameHex = Buffer.from(user.fullName.toLowerCase(), "utf-8").toString("hex");

  store.users.delete(userId);
  store.usersByName.delete(user.fullName.toLowerCase());
  await persistStoreAsync(true);

  try {
    await supabaseAdmin.storage
      .from("toctie-store")
      .remove([`users/${userId}.json`, `names/${nameHex}.json`]);
  } catch {}

  try {
    await supabaseAdmin.from("users").delete().eq("id", userId);
  } catch (err) {
    console.warn("Lỗi sync Supabase deleteUser:", err);
  }

  return { success: true };
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
      .ilike("code", normalized)
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
 * Redeem a code and award a new puzzle piece to user with concurrency safety
 */
export async function redeemCode(
  user: User,
  code: string,
  newPiece: number
): Promise<{ success: boolean; unlockedPieces: number[]; error?: string }> {
  const normalized = code.trim().toUpperCase();
  const now = new Date().toISOString();

  // Guard: if user already has 4 pieces
  if (user.unlockedPieces.length >= 4) {
    return {
      success: false,
      error: "Bạn đã mở đủ 4 mảnh ghép rồi! Hãy nhận phần thưởng của bạn.",
      unlockedPieces: user.unlockedPieces,
    };
  }

  // Guard: if user already redeemed this code
  if (user.redeemedCodes.includes(normalized)) {
    return {
      success: false,
      error: "Bạn đã sử dụng mã này rồi.",
      unlockedPieces: user.unlockedPieces,
    };
  }

  // Guard: if piece is already unlocked
  if (user.unlockedPieces.includes(newPiece)) {
    return {
      success: false,
      error: "Mảnh ghép này đã được mở rồi.",
      unlockedPieces: user.unlockedPieces,
    };
  }

  const store = getStore();
  const memoryCode = store.codes.get(normalized);
  if (memoryCode && memoryCode.isUsed) {
    return {
      success: false,
      error: "Mã này đã được sử dụng rồi.",
      unlockedPieces: user.unlockedPieces,
    };
  }

  // Concurrency-safe atomic check in Supabase PostgreSQL (if table exists)
  try {
    const { data: updatedCodeRows, error: codeErr } = await supabaseAdmin
      .from("redemption_codes")
      .update({
        is_used: true,
        used_by: user.fullName,
        used_at: now,
      })
      .ilike("code", normalized)
      .eq("is_used", false)
      .select();

    if (!codeErr && Array.isArray(updatedCodeRows) && updatedCodeRows.length === 0) {
      // PostgreSQL table exists and update affected 0 rows -> code was already used concurrently
      return {
        success: false,
        error: "Mã này vừa được sử dụng bởi một tài khoản khác.",
        unlockedPieces: user.unlockedPieces,
      };
    }
  } catch {
    // Handled by memory/cloud storage
  }

  const updatedPieces = [...user.unlockedPieces, newPiece];
  const updatedCodes = [...user.redeemedCodes, normalized];
  const isComplete = updatedPieces.length === 4;

  // 1. Update in local persistent store
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

  // Atomically persist individual user file & redeemed code file to Cloud Storage immediately
  if (memoryUser) {
    await pushUserToCloud(memoryUser);
  }
  if (memoryCode) {
    await pushCodeToCloud(memoryCode);
  }

  // Await store persistence to cloud and disk
  await persistStoreAsync();

  // 2. Sync user state to Supabase PostgreSQL table
  try {
    await supabaseAdmin
      .from("users")
      .update({
        unlocked_pieces: updatedPieces,
        redeemed_codes: updatedCodes,
        is_complete: isComplete,
        updated_at: now,
      })
      .eq("id", user.id);
  } catch {
    // Handled by disk & cloud storage persistence
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

  // Always pull latest cloud store so accounts created across all serverless containers appear immediately
  await pullCloudStore().catch(() => { });

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
          phone: u.phone || undefined,
          note: u.note || undefined,
          passwordHash: u.password_hash,
          createdAt: u.created_at,
          unlockedPieces: pieces,
          redeemedCodes: u.redeemed_codes || [],
        };
        mergeUserIntoMap(userObj, store.users, store.usersByName);
      });

      codesRes.data.forEach((c) => {
        const upper = c.code.toUpperCase();
        if (c.is_used || store.codes.has(upper)) {
          store.codes.set(upper, {
            code: upper,
            isUsed: c.is_used,
            usedBy: c.used_by,
            usedAt: c.used_at,
          });
        }
      });

      persistStore();
    }
  } catch {
    // Fallback to local store
  }

  // Remove any legacy unused demo codes not in the 20 requested fixed codes
  const validFixedCodes = new Set(DEFAULT_DEMO_CODES.map((c) => c.toUpperCase()));
  for (const [codeKey, codeObj] of Array.from(store.codes.entries())) {
    if (!codeObj.isUsed && !validFixedCodes.has(codeKey)) {
      store.codes.delete(codeKey);
    }
  }
  persistStore();

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

  for (const [key, val] of Array.from(store.codes.entries())) {
    if (!val.isUsed) {
      store.codes.delete(key);
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

  const newHash = hashPassword(finalPassword);

  const store = getStore();
  const memUser = store.users.get(user.id);
  if (memUser) {
    memUser.passwordHash = newHash;
  }
  await persistStoreAsync();

  try {
    await supabaseAdmin
      .from("users")
      .update({
        password_hash: newHash,
        updated_at: new Date().toISOString(),
      })
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
  return updateUser(userId, { fullName: newAccountName }).then((res) => ({
    success: res.success,
    newName: res.user?.fullName,
    error: res.error,
  }));
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
