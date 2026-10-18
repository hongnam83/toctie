import { NextResponse } from "next/server";
import { findUserByName, findUserById, createUser, sanitizeUser, verifyPassword } from "@/lib/db";

// GET /api/auth?userId=...&accountName=... — Rehydrate active user session on browser reload
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const accountName = searchParams.get("accountName") || searchParams.get("name");

    if ((!userId || !userId.trim()) && (!accountName || !accountName.trim())) {
      return NextResponse.json({ error: "Thiếu userId hoặc accountName." }, { status: 400 });
    }

    let user = null;
    if (userId && userId.trim()) {
      user = await findUserById(userId.trim());
    }

    if (!user && accountName && accountName.trim()) {
      user = await findUserByName(accountName.trim());
    }

    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản người dùng.", notFound: true },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Lỗi GET /api/auth:", err);
    return NextResponse.json({ error: "Lỗi server." }, { status: 500 });
  }
}

// POST /api/auth — Register, Login, or Auto
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawName = body.accountName || body.fullName || "";
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const rawNote = typeof body.note === "string" ? body.note.trim() : "";
    const rawPassword = typeof body.password === "string" ? body.password : "";
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

    // Đăng ký tài khoản mới (khách hàng tự đặt tên tài khoản riêng & lưu trữ bền vững vĩnh viễn)
    if (action === "register") {
      const existing = await findUserByName(name);
      if (existing) {
        // Tài khoản đã tồn tại, tự động chuyển sang đăng nhập người dùng an toàn
        return NextResponse.json({
          success: true,
          isNew: false,
          alreadyExisted: true,
          user: sanitizeUser(existing),
        });
      }

      // Tạo tài khoản mới và lưu trữ bền vững ngay lập tức (await cả Postgres & Cloud Storage)
      const user = await createUser(name, rawPassword || "passwordless", rawPhone, rawNote);

      return NextResponse.json({
        success: true,
        isNew: true,
        user: sanitizeUser(user),
      });
    }

    // Đăng nhập bằng tên tài khoản riêng
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

      // Nếu có mật khẩu bảo mật được cung cấp hoặc tài khoản có mật khẩu riêng
      if (rawPassword && user.passwordHash && user.passwordHash !== "passwordless") {
        const isValid = verifyPassword(rawPassword, user.passwordHash);
        if (!isValid) {
          return NextResponse.json(
            { error: "Mật khẩu không chính xác. Vui lòng thử lại." },
            { status: 401 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        user: sanitizeUser(user),
      });
    }

    // Tự động: Đã có thì đăng nhập, chưa có thì tạo mới
    if (action === "auto") {
      let user = await findUserByName(name);
      let isNew = false;
      if (!user) {
        user = await createUser(name, rawPassword || "passwordless", rawPhone, rawNote);
        isNew = true;
      }

      return NextResponse.json({
        success: true,
        isNew,
        user: sanitizeUser(user),
      });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
  } catch (err) {
    console.error("Lỗi API auth:", err);
    return NextResponse.json({ error: "Lỗi server. Vui lòng thử lại." }, { status: 500 });
  }
}

