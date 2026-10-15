// Admin API — GET stats, users, codes
// Secret: query param ?secret=toctie1234

import { NextRequest, NextResponse } from "next/server";
import { getAdminData, addBatchCodes, testSupabaseConnection } from "@/lib/db";

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

// POST — add new codes
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { codes } = body as { codes: string[] };

  if (!Array.isArray(codes) || codes.length === 0) {
    return NextResponse.json({ error: "codes phải là một mảng không rỗng" }, { status: 400 });
  }

  const { added, skipped } = await addBatchCodes(codes);

  return NextResponse.json({
    message: `Đã thêm ${added.length} mã, bỏ qua ${skipped.length} mã trùng.`,
    added,
    skipped,
  });
}
