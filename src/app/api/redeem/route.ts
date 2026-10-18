import { NextResponse } from "next/server";
import { findUserById, getRedemptionCode, redeemCode } from "@/lib/db";

// POST /api/redeem — redeem a code for a user
export async function POST(req: Request) {
  try {
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json(
        { error: "Thiếu thông tin người dùng hoặc mã." },
        { status: 400 }
      );
    }

    const user = await findUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản. Vui lòng đăng nhập lại." },
        { status: 404 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();
    const redemptionCode = await getRedemptionCode(normalizedCode);

    // Check code exists
    if (!redemptionCode) {
      return NextResponse.json(
        { error: "Mã không hợp lệ. Vui lòng kiểm tra lại." },
        { status: 404 }
      );
    }

    // Check code already used
    if (redemptionCode.isUsed) {
      return NextResponse.json(
        { error: "Mã này đã được sử dụng rồi." },
        { status: 409 }
      );
    }

    // Check user already used this code (extra safety)
    if (user.redeemedCodes.includes(normalizedCode)) {
      return NextResponse.json(
        { error: "Bạn đã sử dụng mã này rồi." },
        { status: 409 }
      );
    }

    // Check user already has 4 pieces
    if (user.unlockedPieces.length >= 4) {
      return NextResponse.json(
        { error: "Bạn đã mở đủ 4 mảnh ghép rồi! Hãy nhận phần thưởng của bạn." },
        { status: 400 }
      );
    }

    // Determine which pieces are still locked
    const allPieces = [0, 1, 2, 3];
    const lockedPieces = allPieces.filter(
      (p) => !user.unlockedPieces.includes(p)
    );

    // Pick a random locked piece
    const randomIndex = Math.floor(Math.random() * lockedPieces.length);
    const newPiece = lockedPieces[randomIndex];

    // Persist redemption to Supabase PostgreSQL & Cloud Store
    const redeemRes = await redeemCode(user, normalizedCode, newPiece);

    if (!redeemRes.success) {
      return NextResponse.json(
        { error: redeemRes.error || "Không thể sử dụng mã này. Vui lòng thử lại." },
        { status: 400 }
      );
    }

    const isComplete = redeemRes.unlockedPieces.length === 4;

    return NextResponse.json({
      success: true,
      newPiece,
      unlockedPieces: redeemRes.unlockedPieces,
      isComplete,
      message: isComplete
        ? "Chúc mừng! Bạn đã hoàn thành bộ sưu tập 4 mảnh ghép!"
        : `Mảnh ghép thứ ${redeemRes.unlockedPieces.length} đã được mở thành công.`,
    });
  } catch {
    return NextResponse.json({ error: "Lỗi server. Vui lòng thử lại." }, { status: 500 });
  }
}

// GET /api/redeem?userId=... — get user puzzle state
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId || !userId.trim()) {
      return NextResponse.json({ error: "Thiếu userId." }, { status: 400 });
    }

    const user = await findUserById(userId.trim());

    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản.", notFound: true }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        unlockedPieces: user.unlockedPieces,
        redeemedCodes: user.redeemedCodes,
        isComplete: user.unlockedPieces.length === 4,
      },
    });
  } catch {
    return NextResponse.json({ error: "Lỗi server." }, { status: 500 });
  }
}

