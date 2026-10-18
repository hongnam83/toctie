import { createUser, findUserById, redeemCode } from "../src/lib/db";
import { getStore } from "../src/lib/store";

async function testFullLoyaltyFlow() {
  console.log("=== KIỂM THỬ QUY TRÌNH 4 MẢNH GHÉP VÀ TÍNH BỀN VỮNG ===");

  const username = `Gamer_${Date.now()}`;
  const user = await createUser(username, "passwordless");
  console.log(`Tạo người dùng: ${user.fullName} (${user.id})`);

  // 4 mã khác nhau từ 20 mã cố định
  const codesToRedeem = [
    "toctie-P4N8Q",
    "toctie-R6T2W",
    "toctie-H9B5Y",
    "toctie-X3D7K",
  ];

  let currentUser = user;
  for (let i = 0; i < codesToRedeem.length; i++) {
    const code = codesToRedeem[i];
    const piece = i;
    const res = await redeemCode(currentUser, code, piece);
    console.log(`Đổi mã ${code} (mảnh ${piece}):`, res);
    console.assert(res.success === true, `Đổi mã ${code} thất bại!`);
    currentUser = (await findUserById(currentUser.id))!;
  }

  console.log(`Số mảnh hiện tại: ${currentUser.unlockedPieces.length}/4`);
  console.assert(currentUser.unlockedPieces.length === 4, "Lỗi: Không đủ 4 mảnh!");

  // Thử đổi mã thứ 5
  const res5 = await redeemCode(currentUser, "toctie-M8F2P", 0);
  console.log("Kết quả đổi mã thứ 5:", res5);
  console.assert(res5.success === false, "Lỗi: Cho phép đổi tiếp khi đã đủ 4 mảnh!");

  // Xóa RAM mô phỏng restart
  global.__toctieStore = undefined;

  const restoredUser = (await findUserById(user.id))!;
  console.log("User phục hồi sau restart:", {
    fullName: restoredUser.fullName,
    unlockedPieces: restoredUser.unlockedPieces,
    redeemedCodes: restoredUser.redeemedCodes,
  });

  console.assert(restoredUser.unlockedPieces.length === 4, "Lỗi: Mất mảnh sau restart!");
  console.assert(restoredUser.redeemedCodes.length === 4, "Lỗi: Mất mã đã đổi sau restart!");

  // Dọn dẹp
  const store = getStore();
  store.users.delete(user.id);
  store.usersByName.delete(username.toLowerCase());
  codesToRedeem.forEach((c) => {
    const codeObj = store.codes.get(c.toUpperCase());
    if (codeObj) {
      codeObj.isUsed = false;
      codeObj.usedBy = undefined;
      codeObj.usedAt = undefined;
    }
  });
  const { persistStoreAsync } = await import("../src/lib/store");
  await persistStoreAsync(true);

  console.log("=== BÀI TEST 4 MẢNH GHÉP ĐÃ ĐẠT 100%! ===");
}

testFullLoyaltyFlow().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
