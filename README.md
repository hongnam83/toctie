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

3. **Đăng Nhập Bằng Tài Khoản Riêng (Passwordless)**:
   - Khách hàng tự đặt một **Tên tài khoản riêng** (tên, nickname hoặc số điện thoại) khi tham gia.
   - **Không cần mật khẩu**: Mỗi lần quay lại, khách hàng chỉ cần nhập đúng tên tài khoản của mình để tiếp tục gom đủ 4 mảnh ghép (hoàn toàn không lo quên mật khẩu hay nhập sai).
   - Hệ thống tự động lưu trữ tiến độ mở mảnh ghép theo tài khoản này.

4. **Trang Quản Trị Viên (Admin Dashboard) & Quản Lý Mã Dự Thưởng**:
   - Truy cập tại: `/admin` (Mã bảo mật: `toctie1234`).
   - **Tài khoản khách hàng xuất hiện tức thì**: Mỗi khi khách hàng mới đăng ký, tài khoản sẽ hiển thị ngay lập tức lên bảng quản trị (tự động đồng bộ mỗi 5 giây) và được lưu trữ bền vững trên đĩa (`data/store.json`) lẫn Supabase.
   - **Hỗ trợ khách hàng**:
     - Tìm kiếm nhanh theo tên tài khoản.
     - Nút **👤 Quản lý**: Xem chi tiết, sao chép nhanh tên tài khoản hoặc sao chép tin nhắn gửi khách hàng qua Fanpage/Zalo.
     - Hỗ trợ đổi tên tài khoản nếu khách hàng nhập nhầm.
   - **Quản lý & Xóa Mã Dự Thưởng**:
     - Thêm mã mới theo lô (hỗ trợ phân cách bằng dấu phẩy, xuống dòng).
     - **Xóa mã đơn lẻ**: Nút `🗑️ Xóa` trực tiếp trên từng dòng mã.
     - **Xóa hàng loạt**: Chọn nhiều mã bằng ô checkbox và bấm `🗑️ Xóa X mã đã chọn`.
     - **Dọn dẹp nhanh**: Nút `🧹 Xóa tất cả mã chưa dùng` với 1 cú nhấp chuột.
     - Tìm kiếm mã theo chuỗi ký tự hoặc theo tên người đã sử dụng.

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
- **Backend & Database**: Next.js 16 Route Handlers (`/api/auth`, `/api/redeem`, `/api/admin`) + **Supabase PostgreSQL** (`@supabase/supabase-js`) kèm cơ chế fallback in-memory dự phòng thông minh.

---

## 🗄️ Cấu Hình Supabase Database

Dự án đã được tích hợp sẵn với Supabase:

1. **Thông tin kết nối** (lưu trong `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://ylydytwnzelogiwurxcl.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `your-publishable-key`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your-secret-key`

2. **Khởi tạo bảng trong Supabase**:
   - Truy cập Supabase Dashboard: [https://supabase.com/dashboard/project/ylydytwnzelogiwurxcl](https://supabase.com/dashboard/project/ylydytwnzelogiwurxcl)
   - Chọn mục **SQL Editor** -> Tạo **New query**.
   - Dán nội dung từ tệp [`supabase/schema.sql`](file:///c:/Users/Admin/.agents/toc-tie-loyalty/supabase/schema.sql) và nhấn **Run**.
   - Hệ thống sẽ tự động tạo bảng `users`, `redemption_codes`, thiết lập RLS và nạp sẵn 20 mã dự thưởng khởi đầu.

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
