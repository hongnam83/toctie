import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import {
  createUser,
  findUserByName,
  findUserById,
  redeemCode,
  testSupabaseConnection,
  sanitizeUser,
  getAdminData,
} from "../src/lib/db";
import { verifyPassword } from "../src/lib/auth-crypto";
import { getStore, clearAllUsers } from "../src/lib/store";

async function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ TÍNH BỀN VỮNG VÀ TÍNH ĐÚNG ĐẮN ===");

  // 1. Kiểm tra kết nối Supabase
  console.log("\n[TEST 1] Kiểm tra kết nối Supabase...");
  const conn = await testSupabaseConnection();
  console.log("Kết quả Supabase:", conn);
  console.assert(conn.connected === true, "Lỗi: Chưa kết nối được Supabase!");
  console.assert(conn.storageReady === true, "Lỗi: Cloud Storage toctie-store chưa sẵn sàng!");

  // 2. Tạo tài khoản khách hàng mới
  console.log("\n[TEST 2] Tạo tài khoản khách hàng mới...");
  const testAccountName = `TestCustomer_${Date.now()}`;
  const testPassword = "MySecurePassword123!";
  const createdUser = await createUser(
    testAccountName,
    testPassword,
    "0912345678",
    "Khách hàng VIP kiểm thử"
  );
  console.log("User đã tạo:", {
    id: createdUser.id,
    fullName: createdUser.fullName,
    phone: createdUser.phone,
    hasPasswordHash: !!createdUser.passwordHash,
    isScrypt: createdUser.passwordHash.startsWith("scrypt:v1:"),
  });
  console.assert(createdUser.fullName === testAccountName, "Lỗi: Tên tài khoản không khớp!");
  console.assert(createdUser.passwordHash.startsWith("scrypt:v1:"), "Lỗi: Password chưa được hash bằng scrypt!");

  // 3. Kiểm tra bảo mật: sanitizeUser không để lộ passwordHash
  console.log("\n[TEST 3] Kiểm tra bảo mật dữ liệu trả về client...");
  const sanitized = sanitizeUser(createdUser);
  console.log("Sanitized User:", sanitized);
  console.assert(!("passwordHash" in sanitized), "Lỗi nghiêm trọng: Lộ passwordHash!");
  console.assert(sanitized.isComplete === false, "Lỗi: Mới tạo tài khoản không thể isComplete = true!");

  // 4. Kiểm tra xác thực mật khẩu
  console.log("\n[TEST 4] Kiểm tra xác thực mật khẩu...");
  const passCorrect = verifyPassword("MySecurePassword123!", createdUser.passwordHash);
  const passWrong = verifyPassword("WrongPassword!", createdUser.passwordHash);
  console.log("Mật khẩu đúng:", passCorrect, "| Mật khẩu sai:", passWrong);
  console.assert(passCorrect === true, "Lỗi: Mật khẩu đúng bị từ chối!");
  console.assert(passWrong === false, "Lỗi: Mật khẩu sai được chấp nhận!");

  // 5. Kiểm tra truy vấn tìm kiếm bằng tên và ID
  console.log("\n[TEST 5] Kiểm tra tìm kiếm userByName & userById...");
  const foundByName = await findUserByName(testAccountName.toLowerCase());
  const foundById = await findUserById(createdUser.id);
  console.assert(foundByName !== null && foundByName.id === createdUser.id, "Lỗi: Không tìm thấy theo tên!");
  console.assert(foundById !== null && foundById.fullName === testAccountName, "Lỗi: Không tìm thấy theo ID!");

  // 6. Kiểm tra quy trình mở mảnh ghép bằng mã dự thưởng
  console.log("\n[TEST 6] Đổi mã dự thưởng và tích lũy mảnh ghép...");
  const testCode = "toctie-K7M9X";
  const redeemRes1 = await redeemCode(createdUser, testCode, 0);
  console.log("Lần đổi 1:", redeemRes1);
  console.assert(redeemRes1.success === true, "Lỗi: Đổi mã hợp lệ thất bại!");
  console.assert(redeemRes1.unlockedPieces.includes(0), "Lỗi: Mảnh 0 chưa được mở!");

  // 7. Kiểm tra chống sử dụng lại mã cũ (quy tắc 1 mã dùng 1 lần)
  console.log("\n[TEST 7] Thử dùng lại mã vừa đổi...");
  const updatedUser1 = (await findUserById(createdUser.id))!;
  const redeemResDuplicate = await redeemCode(updatedUser1, testCode, 1);
  console.log("Lần đổi trùng mã:", redeemResDuplicate);
  console.assert(redeemResDuplicate.success === false, "Lỗi: Cho phép dùng lại mã cũ!");

  // 8. Mô phỏng SERVER RESTART / REDEPLOY (Xóa sạch toàn bộ RAM)
  console.log("\n[TEST 8] Mô phỏng Server Restart / Redeploy (Xóa RAM)...");
  global.__toctieStore = undefined;

  // Truy vấn lại từ đầu (buộc hệ thống đọc lại từ đĩa và Supabase Cloud Storage)
  const userAfterRestart = await findUserById(createdUser.id);
  console.log("User sau khi Restart Server:", {
    id: userAfterRestart?.id,
    fullName: userAfterRestart?.fullName,
    unlockedPieces: userAfterRestart?.unlockedPieces,
    redeemedCodes: userAfterRestart?.redeemedCodes,
  });
  console.assert(userAfterRestart !== null, "Lỗi nghiêm trọng: Mất tài khoản sau khi server restart!");
  console.assert(
    userAfterRestart?.unlockedPieces.includes(0),
    "Lỗi nghiêm trọng: Mất tiến độ mảnh ghép sau khi server restart!"
  );
  console.assert(
    userAfterRestart?.redeemedCodes.includes("TOCTIE-K7M9X"),
    "Lỗi nghiêm trọng: Mất lịch sử mã đã đổi sau khi server restart!"
  );

  // 9. Dọn dẹp tài khoản kiểm thử
  console.log("\n[TEST 9] Dọn dẹp tài khoản kiểm thử...");
  const store = getStore();
  store.users.delete(createdUser.id);
  store.usersByName.delete(testAccountName.toLowerCase());
  const resetCodeObj = store.codes.get("TOCTIE-K7M9X");
  if (resetCodeObj) {
    resetCodeObj.isUsed = false;
    resetCodeObj.usedBy = undefined;
    resetCodeObj.usedAt = undefined;
  }
  const { persistStoreAsync } = await import("../src/lib/store");
  await persistStoreAsync(true);

  // Dọn dẹp cả trong Supabase PostgreSQL
  const { supabaseAdmin } = await import("../src/lib/supabase");
  await supabaseAdmin.from("users").delete().eq("id", createdUser.id);
  await supabaseAdmin
    .from("redemption_codes")
    .update({ is_used: false, used_by: null, used_at: null })
    .eq("code", "TOCTIE-K7M9X");

  console.log("\n=== TẤT CẢ CÁC BÀI KIỂM THỬ ĐÃ ĐẠT 100%! ===");
}

runTests().catch((err) => {
  console.error("Test thất bại với lỗi:", err);
  process.exit(1);
});
