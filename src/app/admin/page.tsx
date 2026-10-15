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

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"users" | "codes">("users");
  const [newCodes, setNewCodes] = useState("");
  const [addMsg, setAddMsg] = useState("");
  const [filter, setFilter] = useState<"all" | "used" | "unused">("all");

  // Search & Account modal states
  const [userSearch, setUserSearch] = useState("");
  const [modalUser, setModalUser] = useState<AdminUser | null>(null);
  const [newAccountName, setNewAccountName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [copyNotice, setCopyNotice] = useState("");

  // Code search & deletion states
  const [codeSearch, setCodeSearch] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [deleteMsg, setDeleteMsg] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedCodes.length} mã đã chọn không?`
      )
    ) {
      return;
    }

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
        setDeleteMsg(data.message || `Đã xóa ${selectedCodes.length} mã.`);
        setSelectedCodes([]);
        setTimeout(() => setDeleteMsg(""), 4000);
        fetchData(secret);
      } else {
        setDeleteMsg(data.error || "Lỗi khi xóa mã hàng loạt.");
      }
    } catch {
      setDeleteMsg("Lỗi kết nối khi xóa mã hàng loạt.");
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

    if (
      !window.confirm(
        `CẢNH BÁO: Bạn có muốn xóa toàn bộ ${unusedCount} mã CHƯA DÙNG khỏi hệ thống?`
      )
    ) {
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
        setDeleteMsg(data.message || "Đã xóa toàn bộ mã chưa dùng.");
        setSelectedCodes([]);
        setTimeout(() => setDeleteMsg(""), 4000);
        fetchData(secret);
      } else {
        setDeleteMsg(data.error || "Lỗi khi xóa mã chưa dùng.");
      }
    } catch {
      setDeleteMsg("Lỗi kết nối khi xóa mã chưa dùng.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleCodes = filteredCodes.map((c) => c.code);
    const allSelected = visibleCodes.every((c) => selectedCodes.includes(c));
    if (allSelected) {
      setSelectedCodes((prev) => prev.filter((c) => !visibleCodes.includes(c)));
    } else {
      const combined = Array.from(new Set([...selectedCodes, ...visibleCodes]));
      setSelectedCodes(combined);
    }
  };

  const handleOpenUserModal = (u: AdminUser) => {
    setModalUser(u);
    setNewAccountName(u.fullName);
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

  const handleRenameAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalUser) return;
    if (!newAccountName.trim() || newAccountName.trim().length < 2) {
      setActionError("Tên tài khoản mới phải có ít nhất 2 ký tự.");
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
          action: "rename-account",
          userId: modalUser.id,
          newAccountName: newAccountName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Không thể đổi tên tài khoản.");
        return;
      }

      setActionSuccess(`Đã đổi tên tài khoản thành: "${data.newName}".`);
      setModalUser({ ...modalUser, fullName: data.newName });
      fetchData(secret);
    } catch {
      setActionError("Lỗi kết nối khi gửi yêu cầu.");
    } finally {
      setActionLoading(false);
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
    if (filter === "used" && !c.isUsed) return false;
    if (filter === "unused" && c.isUsed) return false;
    if (codeSearch.trim()) {
      const search = codeSearch.trim().toUpperCase();
      return (
        c.code.includes(search) ||
        (c.usedBy && c.usedBy.toUpperCase().includes(search))
      );
    }
    return true;
  });

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(userSearch.toLowerCase().trim())
  );

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
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
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
              {stats.db.tablesReady ? "ĐANG HOẠT ĐỘNG" : "ĐÃ KẾT NỐI (LƯU ĐĨA AN TOÀN)"}
            </span>
          </div>
        )}

        {/* Stats cards */}
        {stats && (
          <div className={styles.statsGrid}>
            {[
              {
                label: "Tổng tài khoản khách",
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
            Tài khoản người dùng ({users.length})
          </button>
          <button
            className={`${styles.tab} ${tab === "codes" ? styles.tabActive : ""}`}
            onClick={() => setTab("codes")}
          >
            Mã dự thưởng ({codes.length})
          </button>
        </div>

        {/* Users tab */}
        {tab === "users" && (
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div>
                <h2>Danh sách tài khoản khách hàng</h2>
                <span className={styles.tableCount}>
                  {filteredUsers.length} / {users.length} tài khoản (Cập nhật thời gian thực)
                </span>
              </div>
              <div className={styles.tableControls}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Tìm theo tên tài khoản..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className={styles.empty}>
                {userSearch
                  ? "Không tìm thấy tài khoản nào phù hợp."
                  : "Chưa có tài khoản nào được tạo. Khi khách đăng ký sẽ xuất hiện ngay tại đây!"}
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tài khoản riêng</th>
                      <th>Ngày tham gia</th>
                      <th>Mảnh ghép</th>
                      <th>Trạng thái</th>
                      <th>Mã đã dùng</th>
                      <th>Hỗ trợ / Quản lý</th>
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
                            <strong>{u.fullName}</strong>
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
                                    u.redeemedCodes.length > i ? styles.pieceDotFilled : ""
                                  }`}
                                  title={`Mảnh ${i + 1}`}
                                />
                              ))}
                            </div>
                          </td>
                          <td>
                            {u.isComplete ? (
                              <span className={styles.badgeComplete}>Hoàn thành</span>
                            ) : (
                              <span className={styles.badgeInProgress}>
                                {u.pieceCount}/4 mảnh
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
                            <button
                              className={styles.btnReset}
                              onClick={() => handleOpenUserModal(u)}
                              title="Xem thông tin và hỗ trợ tài khoản này"
                            >
                              Quản lý
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Codes tab */}
        {tab === "codes" && (
          <div className={styles.codesLayout}>
            {/* Add codes form */}
            <div className={styles.addCard}>
              <h2 className={styles.addTitle}>Thêm mã mới</h2>
              <p className={styles.addSub}>
                Nhập danh sách mã mới, phân cách bằng dấu phẩy, chấm phẩy hoặc xuống dòng.
              </p>
              <form onSubmit={handleAddCodes} className={styles.addForm}>
                <textarea
                  className={`input-field ${styles.addTextarea}`}
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
                          filter === f ? styles.filterTabActive : ""
                        }`}
                        onClick={() => setFilter(f)}
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
                      <th>Mã</th>
                      <th>Trạng thái</th>
                      <th>Tài khoản sử dụng</th>
                      <th>Thời gian dùng</th>
                      <th>Thao tác</th>
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
                          <td>
                            <code className={styles.codeMonoLg}>{c.code}</code>
                          </td>
                          <td>
                            {c.isUsed ? (
                              <span className={styles.badgeUsed}>Đã dùng</span>
                            ) : (
                              <span className={styles.badgeUnused}>Chưa dùng</span>
                            )}
                          </td>
                          <td>{c.usedBy || "—"}</td>
                          <td>
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
                          <td>
                            <button
                              type="button"
                              className={styles.btnDelete}
                              onClick={() => handleDeleteSingleCode(c.code)}
                              disabled={deleteLoading}
                              title="Xóa mã này khỏi hệ thống"
                            >
                              Xóa
                            </button>
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

      {/* ── Modal Quản Lý & Hỗ Trợ Tài Khoản Khách Hàng ── */}
      {modalUser && (
        <div className={styles.modalOverlay} onClick={handleCloseUserModal}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                Quản lý tài khoản khách hàng
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
                  Tên tài khoản: <strong style={{ color: "var(--navy)" }}>{modalUser.fullName}</strong>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Mã ID: <code>{modalUser.id}</code> · Tiến độ: <strong>{modalUser.pieceCount}/4 mảnh</strong>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Mã đã nhập: {modalUser.redeemedCodes.length > 0 ? modalUser.redeemedCodes.join(", ") : "Chưa nhập mã nào"}
                </div>
              </div>

              {/* Fast Copy Tools for Customer Support */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--navy)" }}>
                  Hỗ trợ khách hàng quên tên tài khoản:
                </span>
                <div className={styles.resultActions}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => copyToClipboard(modalUser.fullName, "tên tài khoản")}
                  >
                    Sao chép tên tài khoản
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      copyToClipboard(
                        `Dạ Tóc Tie xin chào bạn! Tên tài khoản tham gia chiến dịch 20/10 của bạn là: "${modalUser.fullName}". Bạn chỉ cần truy cập website và nhập đúng tên tài khoản này (không cần mật khẩu) là có thể tiếp tục ghép tranh gom quà nhé!`,
                        "tin nhắn gửi khách"
                      )
                    }
                  >
                    Sao chép tin nhắn gửi khách
                  </button>
                </div>
                {copyNotice && <div className={styles.copyNoticeToast} style={{ textAlign: "center" }}>{copyNotice}</div>}
              </div>

              <hr style={{ border: "none", borderTop: "1px dashed var(--blue-pastel)", margin: "8px 0" }} />

              {/* Rename Account form */}
              <form onSubmit={handleRenameAccount} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--navy)" }}>
                  Đổi tên tài khoản (nếu khách gõ nhầm):
                </label>
                <div className={styles.passwordInputGroup}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Nhập tên tài khoản mới..."
                    value={newAccountName}
                    onChange={(e) => {
                      setNewAccountName(e.target.value);
                      setActionError("");
                      setActionSuccess("");
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm"
                    disabled={actionLoading || newAccountName.trim() === modalUser.fullName}
                  >
                    {actionLoading ? "Đang lưu..." : "Lưu tên mới"}
                  </button>
                </div>
                {actionError && <div className="message message-error">{actionError}</div>}
                {actionSuccess && <div className="message message-success">{actionSuccess}</div>}
              </form>

              <div style={{ marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm w-full"
                  onClick={handleCloseUserModal}
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
