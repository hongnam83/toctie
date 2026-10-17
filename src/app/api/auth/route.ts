import { NextResponse } from "next/server";
import { findUserByName, createUser } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawName = body.accountName || body.fullName || "";
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const rawNote = typeof body.note === "string" ? body.note.trim() : "";
    const action = body.action || "login";

    if (!rawName || typeof rawName !== "string" || !rawName.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên tài khoản của bạn." },
        { status: 400 }
      );
    }

    const name = rawName.trim();

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Tên tài khoản phải có ít nhất 2 ký tự." },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: "Tên tài khoản không được vượt quá 50 ký tự." },
        { status: 400 }
      );
    }

    // Đăng ký tài khoản mới (khách hàng tự đặt tên tài khoản riêng & lưu thông tin tự động)
    if (action === "register") {
      const existing = await findUserByName(name);
      if (existing) {
        // Tài khoản đã tồn tại, tự động đăng nhập người dùng an toàn
        return NextResponse.json({
          success: true,
          isNew: false,
          alreadyExisted: true,
          user: {
            id: existing.id,
            fullName: existing.fullName,
            phone: existing.phone,
            note: existing.note,
            unlockedPieces: existing.unlockedPieces,
            redeemedCodes: existing.redeemedCodes,
          },
        });
      }

      // Tạo tài khoản mới và lưu trữ bền vững ngay lập tức
      const user = await createUser(name, "passwordless", rawPhone, rawNote);

      return NextResponse.json({
        success: true,
        isNew: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          note: user.note,
          unlockedPieces: user.unlockedPieces,
          redeemedCodes: user.redeemedCodes,
        },
      });
    }

    // Đăng nhập bằng tên tài khoản riêng (không cần mật khẩu)
    if (action === "login") {
      const user = await findUserByName(name);
      if (!user) {
        return NextResponse.json(
          {
            error: `Chưa tìm thấy tài khoản "${name}". Hãy kiểm tra lại hoặc tạo tài khoản mới.`,
            notFound: true,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          note: user.note,
          unlockedPieces: user.unlockedPieces,
          redeemedCodes: user.redeemedCodes,
        },
      });
    }

    // Tự động: Đã có thì đăng nhập, chưa có thì tạo mới
    if (action === "auto") {
      let user = await findUserByName(name);
      let isNew = false;
      if (!user) {
        user = await createUser(name, "passwordless", rawPhone, rawNote);
        isNew = true;
      }

      return NextResponse.json({
        success: true,
        isNew,
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          note: user.note,
          unlockedPieces: user.unlockedPieces,
          redeemedCodes: user.redeemedCodes,
        },
      });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
  } catch (err) {
    console.error("Lỗi API auth:", err);
    return NextResponse.json({ error: "Lỗi server. Vui lòng thử lại." }, { status: 500 });
  }
}
