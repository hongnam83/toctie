"use client";

import { useState } from "react";
import styles from "./PuzzleDashboard.module.css";
import TocTieLogo from "@/components/TocTieLogo";
import PuzzleGrid from "@/components/PuzzleGrid";
import type { UserSession } from "@/app/page";

interface Props {
  user: UserSession;
  newlyRevealedPiece: number | null;
  onPieceUnlocked: (piece: number, updatedUser: UserSession) => void;
  onLogout: () => void;
  onShowWin: () => void;
}

export default function PuzzleDashboard({
  user,
  newlyRevealedPiece,
  onPieceUnlocked,
  onLogout,
  onShowWin,
}: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showDemoBanner, setShowDemoBanner] = useState(true);

  const pieceCount = user.unlockedPieces.length;
  const isComplete = pieceCount === 4;

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Vui lòng nhập mã dự thưởng.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đã có lỗi xảy ra. Vui lòng thử lại.");
        return;
      }

      setCode("");
      setSuccessMsg(data.message);

      // Build updated user state
      const updatedUser: UserSession = {
        ...user,
        unlockedPieces: data.unlockedPieces,
        redeemedCodes: [...user.redeemedCodes, code.trim().toUpperCase()],
      };

      onPieceUnlocked(data.newPiece, updatedUser);

      // Clear success message after 5 sec
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch {
      setError("Không thể kết nối server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Stripe background */}
      <div className={styles.stripeBg} aria-hidden="true" />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <TocTieLogo size={44} />
          <div>
            <div className={styles.brandName}>tóc.tie</div>
            <div className={styles.slogan}>tie your happiness</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className={styles.userName}>{user.fullName}</div>
              <div className={styles.userProgress}>
                {pieceCount}/4 mảnh ghép
              </div>
            </div>
          </div>
          <button
            className={`btn btn-secondary ${styles.logoutBtn}`}
            onClick={onLogout}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Đăng xuất
          </button>
          <a
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-secondary ${styles.logoutBtn}`}
            title="Trang quản trị"
          >
            ⚙️
          </a>
        </div>
      </header>

      {/* Demo Banner */}
      {showDemoBanner && (
        <div className={styles.demoBanner}>
          <div className={styles.demoBannerContent}>
            <span className={styles.demoBannerIcon}>🎟️</span>
            <span className={styles.demoBannerText}>
              <strong>Demo:</strong> Dùng các mã này để thử —{" "}
              {["TOCTIE-2010-AAAA", "TOCTIE-2010-BBBB", "TOCTIE-2010-CCCC", "TOCTIE-2010-DDDD"].map((c) => (
                <code
                  key={c}
                  className={styles.demoBannerCode}
                  onClick={() => setCode(c)}
                  title="Bấm để điền tự động"
                >
                  {c}
                </code>
              ))}
            </span>
          </div>
          <button
            className={styles.demoBannerClose}
            onClick={() => setShowDemoBanner(false)}
            aria-label="Đóng banner demo"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main content */}
      <main className={styles.main}>
        {/* Left: Code input + info */}
        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <h2 className={styles.sideTitle}>
              <span className={styles.sideTitleIcon}>🔑</span>
              Nhập mã dự thưởng
            </h2>
            <p className={styles.sideDesc}>
              Mỗi sản phẩm <strong>tóc.tie</strong> kèm theo một mã độc quyền.
              Nhập mã để mở ngẫu nhiên một mảnh ghép mới!
            </p>

            <form onSubmit={handleRedeem} className={styles.codeForm}>
              <div className="input-group">
                <label className="input-label" htmlFor="redeem-code">
                  Mã dự thưởng
                </label>
                <input
                  id="redeem-code"
                  type="text"
                  className={`input-field ${error ? "error" : ""}`}
                  placeholder="VD: TOCTIE-2010-XXXX"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
                  disabled={loading || isComplete}
                  maxLength={20}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {error && (
                <div className="message message-error" role="alert">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="message message-success" role="status">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
                  </svg>
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                className={`btn btn-primary w-full`}
                disabled={loading || isComplete}
                id="submit-code"
              >
                {loading ? (
                  <><span className="spinner" />Đang xác thực...</>
                ) : isComplete ? (
                  <>🎉 Đã đủ 4 mảnh ghép!</>
                ) : (
                  <>Mở mảnh ghép<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg></>
                )}
              </button>
            </form>

            {/* Progress indicator */}
            <div className={styles.progressBox}>
              <div className={styles.progressHeader}>
                <span>Tiến trình thu thập</span>
                <span className={styles.progressCount}>{pieceCount} / 4</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(pieceCount / 4) * 100}%` }}
                />
              </div>
              <div className={styles.progressDots}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`${styles.progressDot} ${i < pieceCount ? styles.progressDotFilled : ""}`}
                  />
                ))}
              </div>
              <p className={styles.progressNote}>
                {pieceCount === 0 && "Nhập mã đầu tiên để bắt đầu! 🎀"}
                {pieceCount === 1 && "Tuyệt! Còn 3 mảnh nữa thôi ✨"}
                {pieceCount === 2 && "Đã đi được nửa chặng đường rồi! 💙"}
                {pieceCount === 3 && "Chỉ còn 1 mảnh cuối cùng! 🔥"}
                {pieceCount === 4 && "🎉 Hoàn thành! Phần thưởng đang chờ bạn!"}
              </p>
            </div>

            {isComplete && (
              <button
                className={`btn btn-pink w-full ${styles.winBtn}`}
                onClick={onShowWin}
                type="button"
                id="show-reward"
              >
                🎁 Nhận phần thưởng ngay!
              </button>
            )}

            {/* How to get codes */}
            <div className={styles.howToBox}>
              <div className={styles.howToTitle}>Cách nhận mã?</div>
              <ul className={styles.howToList}>
                <li>🛍️ Mua sản phẩm tại cửa hàng tóc.tie</li>
                <li>📦 Mã in bên trong hộp sản phẩm</li>
                <li>📱 Mỗi mã chỉ dùng được <strong>một lần</strong></li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Right: Puzzle grid */}
        <section className={styles.puzzleSection}>
          <div className={styles.puzzleHeader}>
            <h1 className={styles.puzzleTitle}>Bộ sưu tập của bạn</h1>
            <p className={styles.puzzleSubtitle}>
              Thu thập đủ 4 mảnh để khám phá bất ngờ dành cho người đặc biệt 💙
            </p>
          </div>

          <PuzzleGrid
            unlockedPieces={user.unlockedPieces}
            newlyRevealedPiece={newlyRevealedPiece}
          />

          <div className={styles.pieceLabels}>
            <span className={styles.pieceLabel}>Góc 1</span>
            <span className={styles.pieceLabel}>Góc 2</span>
            <span className={styles.pieceLabel}>Góc 3</span>
            <span className={styles.pieceLabel}>Góc 4</span>
          </div>

          {/* Redeemed codes history */}
          {user.redeemedCodes.length > 0 && (
            <div className={styles.codeHistory}>
              <div className={styles.codeHistoryTitle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 12 11 14 15 10" /><circle cx="12" cy="12" r="10" />
                </svg>
                Mã đã sử dụng ({user.redeemedCodes.length})
              </div>
              <div className={styles.codeList}>
                {user.redeemedCodes.map((c) => (
                  <span key={c} className={styles.codeTag}>{c}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
