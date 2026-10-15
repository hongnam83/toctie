// Backend-only Password Reset API
// POST /api/admin/reset-password?secret=toctie1234
// Body: { userId?: string, fullName?: string, newPassword?: string }

import { NextRequest, NextResponse } from "next/server";
import { resetUserPassword } from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "toctie1234";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
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
      message: `Đã đặt lại mật khẩu thành công cho khách hàng "${result.user?.fullName}".`,
      user: result.user,
      newPassword: result.newPassword,
    });
  } catch {
    return NextResponse.json(
      { error: "Lỗi hệ thống khi khôi phục mật khẩu." },
      { status: 500 }
    );
  }
}
