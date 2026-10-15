// Admin API — GET stats, users, codes
// Secret: query param ?secret=toctie1234

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "toctie1234";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = getStore();

  // Build user list
  const users = Array.from(store.users.values()).map((u) => ({
    id: u.id,
    fullName: u.fullName,
    createdAt: u.createdAt,
    unlockedPieces: u.unlockedPieces,
    pieceCount: u.unlockedPieces.length,
    isComplete: u.unlockedPieces.length === 4,
    redeemedCodes: u.redeemedCodes,
  }));

  // Build code stats
  const codes = Array.from(store.codes.values()).map((c) => ({
    code: c.code,
    isUsed: c.isUsed,
    usedBy: c.usedBy,
    usedAt: c.usedAt,
  }));

  const stats = {
    totalUsers: store.users.size,
    completedUsers: users.filter((u) => u.isComplete).length,
    totalCodes: store.codes.size,
    usedCodes: codes.filter((c) => c.isUsed).length,
    unusedCodes: codes.filter((c) => !c.isUsed).length,
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

  const store = getStore();
  const added: string[] = [];
  const skipped: string[] = [];

  for (const rawCode of codes) {
    const code = rawCode.trim().toUpperCase();
    if (!code) continue;
    if (store.codes.has(code)) {
      skipped.push(code);
    } else {
      store.codes.set(code, { code, isUsed: false });
      added.push(code);
    }
  }

  return NextResponse.json({
    message: `Đã thêm ${added.length} mã, bỏ qua ${skipped.length} mã trùng.`,
    added,
    skipped,
  });
}
