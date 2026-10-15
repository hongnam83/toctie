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

  // Search & Password reset states
  const [userSearch, setUserSearch] = useState("");
  const [resetModalUser, setResetModalUser] = useState<AdminUser | null>(null);
  const [customPassword, setCustomPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetResult, setResetResult] = useState<{ fullName: string; newPassword: string } | null>(null);
  const [copyNotice, setCopyNotice] = useState("");

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

  const handleOpenResetModal = (u: AdminUser) => {
    setResetModalUser(u);
    setCustomPassword("");
    setResetError("");
    setResetResult(null);
    setCopyNotice("");
  };

  const handleCloseResetModal = () => {
    setResetModalUser(null);
    setResetResult(null);
    setResetError("");
    setCopyNotice("");
  };

  const handleGenerateRandomPassword = () => {
    const rand = `toctie${Math.floor(1000 + Math.random() * 9000)}`;
    setCustomPassword(rand);
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    setResetLoading(true);
    setResetError("");

    try {
      const res = await fetch(`/api/admin?secret=${secret}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          userId: resetModalUser.id,
          newPassword: customPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || "Không thể đặt lại mật khẩu.");
        return;
      }

      setResetResult({
        fullName: resetModalUser.fullName,
        newPassword: data.newPassword,
      });
    } catch {
      setResetError("Lỗi kết nối khi gửi yêu cầu.");
    } finally {
      setResetLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyNotice(`Đã sao chép ${label}!`);
    setTimeout(() => setCopyNotice(""), 3000);
  };

  // Auto-refresh every 30s
  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(() => fetchData(secret), 30000);
    return () => clearInterval(interval);
  }, [authed, secret, fetchData]);

  const filteredCodes = codes.filter((c) => {
    if (filter === "used") return c.isUsed;
    if (filter === "unused") return !c.isUsed;
    return true;
  });

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(userSearch.toLowerCase().trim())
  );

  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loginLogo}>🔐</div>
          <h1 className={styles.loginTitle}>Admin tóc.tie</h1>
          <p className={styles.loginSub}>Nhập mật khẩu admin để tiếp tục</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <input
              type="password"
              className="input-field"
              placeholder="Mật khẩu admin..."
              value={secret}
              onChange={(e) => { setSecret(e.target.value); setError(""); }}
              autoFocus
            />
            {error && <div className="message message-error">{error}</div>}
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <><span className="spinner" />Đang kiểm tra...</> : "Đăng nhập Admin"}
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
          <span className={styles.headerEmoji}>🔑</span>
          <div>
            <h1 className={styles.headerTitle}>Admin Dashboard</h1>
            <p className={styles.headerSub}>tóc.tie Loyalty System</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className="btn btn-secondary btn-sm" onClick={handleRefresh} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "🔄"} Refresh
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
              background: stats.db.tablesReady ? "rgba(46, 125, 50, 0.1)" : "rgba(230, 81, 0, 0.1)",
              border: stats.db.tablesReady ? "1px solid rgba(46, 125, 50, 0.3)" : "1px solid rgba(230, 81, 0, 0.3)",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.2rem" }}>{stats.db.tablesReady ? "🟢" : "⚡"}</span>
              <div>
                <strong>Cơ sở dữ liệu: {stats.db.type}</strong>
                <div style={{ color: "var(--color-navy-light)", fontSize: "0.82rem", marginTop: "2px" }}>
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
              {stats.db.tablesReady ? "ĐANG HOẠT ĐỘNG" : "ĐÃ KẾT NỐI (CHỜ BẢNG)"}
            </span>
          </div>
        )}

        {/* Stats cards */}
        {stats && (
          <div className={styles.statsGrid}>
            {[
              { label: "Tổng người dùng", value: stats.totalUsers, icon: "👥", color: styles.statBlue },
              { label: "Hoàn thành 4 mảnh", value: stats.completedUsers, icon: "🏆", color: styles.statGold },
              { label: "Tổng mã", value: stats.totalCodes, icon: "🎟️", color: styles.statGray },
              { label: "Đã dùng", value: stats.usedCodes, icon: "✅", color: styles.statGreen },
              { label: "Còn lại", value: stats.unusedCodes, icon: "🔒", color: styles.statPink },
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
            👥 Người dùng ({users.length})
          </button>
          <button
            className={`${styles.tab} ${tab === "codes" ? styles.tabActive : ""}`}
            onClick={() => setTab("codes")}
          >
            🎟️ Mã dự thưởng ({codes.length})
          </button>
        </div>

        {/* Users tab */}
        {tab === "users" && (
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div>
                <h2>Danh sách người tham gia</h2>
                <span className={styles.tableCount}>
                  {filteredUsers.length} / {users.length} người
                </span>
              </div>
              <div className={styles.tableControls}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="🔍 Tìm theo tên người dùng..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className={styles.empty}>
                {userSearch ? "Không tìm thấy người dùng nào phù hợp." : "Chưa có người tham gia nào."}
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Họ và tên</th>
                      <th>Ngày tham gia</th>
                      <th>Mảnh ghép</th>
                      <th>Trạng thái</th>
                      <th>Mã đã dùng</th>
                      <th>Khôi phục MK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((u) => (
                        <tr key={u.id} className={u.isComplete ? styles.rowComplete : ""}>
                          <td className={styles.tdName}>
                            <span className={styles.avatar}>{u.fullName.charAt(0).toUpperCase()}</span>
                            {u.fullName}
                          </td>
                          <td className={styles.tdDate}>
                            {new Date(u.createdAt).toLocaleDateString("vi-VN", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </td>
                          <td>
                            <div className={styles.pieceBadges}>
                              {[0, 1, 2, 3].map((i) => (
                                <span
                                  key={i}
                                  className={`${styles.pieceDot} ${u.redeemedCodes.length > i ? styles.pieceDotFilled : ""}`}
                                  title={`Mảnh ${i + 1}`}
                                />
                              ))}
                            </div>
                          </td>
                          <td>
                            {u.isComplete ? (
                              <span className={styles.badgeComplete}>🏆 Hoàn thành</span>
                            ) : (
                              <span className={styles.badgeInProgress}>{u.pieceCount}/4 mảnh</span>
                            )}
                          </td>
                          <td>
                            <div className={styles.codeList}>
                              {u.redeemedCodes.length > 0 ? (
                                u.redeemedCodes.map((c) => (
                                  <code key={c} className={styles.codeTag}>{c}</code>
                                ))
                              ) : (
                                <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Chưa nhập mã</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <button
                              className={styles.btnReset}
                              onClick={() => handleOpenResetModal(u)}
                              title="Tạo lại mật khẩu cho tài khoản này"
                            >
                              🔑 Đổi MK
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
              <h2 className={styles.addTitle}>➕ Thêm mã mới</h2>
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
                  <div className={`message ${addMsg.includes("Lỗi") ? "message-error" : "message-success"}`}>
                    {addMsg}
                  </div>
                )}
                <button type="submit" className="btn btn-primary w-full">
                  Thêm vào hệ thống
                </button>
              </form>
            </div>

            {/* Codes list */}
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <h2>Danh sách mã dự thưởng</h2>
                <div className={styles.filterTabs}>
                  {(["all", "unused", "used"] as const).map((f) => (
                    <button
                      key={f}
                      className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ""}`}
                      onClick={() => setFilter(f)}
                    >
                      {f === "all" ? `Tất cả (${codes.length})` : f === "unused" ? `Chưa dùng (${codes.filter(c => !c.isUsed).length})` : `Đã dùng (${codes.filter(c => c.isUsed).length})`}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Trạng thái</th>
                      <th>Người dùng</th>
                      <th>Thời gian dùng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCodes.map((c) => (
                      <tr key={c.code}>
                        <td>
                          <code className={styles.codeMonoLg}>{c.code}</code>
                        </td>
                        <td>
                          {c.isUsed ? (
                            <span className={styles.badgeUsed}>✅ Đã dùng</span>
                          ) : (
                            <span className={styles.badgeUnused}>🔒 Chưa dùng</span>
                          )}
                        </td>
                        <td>{c.usedBy || "—"}</td>
                        <td>
                          {c.usedAt
                            ? new Date(c.usedAt).toLocaleDateString("vi-VN", {
                                day: "2-digit", month: "2-digit", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Modal Đặt lại Mật khẩu (Admin/Backend Only) ── */}
      {resetModalUser && (
        <div className={styles.modalOverlay} onClick={handleCloseResetModal}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span>🔑</span> Khôi phục mật khẩu tài khoản
              </h3>
              <button
                className={styles.modalCloseBtn}
                onClick={handleCloseResetModal}
                title="Đóng"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalUserHighlight}>
                <div>
                  Khách hàng: <strong>{resetModalUser.fullName}</strong>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Mã tài khoản: <code>{resetModalUser.id}</code>
                </div>
              </div>

              {!resetResult ? (
                <form onSubmit={handleConfirmReset} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--navy)", marginBottom: "6px" }}>
                      Mật khẩu mới:
                    </label>
                    <div className={styles.passwordInputGroup}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Để trống để tự tạo (VD: toctie8888)..."
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className={styles.btnRandom}
                        onClick={handleGenerateRandomPassword}
                        title="Tạo mật khẩu ngẫu nhiên"
                      >
                        🎲 Tạo ngẫu nhiên
                      </button>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                      💡 Mật khẩu này sẽ có hiệu lực ngay lập tức cho khách hàng.
                    </div>
                  </div>

                  {resetError && <div className="message message-error">{resetError}</div>}

                  <div className={styles.modalFooter} style={{ padding: 0, background: "transparent", border: "none" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleCloseResetModal}
                      disabled={resetLoading}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={resetLoading}
                    >
                      {resetLoading ? "Đang xử lý..." : "Xác nhận đặt lại"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.resultBox}>
                  <div className={styles.resultTitle}>
                    ✅ Đã đặt lại mật khẩu thành công!
                  </div>
                  <div className={styles.resultPasswordDisplay}>
                    {resetResult.newPassword}
                  </div>
                  <div className={styles.resultActions}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => copyToClipboard(resetResult.newPassword, "mật khẩu")}
                    >
                      📋 Sao chép mật khẩu
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        copyToClipboard(
                          `Dạ Tóc Tie xin chào ${resetResult.fullName}! Mật khẩu tài khoản tham gia minigame 20/10 của bạn đã được khởi tạo lại thành: ${resetResult.newPassword}. Bạn có thể đăng nhập ngay để tiếp tục gom mảnh trúng quà nhé!`,
                          "tin nhắn gửi khách"
                        )
                      }
                    >
                      💬 Sao chép tin nhắn gửi khách
                    </button>
                  </div>
                  {copyNotice && <div className={styles.copyNoticeToast}>{copyNotice}</div>}

                  <div style={{ marginTop: "12px" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm w-full"
                      onClick={handleCloseResetModal}
                    >
                      Đóng cửa sổ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
