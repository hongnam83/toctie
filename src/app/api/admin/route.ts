// Admin API — GET stats, users, codes & POST/DELETE actions
// Secret: query param ?secret=toctie1234 or header Authorization

import { NextRequest, NextResponse } from "next/server";
import {
  getAdminData,
  addBatchCodes,
  testSupabaseConnection,
  resetUserPassword,
  renameUserAccount,
  deleteRedemptionCode,
  deleteBatchRedemptionCodes,
  deleteUnusedRedemptionCodes,
  updateRedemptionCode,
  createUser,
  updateUser,
  deleteUser,
  findUserByName,
} from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "toctie1234";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ users, codes }, dbStatus] = await Promise.all([
    getAdminData(),
    testSupabaseConnection(),
  ]);

  const stats = {
    totalUsers: users.length,
    completedUsers: users.filter((u) => u.isComplete).length,
    usersWithPhone: users.filter((u) => u.phone && u.phone.trim().length > 0).length,
    totalCodes: codes.length,
    usedCodes: codes.filter((c) => c.isUsed).length,
    unusedCodes: codes.filter((c) => !c.isUsed).length,
    db: {
      type: "Supabase Cloud Database",
      connected: dbStatus.connected,
      tablesReady: dbStatus.tablesReady,
      notice: dbStatus.tablesReady
        ? "Đang kết nối trực tiếp với cơ sở dữ liệu Supabase PostgreSQL."
        : "Đang kết nối lưu trữ đám mây Supabase Cloud Storage (tự động đồng bộ thời gian thực và bảo vệ dữ liệu tài khoản).",
    },
  };

  return NextResponse.json({ stats, users, codes });
}

// POST — admin actions
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // ACTION: Create / Save Customer (Thêm & Lưu thông tin khách hàng mới)
    if (body.action === "create-user" || body.action === "save-customer") {
      const rawName = (body.fullName || body.accountName || "").trim();
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";
      const note = typeof body.note === "string" ? body.note.trim() : "";
      const pieceCount = typeof body.initialPieceCount === "number" ? body.initialPieceCount : 0;

      if (!rawName || rawName.length < 2) {
        return NextResponse.json(
          { error: "Tên tài khoản khách hàng phải có ít nhất 2 ký tự." },
          { status: 400 }
        );
      }

      const initialPieces = pieceCount > 0 ? Array.from({ length: Math.min(pieceCount, 4) }, (_, i) => i) : [];

      const existing = await findUserByName(rawName);
      if (existing) {
        // Cập nhật thông tin nếu tài khoản đã tồn tại
        const updated = await updateUser(existing.id, {
          phone: phone || existing.phone,
          note: note || existing.note,
          unlockedPieces: pieceCount > 0 ? initialPieces : existing.unlockedPieces,
        });

        return NextResponse.json({
          success: true,
          message: `Khách hàng "${rawName}" đã có trong hệ thống, đã cập nhật thông tin bổ sung.`,
          user: updated.user,
          isExisting: true,
        });
      }

      const user = await createUser(rawName, "passwordless", phone, note, initialPieces);
      return NextResponse.json({
        success: true,
        message: `Đã lưu thông tin khách hàng "${user.fullName}" thành công vào hệ thống.`,
        user,
      });
    }

    // ACTION: Update Customer Info (Chỉnh sửa thông tin khách hàng)
    if (body.action === "update-user" || body.action === "edit-customer") {
      const { userId, fullName, phone, note, pieceCount, unlockedPieces } = body;
      if (!userId) {
        return NextResponse.json({ error: "Thiếu userId khách hàng." }, { status: 400 });
      }

      let piecesToSet: number[] | undefined = undefined;
      if (Array.isArray(unlockedPieces)) {
        piecesToSet = unlockedPieces;
      } else if (typeof pieceCount === "number") {
        piecesToSet = Array.from({ length: Math.min(Math.max(pieceCount, 0), 4) }, (_, i) => i);
      }

      const result = await updateUser(userId, {
        fullName,
        phone,
        note,
        unlockedPieces: piecesToSet,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật thông tin khách hàng "${result.user?.fullName}" thành công.`,
        user: result.user,
      });
    }

    // ACTION: Delete Customer Account (Xóa tài khoản khách hàng)
    if (body.action === "delete-user") {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ error: "Thiếu userId." }, { status: 400 });
      }
      const result = await deleteUser(userId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Đã xóa tài khoản khách hàng thành công.",
      });
    }

    // ACTION: Update / Edit single code
    if (body.action === "update-code" || body.action === "edit-code") {
      const { code, newCode, isUsed, usedBy } = body;
      if (!code) {
        return NextResponse.json({ error: "Thiếu thông tin mã code cần sửa." }, { status: 400 });
      }
      const result = await updateRedemptionCode(code, { newCode, isUsed, usedBy });
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: `Đã cập nhật mã "${result.code?.code}" thành công.`,
        code: result.code,
      });
    }

    // ACTION: Delete single code
    if (body.action === "delete-code") {
      const code = body.code;
      if (!code) {
        return NextResponse.json({ error: "Thiếu mã code cần xóa." }, { status: 400 });
      }
      const result = await deleteRedemptionCode(code);
      return NextResponse.json({
        success: true,
        message: `Đã xóa mã "${result.code}" thành công.`,
        code: result.code,
      });
    }

    // ACTION: Delete batch codes
    if (body.action === "delete-batch-codes") {
      const codes = body.codes;
      if (!Array.isArray(codes) || codes.length === 0) {
        return NextResponse.json({ error: "Danh sách mã cần xóa không hợp lệ." }, { status: 400 });
      }
      const result = await deleteBatchRedemptionCodes(codes);
      return NextResponse.json({
        success: true,
        message: `Đã xóa thành công ${result.deletedCount} mã dự thưởng.`,
        deletedCount: result.deletedCount,
      });
    }

    // ACTION: Delete all unused codes
    if (body.action === "delete-unused-codes") {
      const result = await deleteUnusedRedemptionCodes();
      return NextResponse.json({
        success: true,
        message: `Đã dọn dẹp và xóa ${result.deletedCount} mã chưa sử dụng.`,
        deletedCount: result.deletedCount,
      });
    }

    // ACTION: Rename user account
    if (body.action === "rename-account") {
      const { userId, newAccountName } = body;
      if (!userId || !newAccountName) {
        return NextResponse.json(
          { error: "Vui lòng cung cấp userId và newAccountName." },
          { status: 400 }
        );
      }
      const result = await renameUserAccount(userId, newAccountName);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: `Đổi tên tài khoản thành "${result.newName}" thành công.`,
        newName: result.newName,
      });
    }

    // ACTION: Reset user password
    if (body.action === "reset-password") {
      const identifier = body.userId || body.identifier || body.fullName;
      if (!identifier) {
        return NextResponse.json(
          { error: "Vui lòng cung cấp ID hoặc Tên người dùng cần đặt lại mật khẩu." },
          { status: 400 }
        );
      }

      const result = await resetUserPassword(identifier, body.newPassword);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Đã đặt lại mật khẩu thành công cho "${result.user?.fullName}".`,
        user: result.user,
        newPassword: result.newPassword,
      });
    }

    // ACTION: Add new redemption codes
    const codes = body.codes;
    if (Array.isArray(codes) && codes.length > 0) {
      const { added, skipped } = await addBatchCodes(codes);
      return NextResponse.json({
        message: `Đã thêm ${added.length} mã, bỏ qua ${skipped.length} mã trùng.`,
        added,
        skipped,
      });
    }

    return NextResponse.json(
      { error: "Hành động admin không hợp lệ." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Lỗi xử lý yêu cầu admin." },
      { status: 500 }
    );
  }
}

// DELETE — delete code via REST
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const code = searchParams.get("code");

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!code) {
    return NextResponse.json({ error: "Thiếu tham số code." }, { status: 400 });
  }

  const result = await deleteRedemptionCode(code);
  return NextResponse.json({
    success: true,
    message: `Đã xóa mã "${result.code}" thành công.`,
  });
}
