import { NextResponse } from "next/server";
import { findUserByName, createUser, simpleHash } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { fullName, password, action } = await req.json();

    if (!fullName || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ họ tên và mật khẩu." },
        { status: 400 }
      );
    }

    const name = fullName.trim();
    const passwordHash = simpleHash(password);

    if (action === "register") {
      // Check if user already exists
      const existing = await findUserByName(name);
      if (existing) {
        return NextResponse.json(
          { error: "Tên này đã được đăng ký. Vui lòng đăng nhập." },
          { status: 409 }
        );
      }

      const user = await createUser(name, passwordHash);

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          unlockedPieces: user.unlockedPieces,
          redeemedCodes: user.redeemedCodes,
        },
      });
    }

    if (action === "login") {
      const user = await findUserByName(name);
      if (!user) {
        return NextResponse.json(
          { error: "Không tìm thấy tài khoản. Vui lòng kiểm tra lại tên." },
          { status: 404 }
        );
      }

      if (user.passwordHash !== passwordHash) {
        return NextResponse.json(
          { error: "Mật khẩu không đúng. Vui lòng thử lại." },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          unlockedPieces: user.unlockedPieces,
          redeemedCodes: user.redeemedCodes,
        },
      });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Lỗi server. Vui lòng thử lại." }, { status: 500 });
  }
}
