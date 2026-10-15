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

        {/* Users table */}
        {tab === "users" && (
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h2>Danh sách người tham gia</h2>
              <span className={styles.tableCount}>{users.length} người</span>
            </div>
            {users.length === 0 ? (
              <div className={styles.empty}>Chưa có người tham gia nào.</div>
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
                    </tr>
                  </thead>
                  <tbody>
                    {users
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
                              {u.redeemedCodes.map((c) => (
                                <code key={c} className={styles.codeTag}>{c}</code>
                              ))}
                            </div>
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
            {/* Add codes */}
            <div className={styles.addCodesCard}>
              <h2>➕ Thêm mã mới</h2>
              <p>Nhập mỗi mã một dòng, hoặc cách nhau bằng dấu phẩy.</p>
              <form onSubmit={handleAddCodes} className={styles.addForm}>
                <textarea
                  className={`input-field ${styles.codeTextarea}`}
                  placeholder={"TOCTIE-2010-XXXX\nTOCTIE-2010-YYYY\n..."}
                  value={newCodes}
                  onChange={(e) => setNewCodes(e.target.value)}
                  rows={6}
                />
                {addMsg && (
                  <div className="message message-success">{addMsg}</div>
                )}
                <button type="submit" className="btn btn-primary w-full">
                  Thêm mã
                </button>
              </form>
            </div>

            {/* Codes list */}
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <h2>Danh sách mã</h2>
                <div className={styles.filterTabs}>
                  {(["all", "used", "unused"] as const).map((f) => (
                    <button
                      key={f}
                      className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ""}`}
                      onClick={() => setFilter(f)}
                    >
                      {f === "all" ? "Tất cả" : f === "used" ? "Đã dùng" : "Còn lại"}
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
                        <td><code className={styles.codeMonoLg}>{c.code}</code></td>
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
    </div>
  );
}
