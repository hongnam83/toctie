# 🎀 Tóc Tie - Chiến Dịch Loyalty "Ghép Mảnh Trúng Thưởng 20/10"

> **"Tie your happiness"** — Nền tảng Loyalty Campaign tương tác dành cho thương hiệu chăm sóc tóc **tóc.tie** nhân dịp ngày Phụ nữ Việt Nam 20/10.  
> 🔗 Fanpage chính thức: [facebook.com/toc.tie26](https://www.facebook.com/toc.tie26)

---

## 🌟 Tính Năng Chính

1. **Cơ chế ghép tranh 4 mảnh (Puzzle 4 Pieces)**:
   - Mỗi đơn hàng sản phẩm tóc.tie sẽ được tặng 1 mã code duy nhất (hoặc quét qua mã QR).
   - Mỗi mã code mở khóa ngẫu nhiên **1 trong 4 góc** của bức tranh thương hiệu.
   - Khi hoàn thành đủ 4 mảnh ghép, khách hàng trúng thưởng phần quà đặc biệt từ tóc.tie.

2. **Hệ thống Mã Code 1 Lần (Single-use Code)**:
   - Mỗi mã chỉ kích hoạt được 1 lần duy nhất, tránh gian lận.
   - Ghi nhận lịch sử người mở, thời gian mở và mảnh ghép tương ứng.

3. **Xác thực Khách Hàng (Tên & Mật khẩu)**:
   - Khách hàng đăng ký / đăng nhập bằng Tên người dùng và Mật khẩu cá nhân.
   - Tiến độ mở mảnh được lưu trữ theo tài khoản để khách hàng có thể quay lại tiếp tục gom mảnh.

4. **Trang Quản Trị Viên (Admin Dashboard)**:
   - Truy cập tại: `/admin`
   - Mã bảo mật mặc định: `toctie-admin-2024`
   - Quản lý danh sách mã code (đã dùng / chưa dùng).
   - Tạo thêm mã code mới theo lô nhanh chóng.
   - Xem danh sách người chơi và tiến độ mở mảnh.

---

## 🔑 Danh Sách Mã Demo Sẵn Có

Dự án đã nạp sẵn 20 mã code để kiểm thử:

| Nhóm | Danh Sách Mã Demo |
|---|---|
| **Bộ 1 (A-D)** | `TOCTIE-2010-AAAA`, `TOCTIE-2010-BBBB`, `TOCTIE-2010-CCCC`, `TOCTIE-2010-DDDD` |
| **Bộ 2 (E-H)** | `TOCTIE-2010-EEEE`, `TOCTIE-2010-FFFF`, `TOCTIE-2010-GGGG`, `TOCTIE-2010-HHHH` |
| **Bộ 3 (I-L)** | `TOCTIE-2010-IIII`, `TOCTIE-2010-JJJJ`, `TOCTIE-2010-KKKK`, `TOCTIE-2010-LLLL` |
| **Bộ 4 (M-P)** | `TOCTIE-2010-MMMM`, `TOCTIE-2010-NNNN`, `TOCTIE-2010-OOOO`, `TOCTIE-2010-PPPP` |
| **Bộ 5 (Q-T)** | `TOCTIE-2010-QQQQ`, `TOCTIE-2010-RRRR`, `TOCTIE-2010-SSSS`, `TOCTIE-2010-TTTT` |

---

## 🛠️ Công Nghệ Sử Dụng

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Vanilla CSS Modules (bảng màu pastel Tóc Tie: Navy `#1E2D6B`, Pastel Blue `#B8CCE4`, Pastel Pink `#F4C5D3`, Warm Cream `#F5EFE0`)
- **Typography**: Shantell Sans & Noto Sans (Google Fonts)
- **Backend / Store**: Next.js Route Handlers (`/api/auth`, `/api/redeem`, `/api/admin`) + in-memory data store

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Môi Trường Cục Bộ

```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy dev server
npm run dev
```

Mở trình duyệt truy cập: `http://localhost:3000`

---

## 🔄 Tự Động Đồng Bộ Lên GitHub

Repository: `https://github.com/hongnam83/toctie`

Dự án đi kèm script `sync.ps1` để tự động add, commit và push lên GitHub mỗi khi có thay đổi:

```powershell
# Chạy đồng bộ tự động với thông điệp tùy chọn
.\sync.ps1 "Nội dung cập nhật"
```
*(Nếu không nhập thông điệp, script sẽ tự động tạo commit với timestamp).*
