// Admin API — GET stats, users, codes & POST actions (add-codes, reset-password, rename-account)
// Secret: query param ?secret=toctie1234 or header Authorization

import { NextRequest, NextResponse } from "next/server";
import {
  getAdminData,
  addBatchCodes,
  testSupabaseConnection,
  resetUserPassword,
  renameUserAccount,
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

    // ACTION: Reset user password (for legacy or admin password set)
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
