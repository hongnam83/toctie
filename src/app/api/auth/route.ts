import { NextResponse } from "next/server";
import { getStore, simpleHash, generateId } from "@/lib/store";

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
    const store = getStore();
    const passwordHash = simpleHash(password);

    if (action === "register") {
      // Check if name already exists
      if (store.usersByName.has(name.toLowerCase())) {
        return NextResponse.json(
          { error: "Tên này đã được đăng ký. Vui lòng đăng nhập." },
          { status: 409 }
        );
      }

      const id = generateId();
      const user = {
        id,
        fullName: name,
        passwordHash,
        createdAt: new Date().toISOString(),
        unlockedPieces: [] as number[],
        redeemedCodes: [] as string[],
      };
      store.users.set(id, user);
      store.usersByName.set(name.toLowerCase(), id);

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
      const userId = store.usersByName.get(name.toLowerCase());
      if (!userId) {
        return NextResponse.json(
          { error: "Không tìm thấy tài khoản. Vui lòng kiểm tra lại tên." },
          { status: 404 }
        );
      }

      const user = store.users.get(userId);
      if (!user || user.passwordHash !== passwordHash) {
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
