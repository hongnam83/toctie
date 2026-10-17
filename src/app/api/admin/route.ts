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
    totalCodes: codes.length,
    usedCodes: codes.filter((c) => c.isUsed).length,
    unusedCodes: codes.filter((c) => !c.isUsed).length,
    db: {
      type: "Supabase PostgreSQL",
      connected: dbStatus.connected,
      tablesReady: dbStatus.tablesReady,
      notice: dbStatus.tablesReady
        ? "Đang kết nối trực tiếp với cơ sở dữ liệu Supabase."
        : "Supabase đã kết nối. Cần chạy schema.sql trong SQL Editor của Supabase để khởi tạo bảng.",
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
