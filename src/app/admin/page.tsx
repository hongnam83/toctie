"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./admin.module.css";

const ADMIN_SECRET = "toctie1234";

interface AdminStats {
  totalUsers: number;
  completedUsers: number;
  totalCodes: number;
  usedCodes: number;
  unusedCodes: number;
  db?: {
    type: string;
    connected: boolean;
    tablesReady: boolean;
    notice: string;
  };
}

interface AdminUser {
  id: string;
  fullName: string;
  phone?: string;
  note?: string;
  createdAt: string;
  pieceCount: number;
  isComplete: boolean;
  redeemedCodes: string[];
}

interface AdminCode {
  code: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
}

const SUPABASE_SCHEMA_SQL = `-- TÓC TIE LOYALTY - SUPABASE PRODUCTION SCHEMA
-- Chạy script này trong Supabase Dashboard -> SQL Editor
-- Link: https://supabase.com/dashboard/project/ylydytwnzelogiwurxcl/sql/new

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  full_name TEXT UNIQUE NOT NULL,
  phone TEXT,
  note TEXT,
  password_hash TEXT NOT NULL,
  unlocked_pieces INT[] DEFAULT '{}',
  redeemed_codes TEXT[] DEFAULT '{}',
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.redemption_codes (
  code TEXT PRIMARY KEY,
  is_used BOOLEAN DEFAULT FALSE,
  used_by TEXT,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_full_name_lower ON public.users(LOWER(full_name));
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_codes_is_used ON public.redemption_codes(is_used);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemption_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role Full Access Users' AND tablename = 'users') THEN
    CREATE POLICY "Service Role Full Access Users" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role Full Access Codes' AND tablename = 'redemption_codes') THEN
    CREATE POLICY "Service Role Full Access Codes" ON public.redemption_codes FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('toctie-store', 'toctie-store', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.redemption_codes (code, is_used)
VALUES
  ('TOCTIE-K7M9X', false),
  ('TOCTIE-P4N8Q', false),
  ('TOCTIE-R6T2W', false),
  ('TOCTIE-H9B5Y', false),
  ('TOCTIE-X3D7K', false),
  ('TOCTIE-M8F2P', false),
  ('TOCTIE-Q5L9R', false),
  ('TOCTIE-T7C4N', false),
  ('TOCTIE-B2W6H', false),
  ('TOCTIE-Y9K3F', false),
  ('TOCTIE-N4X8D', false),
  ('TOCTIE-F6P2M', false),
  ('TOCTIE-W3R7L', false),
  ('TOCTIE-D8H5T', false),
  ('TOCTIE-L2Q9B', false),
  ('TOCTIE-C7Y4X', false),
  ('TOCTIE-G5N8P', false),
  ('TOCTIE-V9M3K', false),
  ('TOCTIE-J4T6R', false),
  ('TOCTIE-Z8F2W', false)
ON CONFLICT (code) DO NOTHING;`;

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"users" | "codes">("users");

  // Code creation & maintenance
  const [newCodes, setNewCodes] = useState("");
  const [addMsg, setAddMsg] = useState("");
  const [codeFilter, setCodeFilter] = useState<"all" | "used" | "unused">("all");
  const [codeSearch, setCodeSearch] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [deleteMsg, setDeleteMsg] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Customer registration states (Thêm & Lưu thông tin khách hàng)
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPieces, setNewCustomerPieces] = useState<number>(0);
  const [addCustomerMsg, setAddCustomerMsg] = useState("");
  const [addCustomerLoading, setAddCustomerLoading] = useState(false);

  // User search & filters
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "completed" | "in_progress" | "no_codes">("all");
  const [userNoticeMsg, setUserNoticeMsg] = useState("");

  // User Edit & Manage modal
  const [modalUser, setModalUser] = useState<AdminUser | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPieceCount, setEditPieceCount] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [copyNotice, setCopyNotice] = useState("");

  // Code edit modal states
  const [modalEditCode, setModalEditCode] = useState<AdminCode | null>(null);
  const [editCodeString, setEditCodeString] = useState("");
  const [editCodeIsUsed, setEditCodeIsUsed] = useState(false);
  const [editCodeUsedBy, setEditCodeUsedBy] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Database setup modal state
  const [showDbModal, setShowDbModal] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  const fetchData = useCallback(async (s: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin?secret=${s}`);
      if (!res.ok) {
        setError("Mật khẩu admin không đúng.");
        return false;
      }
      const data = await res.json();
      setStats(data.stats);
      setUsers(data.users);
      setCodes(data.codes);
      return true;
    } catch {
      setError("Không thể kết nối server.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await fetchData(secret);
    if (ok) setAuthed(true);
  };

  const handleRefresh = () => fetchData(secret);

  // ── THÊM & LƯU THÔNG TIN KHÁCH HÀNG ──
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCustomerName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setAddCustomerMsg("Vui lòng nhập tên tài khoản khách hàng (tối thiểu 2 ký tự).");
      return;
    }

    setAddCustomerLoading(true);
    setAddCustomerMsg("");

    try {
      const res = await fetch(`/api/admin?secret=${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-user",
          fullName: trimmedName,
          initialPieceCount: Number(newCustomerPieces) || 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddCustomerMsg(data.error || "Lỗi khi lưu thông tin khách hàng.");
        return;
      }

      setAddCustomerMsg(data.message || `Đã lưu khách hàng "${trimmedName}" thành công.`);
      setNewCustomerName("");
      setNewCustomerPieces(0);
      setTimeout(() => setAddCustomerMsg(""), 5000);
      fetchData(secret);
    } catch {
      setAddCustomerMsg("Không thể kết nối để lưu khách hàng.");
    } finally {
      setAddCustomerLoading(false);
    }
  };

  // ── SỬA THÔNG TIN KHÁCH HÀNG ──
  const handleOpenUserModal = (u: AdminUser) => {
    setModalUser(u);
    setEditFullName(u.fullName);
    setEditPieceCount(u.pieceCount);
    setActionError("");
    setActionSuccess("");
    setCopyNotice("");
  };

  const handleCloseUserModal = () => {
    setModalUser(null);
    setActionError("");
    setActionSuccess("");
    setCopyNotice("");
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalUser) return;

    const trimmedName = editFullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setActionError("Tên tài khoản phải có ít nhất 2 ký tự.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch(`/api/admin?secret=${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-user",
          userId: modalUser.id,
          fullName: trimmedName,
          pieceCount: Number(editPieceCount),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Không thể cập nhật thông tin khách hàng.");
        return;
      }

      setActionSuccess(`Đã cập nhật thông tin khách hàng "${data.user?.fullName}".`);
      setModalUser(data.user);
      fetchData(secret);
      setTimeout(() => {
        handleCloseUserModal();
      }, 1200);
    } catch {
      setActionError("Lỗi kết nối khi gửi yêu cầu.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── XÓA KHÁCH HÀNG ──
  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}" khỏi hệ thống không?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin?secret=${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-user", userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserNoticeMsg(`Đã xóa tài khoản "${name}" thành công.`);
        setTimeout(() => setUserNoticeMsg(""), 4000);
        if (modalUser?.id === userId) handleCloseUserModal();
        fetchData(secret);
      } else {
        alert(data.error || "Không thể xóa tài khoản.");
      }
    } catch {
      alert("Lỗi kết nối khi xóa tài khoản.");
    }
  };

  // ── XÓA TOÀN BỘ TÀI KHOẢN KHÁCH HÀNG (RESET HỆ THỐNG) ──
  const handleClearAllUsers = async () => {
    if (users.length === 0) {
      alert("Hiện tại không có tài khoản nào trong hệ thống.");
      return;
    }
    if (
      !window.confirm(
        `BẠN CÓ CHẮC CHẮN MUỐN XÓA TẤT CẢ ${users.length} TÀI KHOẢN KHÁCH HÀNG KHỎI HỆ THỐNG?\n\nThao tác này sẽ xóa sạch tài khoản test và hoàn lại 20 mã dự thưởng về trạng thái chưa dùng.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin?secret=${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-all-users" }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserNoticeMsg("Đã xóa sạch toàn bộ tài khoản khách hàng và làm mới hệ thống thành công.");
        setTimeout(() => setUserNoticeMsg(""), 5000);
        fetchData(secret);
      } else {
        alert(data.error || "Không thể xóa tất cả tài khoản.");
      }
    } catch {
      alert("Lỗi kết nối khi xóa tài khoản.");
    }
  };

  // ── XUẤT FILE CSV & SAO CHÉP DANH BẠ ──
  const handleExportCSV = () => {
    if (users.length === 0) {
      alert("Chưa có khách hàng nào để xuất file.");
      return;
    }

    const headers = ["ID", "Tên tài khoản", "Số mảnh ghép", "Trạng thái", "Ngày tham gia", "Mã đã dùng"];
    const rows = users.map((u) => [
      `"${u.id}"`,
      `"${u.fullName.replace(/"/g, '""')}"`,
      u.pieceCount,
      u.isComplete ? "Hoàn thành" : "Đang gom mảnh",
      `"${new Date(u.createdAt).toLocaleString("vi-VN")}"`,
      `"${u.redeemedCodes.join("; ")}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `danh_sach_khach_hang_toctie_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── THÊM MÃ CODE MỚI ──
  const handleAddCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeList = newCodes
      .split(/[\n,;]+/)
      .map((c) => c.trim())
      .filter(Boolean);
    if (!codeList.length) return;

    try {
      const res = await fetch(`/api/admin?secret=${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: codeList }),
      });
      const data = await res.json();
      setAddMsg(data.message);
      setNewCodes("");
      setTimeout(() => setAddMsg(""), 5000);
      fetchData(secret);
    } catch {
      setAddMsg("Lỗi khi thêm mã.");
    }
  };

  // ── XÓA MÃ CODE ──
  const handleDeleteSingleCode = async (code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mã "${code}" khỏi hệ thống không?`)) {
      return;
    }

    setDeleteLoading(true);
    setDeleteMsg("");
    try {
      const res = await fetch(`/api/admin?secret=${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-code", code }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteMsg(data.message || `Đã xóa mã ${code}.`);
        setSelectedCodes((prev) => prev.filter((c) => c !== code));
        setTimeout(() => setDeleteMsg(""), 4000);
        fetchData(secret);
      } else {
        setDeleteMsg(data.error || "Lỗi khi xóa mã.");
      }
    } catch {
      setDeleteMsg("Không thể kết nối để xóa mã.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteSelectedCodes = async () => {
    if (selectedCodes.length === 0) return;
    if (!window.confirm(`Xóa ${selectedCodes.length} mã đã chọn khỏi hệ thống?`)) return;

    setDeleteLoading(true);
    setDeleteMsg("");
    try {
      const res = await fetch(`/api/admin?secret=${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-batch-codes", codes: selectedCodes }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteMsg(data.message || `Đã xóa ${data.deletedCount} mã.`);
        setSelectedCodes([]);
        setTimeout(() => setDeleteMsg(""), 4000);
        fetchData(secret);
      } else {
        setDeleteMsg(data.error || "Lỗi khi xóa mã hàng loạt.");
      }
    } catch {
      setDeleteMsg("Không thể kết nối để xóa mã hàng loạt.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAllUnusedCodes = async () => {
    const unusedCount = codes.filter((c) => !c.isUsed).length;
    if (unusedCount === 0) {
      alert("Không có mã chưa sử dụng nào để xóa.");
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa toàn bộ ${unusedCount} mã CHƯA DÙNG khỏi hệ thống?`)) {
      return;
    }

    setDeleteLoading(true);
    setDeleteMsg("");
    try {
      const res = await fetch(`/api/admin?secret=${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-unused-codes" }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteMsg(data.message || `Đã xóa ${data.deletedCount} mã chưa dùng.`);
        setSelectedCodes([]);
        setTimeout(() => setDeleteMsg(""), 4000);
        fetchData(secret);
      } else {
        setDeleteMsg(data.error || "Lỗi khi xóa mã chưa dùng.");
      }
    } catch {
      setDeleteMsg("Không thể kết nối để xóa các mã chưa dùng.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (areAllVisibleSelected) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(filteredCodes.map((c) => c.code));
    }
  };

  const handleToggleCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // ── CHỈNH SỬA MÃ NHẬN THƯỞNG ──
  const handleOpenEditModal = (c: AdminCode) => {
    setModalEditCode(c);
    setEditCodeString(c.code);
    setEditCodeIsUsed(c.isUsed);
    setEditCodeUsedBy(c.usedBy || "");
    setEditError("");
    setEditSuccess("");
  };

  const handleCloseEditModal = () => {
    setModalEditCode(null);
    setEditError("");
    setEditSuccess("");
  };

  const handleSaveEditCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditCode) return;

    const trimmedCode = editCodeString.trim().toUpperCase();
    if (!trimmedCode || trimmedCode.length < 3) {
      setEditError("Mã dự thưởng phải có ít nhất 3 ký tự.");
      return;
    }

    setEditLoading(true);
    setEditError("");
    setEditSuccess("");

    try {
      const res = await fetch(`/api/admin?secret=${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-code",
          code: modalEditCode.code,
          newCode: trimmedCode,
          isUsed: editCodeIsUsed,
          usedBy: editCodeIsUsed ? editCodeUsedBy.trim() : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Lỗi khi cập nhật mã.");
        return;
      }

      setEditSuccess(data.message || "Cập nhật mã thành công!");
      fetchData(secret);
      setTimeout(() => {
        handleCloseEditModal();
      }, 1000);
    } catch {
      setEditError("Lỗi kết nối khi cập nhật mã.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleBatchMarkStatus = async (isUsed: boolean) => {
    if (selectedCodes.length === 0) return;
    setDeleteLoading(true);
    setDeleteMsg("");
    try {
      let count = 0;
      for (const code of selectedCodes) {
        const res = await fetch(`/api/admin?secret=${secret}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update-code",
            code,
            isUsed,
            usedBy: isUsed ? "Admin thủ công" : null,
          }),
        });
        if (res.ok) count++;
      }
      setDeleteMsg(`Đã cập nhật trạng thái cho ${count} mã đã chọn.`);
      setSelectedCodes([]);
      setTimeout(() => setDeleteMsg(""), 4000);
      fetchData(secret);
    } catch {
      setDeleteMsg("Lỗi khi cập nhật trạng thái hàng loạt.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyNotice(`Đã sao chép ${label}!`);
    setTimeout(() => setCopyNotice(""), 3000);
  };

  // Real-time auto-refresh every 5s so newly registered accounts appear immediately!
  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(() => fetchData(secret), 5000);
    return () => clearInterval(interval);
  }, [authed, secret, fetchData]);

  const filteredCodes = codes.filter((c) => {
    if (codeFilter === "used" && !c.isUsed) return false;
    if (codeFilter === "unused" && c.isUsed) return false;
    if (codeSearch.trim()) {
      const search = codeSearch.trim().toUpperCase();
      return (
        c.code.includes(search) ||
        (c.usedBy && c.usedBy.toUpperCase().includes(search))
      );
    }
    return true;
  });

  const filteredUsers = users.filter((u) => {
    if (userFilter === "completed" && !u.isComplete) return false;
    if (userFilter === "in_progress" && (u.isComplete || u.pieceCount === 0)) return false;
    if (userFilter === "no_codes" && u.pieceCount !== 0) return false;

    if (userSearch.trim()) {
      const q = userSearch.toLowerCase().trim();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const areAllVisibleSelected =
    filteredCodes.length > 0 &&
    filteredCodes.every((c) => selectedCodes.includes(c.code));

  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loginLogo}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1E2D6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className={styles.loginTitle}>Admin tóc.tie</h1>
          <p className={styles.loginSub}>Nhập mật khẩu admin để tiếp tục</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <input
              type="password"
              className="input-field"
              placeholder="Mật khẩu admin..."
              value={secret}
              onChange={(e) => {
                setSecret(e.target.value);
                setError("");
              }}
              autoFocus
            />
            {error && <div className="message message-error">{error}</div>}
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Đang kiểm tra...
                </>
              ) : (
                "Đăng nhập Admin"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerEmoji}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="15" r="4" />
              <path d="M10.85 12.15L19 4M18 5l2 2M15 8l2 2" />
            </svg>
          </span>
          <div>
            <h1 className={styles.headerTitle}>Admin Dashboard</h1>
            <p className={styles.headerSub}>
              tóc.tie Loyalty System · Tự động đồng bộ mỗi 5s
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className="btn btn-secondary btn-sm" onClick={handleRefresh} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            {loading ? (
              <span className="spinner" style={{ width: 14, height: 14 }} />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            )}
            Làm mới
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setAuthed(false)}>
            Đăng xuất
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Database Status Banner */}
        {stats?.db && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              background: stats.db.tablesReady
                ? "rgba(46, 125, 50, 0.1)"
                : "rgba(230, 81, 0, 0.1)",
              border: stats.db.tablesReady
                ? "1px solid rgba(46, 125, 50, 0.3)"
                : "1px solid rgba(230, 81, 0, 0.3)",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: stats.db.tablesReady ? "#2e7d32" : "#e65100",
                  boxShadow: stats.db.tablesReady ? "0 0 8px rgba(46,125,50,0.5)" : "none",
                }}
              />
              <div>
                <strong>Cơ sở dữ liệu: {stats.db.type}</strong>
                <div
                  style={{
                    color: "var(--color-navy-light)",
                    fontSize: "0.82rem",
                    marginTop: "2px",
                  }}
                >
                  {stats.db.notice}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {!stats.db.tablesReady && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowDbModal(true)}
                  style={{ fontSize: "12px" }}
                >
                  Khởi tạo bảng Supabase (1 phút)
                </button>
              )}
              <span
                style={{
                  fontSize: "0.78rem",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontWeight: 600,
                  background: stats.db.tablesReady ? "#2e7d32" : "#e65100",
                  color: "#fff",
                }}
              >
                {stats.db.tablesReady ? "ĐANG HOẠT ĐỘNG" : "LƯU TRỮ AN TOÀN"}
              </span>
            </div>
          </div>
        )}

        {/* Stats cards */}
        {stats && (
          <div className={styles.statsGrid}>
            {[
              {
                label: "Tổng khách hàng",
                value: stats.totalUsers,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
                color: styles.statBlue,
              },
              {
                label: "Hoàn thành 4 mảnh",
                value: stats.completedUsers,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
                    <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                ),
                color: styles.statGold,
              },
              {
                label: "Tổng mã dự thưởng",
                value: stats.totalCodes,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2" />
                    <path d="M6 12h.01M18 12h.01" />
                  </svg>
                ),
                color: styles.statGray,
              },
              {
                label: "Mã đã dùng",
                value: stats.usedCodes,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ),
                color: styles.statGreen,
              },
              {
                label: "Mã còn lại",
                value: stats.unusedCodes,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ),
                color: styles.statPink,
              },
            ].map((s, i) => (
              <div key={i} className={`${styles.statCard} ${s.color}`}>
                <span className={styles.statIcon}>{s.icon}</span>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "users" ? styles.tabActive : ""}`}
            onClick={() => setTab("users")}
          >
            Quản lý khách hàng ({users.length})
          </button>
          <button
            className={`${styles.tab} ${tab === "codes" ? styles.tabActive : ""}`}
            onClick={() => setTab("codes")}
          >
            Mã dự thưởng ({codes.length})
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
            USERS TAB (CHẾ ĐỘ LƯU & QUẢN LÝ THÔNG TIN KHÁCH HÀNG)
        ══════════════════════════════════════════════════════════ */}
        {tab === "users" && (
          <div className={styles.usersLayout}>
            {/* Left Column: Form Thêm / Lưu thông tin khách hàng */}
            <div className={styles.addCodesCard}>
              <h2>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "6px" }}>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                Lưu thông tin khách hàng
              </h2>
              <p>
                Thêm trực tiếp thông tin khách hàng đã đăng ký từ Fanpage, Zalo hoặc tại quầy vào hệ thống.
              </p>

              <form onSubmit={handleSaveCustomer} className={styles.addForm}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "4px" }}>
                    Tên tài khoản / Họ tên *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="VD: maianh2010, Thùy Tiên..."
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "4px" }}>
                    Số mảnh ghép ban đầu:
                  </label>
                  <select
                    className="input-field"
                    value={newCustomerPieces}
                    onChange={(e) => setNewCustomerPieces(Number(e.target.value))}
                    style={{ background: "var(--white)" }}
                  >
                    <option value={0}>0 mảnh (Mới tạo tài khoản)</option>
                    <option value={1}>1 mảnh (Đã mở 1 mảnh)</option>
                    <option value={2}>2 mảnh (Đã mở 2 mảnh)</option>
                    <option value={3}>3 mảnh (Đã mở 3 mảnh)</option>
                    <option value={4}>4 mảnh (Hoàn thành bộ quà)</option>
                  </select>
                </div>

                {addCustomerMsg && (
                  <div
                    className={`message ${
                      addCustomerMsg.includes("Lỗi") || addCustomerMsg.includes("Vui lòng")
                        ? "message-error"
                        : "message-success"
                    }`}
                  >
                    {addCustomerMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={addCustomerLoading}
                >
                  {addCustomerLoading ? "Đang lưu..." : "Lưu vào hệ thống"}
                </button>
              </form>

              <hr style={{ border: "none", borderTop: "1px dashed var(--blue-pastel)", margin: "16px 0 12px" }} />

              {/* Quick statistics */}
              <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Tổng khách đã lưu:</span>
                  <strong>{users.length} tài khoản</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Chưa nhập mã (0/4):</span>
                  <strong style={{ color: "var(--navy)" }}>{users.filter((u) => u.pieceCount === 0).length}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Đang gom mảnh ghép:</span>
                  <strong>{users.filter((u) => u.pieceCount > 0 && !u.isComplete).length}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Khách hoàn thành 4 mảnh:</span>
                  <strong style={{ color: "#166534" }}>{users.filter((u) => u.isComplete).length}</strong>
                </div>
              </div>
            </div>

            {/* Right Column: Bảng danh sách khách hàng đã đăng ký */}
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <div>
                  <h2>Danh sách tài khoản khách hàng đã đăng ký</h2>
                  <span className={styles.tableCount}>
                    {filteredUsers.length} / {users.length} khách (Tự động cập nhật thời gian thực)
                  </span>
                </div>
                <div className={styles.tableControls}>
                  <button
                    type="button"
                    className={styles.btnExport}
                    onClick={handleExportCSV}
                    title="Tải file CSV danh sách khách hàng"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Xuất CSV
                  </button>
                  {users.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllUsers}
                      style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        border: "1px solid #fca5a5",
                        fontSize: "12px",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontWeight: 600,
                      }}
                      title="Xóa tất cả tài khoản khách hàng test"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Xóa tất cả ({users.length})
                    </button>
                  )}
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Tìm theo tên tài khoản..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <div className={styles.filterTabs}>
                    {[
                      { key: "all", label: `Tất cả (${users.length})` },
                      { key: "no_codes", label: `Chưa nhập mã (${users.filter((u) => u.pieceCount === 0).length})` },
                      { key: "in_progress", label: `Đang gom (${users.filter((u) => u.pieceCount > 0 && !u.isComplete).length})` },
                      { key: "completed", label: `Đủ 4 mảnh (${users.filter((u) => u.isComplete).length})` },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        className={`${styles.filterTab} ${userFilter === f.key ? styles.filterTabActive : ""}`}
                        onClick={() => setUserFilter(f.key as any)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {userNoticeMsg && (
                <div className="message message-success" style={{ margin: "14px 20px 0" }}>
                  {userNoticeMsg}
                </div>
              )}

              {filteredUsers.length === 0 ? (
                <div className={styles.empty}>
                  {userSearch || userFilter !== "all"
                    ? "Không tìm thấy khách hàng nào phù hợp với bộ lọc."
                    : "Chưa có tài khoản khách hàng nào. Khi khách đăng ký hoặc bạn bấm Lưu ở bên trái, thông tin sẽ xuất hiện ngay tại đây!"}
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Khách hàng</th>
                        <th>Ngày đăng ký</th>
                        <th>Mảnh ghép</th>
                        <th>Trạng thái</th>
                        <th>Mã đã dùng</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        )
                        .map((u) => (
                          <tr key={u.id} className={u.isComplete ? styles.rowComplete : ""}>
                            <td className={styles.tdName}>
                              <span className={styles.avatar}>
                                {u.fullName.charAt(0).toUpperCase()}
                              </span>
                              <div>
                                <strong>{u.fullName}</strong>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                  {u.id.slice(0, 10)}...
                                </div>
                              </div>
                            </td>
                            <td className={styles.tdDate}>
                              {new Date(u.createdAt).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td>
                              <div className={styles.pieceBadges}>
                                {[0, 1, 2, 3].map((i) => (
                                  <span
                                    key={i}
                                    className={`${styles.pieceDot} ${
                                      u.pieceCount > i ? styles.pieceDotFilled : ""
                                    }`}
                                    title={`Mảnh ${i + 1}`}
                                  />
                                ))}
                              </div>
                            </td>
                            <td>
                              {u.isComplete ? (
                                <span className={styles.badgeComplete}>Hoàn thành</span>
                              ) : u.pieceCount === 0 ? (
                                <span className={styles.badgeUnused}>Chưa nhập mã (0/4)</span>
                              ) : (
                                <span className={styles.badgeInProgress}>
                                  Đang gom ({u.pieceCount}/4)
                                </span>
                              )}
                            </td>
                            <td>
                              <div className={styles.codeList}>
                                {u.redeemedCodes.length > 0 ? (
                                  u.redeemedCodes.map((c) => (
                                    <code key={c} className={styles.codeTag}>
                                      {c}
                                    </code>
                                  ))
                                ) : (
                                  <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                                    Chưa nhập mã
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className={styles.tableRowActions}>
                                <button
                                  type="button"
                                  className={styles.btnEdit}
                                  onClick={() => handleOpenUserModal(u)}
                                  title="Chỉnh sửa thông tin khách hàng"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  className={styles.btnDelete}
                                  onClick={() => handleDeleteUser(u.id, u.fullName)}
                                  title="Xóa tài khoản này"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            CODES TAB (QUẢN LÝ MÃ DỰ THƯỞNG)
        ══════════════════════════════════════════════════════════ */}
        {tab === "codes" && (
          <div className={styles.codesLayout}>
            {/* Add codes form */}
            <div className={styles.addCodesCard}>
              <h2>Thêm mã mới</h2>
              <p>
                Nhập danh sách mã mới, phân cách bằng dấu phẩy, chấm phẩy hoặc xuống dòng.
              </p>
              <form onSubmit={handleAddCodes} className={styles.addForm}>
                <textarea
                  className={`input-field ${styles.codeTextarea}`}
                  placeholder={`TOCTIE-2010-XXXX\nTOCTIE-2010-YYYY\nTOCTIE-2010-ZZZZ`}
                  value={newCodes}
                  onChange={(e) => setNewCodes(e.target.value)}
                  rows={6}
                />
                {addMsg && (
                  <div
                    className={`message ${
                      addMsg.includes("Lỗi") ? "message-error" : "message-success"
                    }`}
                  >
                    {addMsg}
                  </div>
                )}
                <button type="submit" className="btn btn-primary w-full">
                  Thêm vào hệ thống
                </button>
              </form>

              <hr
                style={{
                  border: "none",
                  borderTop: "1px dashed var(--blue-pastel)",
                  margin: "20px 0 16px",
                }}
              />

              {/* Quick maintenance actions */}
              <div>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--navy)",
                    marginBottom: "8px",
                  }}
                >
                  Dọn dẹp mã
                </h3>
                <button
                  type="button"
                  className={styles.btnDelete}
                  onClick={handleDeleteAllUnusedCodes}
                  disabled={deleteLoading}
                  style={{ width: "100%", justifyContent: "center", padding: "8px" }}
                >
                  Xóa tất cả mã chưa dùng ({codes.filter((c) => !c.isUsed).length})
                </button>
              </div>
            </div>

            {/* Codes list */}
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <div>
                  <h2>Danh sách mã dự thưởng</h2>
                  <span className={styles.tableCount}>
                    {filteredCodes.length} / {codes.length} mã
                  </span>
                </div>
                <div className={styles.tableControls}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Tìm mã code hoặc người dùng..."
                    value={codeSearch}
                    onChange={(e) => setCodeSearch(e.target.value)}
                  />
                  <div className={styles.filterTabs}>
                    {(["all", "unused", "used"] as const).map((f) => (
                      <button
                        key={f}
                        className={`${styles.filterTab} ${
                          codeFilter === f ? styles.filterTabActive : ""
                        }`}
                        onClick={() => setCodeFilter(f)}
                      >
                        {f === "all"
                          ? `Tất cả (${codes.length})`
                          : f === "unused"
                          ? `Chưa dùng (${codes.filter((c) => !c.isUsed).length})`
                          : `Đã dùng (${codes.filter((c) => c.isUsed).length})`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Batch Action Toolbar when items are selected */}
              {selectedCodes.length > 0 && (
                <div className={styles.batchToolbar}>
                  <span>
                    Đã chọn <strong>{selectedCodes.length}</strong> mã dự thưởng
                  </span>
                  <div className={styles.batchToolbarActions}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleBatchMarkStatus(false)}
                      disabled={deleteLoading}
                      title="Chuyển tất cả mã đã chọn về trạng thái Chưa dùng"
                    >
                      Đặt Chưa dùng
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleBatchMarkStatus(true)}
                      disabled={deleteLoading}
                      title="Chuyển tất cả mã đã chọn sang trạng thái Đã dùng"
                    >
                      Đặt Đã dùng
                    </button>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={handleDeleteSelectedCodes}
                      disabled={deleteLoading}
                    >
                      Xóa {selectedCodes.length} mã đã chọn
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedCodes([])}
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>
              )}

              {/* Delete notification */}
              {deleteMsg && (
                <div
                  className={`message ${
                    deleteMsg.includes("Lỗi") ? "message-error" : "message-success"
                  }`}
                  style={{ marginBottom: "16px" }}
                >
                  {deleteMsg}
                </div>
              )}

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.checkboxCol}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={areAllVisibleSelected}
                          onChange={handleToggleSelectAll}
                          title="Chọn tất cả mã đang hiển thị"
                        />
                      </th>
                      <th className={styles.thCode}>Mã</th>
                      <th className={styles.thStatus}>Trạng thái</th>
                      <th>Tài khoản sử dụng</th>
                      <th className={styles.thDate}>Thời gian dùng</th>
                      <th className={styles.thActions}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCodes.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                          Không tìm thấy mã nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredCodes.map((c) => (
                        <tr key={c.code}>
                          <td className={styles.checkboxCol}>
                            <input
                              type="checkbox"
                              className={styles.checkboxInput}
                              checked={selectedCodes.includes(c.code)}
                              onChange={() => handleToggleCode(c.code)}
                            />
                          </td>
                          <td className={styles.tdCode}>
                            <code className={styles.codeMonoLg}>{c.code}</code>
                          </td>
                          <td className={styles.tdStatus}>
                            {c.isUsed ? (
                              <span className={styles.badgeUsed}>Đã dùng</span>
                            ) : (
                              <span className={styles.badgeUnused}>Chưa dùng</span>
                            )}
                          </td>
                          <td>{c.usedBy || "—"}</td>
                          <td className={styles.tdDate}>
                            {c.usedAt
                              ? new Date(c.usedAt).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </td>
                          <td className={styles.tdActions}>
                            <div className={styles.tableRowActions}>
                              <button
                                type="button"
                                className={styles.btnEdit}
                                onClick={() => handleOpenEditModal(c)}
                                title="Chỉnh sửa mã này"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Sửa
                              </button>
                              <button
                                type="button"
                                className={styles.btnDelete}
                                onClick={() => handleDeleteSingleCode(c.code)}
                                disabled={deleteLoading}
                                title="Xóa mã này khỏi hệ thống"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Modal Quản Lý & Chỉnh Sửa Thông Tin Khách Hàng ── */}
      {modalUser && (
        <div className={styles.modalOverlay} onClick={handleCloseUserModal}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Quản lý & Sửa thông tin khách hàng
              </h3>
              <button
                className={styles.modalCloseBtn}
                onClick={handleCloseUserModal}
                title="Đóng"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalUserHighlight}>
                <div style={{ fontSize: "16px", marginBottom: "4px" }}>
                  Khách hàng: <strong style={{ color: "var(--navy)" }}>{modalUser.fullName}</strong>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Mã ID: <code>{modalUser.id}</code> · Tiến trình: <strong>{modalUser.pieceCount}/4 mảnh</strong>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Mã đã nhập: {modalUser.redeemedCodes.length > 0 ? modalUser.redeemedCodes.join(", ") : "Chưa nhập mã nào"}
                </div>
              </div>

              {/* Fast Copy Tools for Customer Support */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--navy)" }}>
                  Hỗ trợ khách hàng nhanh:
                </span>
                <div className={styles.resultActions}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => copyToClipboard(modalUser.fullName, "tên tài khoản")}
                  >
                    Sao chép tên
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      copyToClipboard(
                        `Dạ Tóc Tie xin chào bạn! Tên tài khoản tham gia chiến dịch của bạn là: "${modalUser.fullName}". Bạn chỉ cần truy cập website và nhập tên tài khoản này (không cần mật khẩu) là có thể tiếp tục ghép tranh gom quà nhé!`,
                        "tin nhắn gửi khách"
                      )
                    }
                  >
                    Sao chép tin nhắn gửi khách
                  </button>
                </div>
                {copyNotice && <div className={styles.copyNoticeToast} style={{ textAlign: "center" }}>{copyNotice}</div>}
              </div>

              <hr style={{ border: "none", borderTop: "1px dashed var(--blue-pastel)", margin: "4px 0" }} />

              {/* Form Sửa thông tin */}
              <form onSubmit={handleUpdateCustomer} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "4px" }}>
                    Tên tài khoản khách:
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={editFullName}
                    onChange={(e) => {
                      setEditFullName(e.target.value);
                      setActionError("");
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "4px" }}>
                    Số mảnh ghép sở hữu:
                  </label>
                  <select
                    className="input-field"
                    value={editPieceCount}
                    onChange={(e) => setEditPieceCount(Number(e.target.value))}
                    style={{ background: "var(--white)" }}
                  >
                    <option value={0}>0 mảnh (Chưa mở mảnh nào)</option>
                    <option value={1}>1 mảnh</option>
                    <option value={2}>2 mảnh</option>
                    <option value={3}>3 mảnh</option>
                    <option value={4}>4 mảnh (Hoàn thành)</option>
                  </select>
                </div>

                {actionError && <div className="message message-error">{actionError}</div>}
                {actionSuccess && <div className="message message-success">{actionSuccess}</div>}

                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading}
                    style={{ flex: 1 }}
                  >
                    {actionLoading ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                  <button
                    type="button"
                    className={styles.btnDelete}
                    onClick={() => handleDeleteUser(modalUser.id, modalUser.fullName)}
                    disabled={actionLoading}
                  >
                    Xóa tài khoản
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Chỉnh Sửa Mã Dự Thưởng ── */}
      {modalEditCode && (
        <div className={styles.modalOverlay} onClick={handleCloseEditModal}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Chỉnh sửa mã nhận thưởng
              </h3>
              <button
                className={styles.modalCloseBtn}
                onClick={handleCloseEditModal}
                title="Đóng"
                type="button"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditCode} className={styles.modalBody}>
              <div className={styles.modalUserHighlight}>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
                  Mã gốc đang chỉnh sửa:
                </div>
                <code className={styles.codeMonoLg} style={{ fontSize: "16px" }}>
                  {modalEditCode.code}
                </code>
              </div>

              {/* Code String Input */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--navy)" }}>
                  Mã nhận thưởng (Code):
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="VD: TOCTIE-2010-ABCD"
                  value={editCodeString}
                  onChange={(e) => {
                    setEditCodeString(e.target.value.toUpperCase());
                    setEditError("");
                    setEditSuccess("");
                  }}
                  style={{ fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "1px" }}
                  required
                />
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Có thể đổi tên mã nếu nhập sai chính tả hoặc cần chuẩn hóa mã.
                </span>
              </div>

              {/* Code Status Selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--navy)" }}>
                  Trạng thái mã:
                </label>
                <div className={styles.editStatusGroup}>
                  <button
                    type="button"
                    className={`${styles.statusOptionBtn} ${!editCodeIsUsed ? styles.statusOptionBtnActive : ""}`}
                    onClick={() => {
                      setEditCodeIsUsed(false);
                      setEditError("");
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Chưa sử dụng
                  </button>
                  <button
                    type="button"
                    className={`${styles.statusOptionBtn} ${editCodeIsUsed ? styles.statusOptionBtnActive : ""}`}
                    onClick={() => {
                      setEditCodeIsUsed(true);
                      setEditError("");
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Đã sử dụng
                  </button>
                </div>
              </div>

              {/* If used, user info */}
              {editCodeIsUsed && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--navy)" }}>
                    Tài khoản đã sử dụng:
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Tên tài khoản (tùy chọn)..."
                    value={editCodeUsedBy}
                    onChange={(e) => setEditCodeUsedBy(e.target.value)}
                  />
                  {modalEditCode.usedAt && (
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Thời gian dùng: {new Date(modalEditCode.usedAt).toLocaleString("vi-VN")}
                    </span>
                  )}
                </div>
              )}

              {editError && <div className="message message-error">{editError}</div>}
              {editSuccess && <div className="message message-success">{editSuccess}</div>}

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editLoading}
                  style={{ flex: 1 }}
                >
                  {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseEditModal}
                  disabled={editLoading}
                >
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Hướng Dẫn Khởi Tạo Supabase Cloud Database ── */}
      {showDbModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDbModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Khởi tạo bảng cơ sở dữ liệu Supabase
              </h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowDbModal(false)}
                title="Đóng"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ fontSize: "14px", lineHeight: "1.5", margin: 0 }}>
                Hệ thống đã tự động lưu dữ liệu khách hàng an toàn. Để đồng bộ vĩnh viễn với Supabase Cloud, bạn chỉ cần thực hiện 2 bước đơn giản:
              </p>

              <ol style={{ fontSize: "13px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                <li>
                  Bấm nút <strong>"Mở Supabase SQL Editor"</strong> bên dưới.
                </li>
                <li>
                  Dán đoạn mã SQL đã copy vào khung soạn thảo và bấm <strong>Run</strong> (Chạy).
                </li>
              </ol>

              <div style={{ position: "relative" }}>
                <pre className={styles.sqlModalBlock}>
                  {SUPABASE_SCHEMA_SQL}
                </pre>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ position: "absolute", top: "10px", right: "10px", fontSize: "11px" }}
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
                    setSqlCopied(true);
                    setTimeout(() => setSqlCopied(false), 3000);
                  }}
                >
                  {sqlCopied ? "Đã sao chép SQL!" : "Sao chép SQL"}
                </button>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "6px" }}>
                <a
                  href="https://supabase.com/dashboard/project/ylydytwnzelogiwurxcl/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ flex: 1, textAlign: "center", textDecoration: "none" }}
                >
                  Mở Supabase SQL Editor ➔
                </a>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    fetchData(secret);
                    setShowDbModal(false);
                  }}
                >
                  Kiểm tra lại kết nối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
