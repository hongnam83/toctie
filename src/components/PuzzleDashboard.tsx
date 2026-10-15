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
      setError("Vui lòng nhập mã dự thưởng của bạn.");
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
        setError(data.error || "Đã có lỗi xảy ra. Vui lòng kiểm tra lại mã.");
        return;
      }

      setCode("");
      setSuccessMsg(data.message || "Mở mảnh ghép thành công!");

      // Build updated user state
      const updatedUser: UserSession = {
        ...user,
        unlockedPieces: data.unlockedPieces,
        redeemedCodes: [...user.redeemedCodes, code.trim().toUpperCase()],
      };

      onPieceUnlocked(data.newPiece, updatedUser);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Background stripes */}
      <div className={styles.stripeBg} aria-hidden="true" />

      {/* ── Top Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <TocTieLogo size={46} />
          <div className={styles.brandTitleBox}>
            <div className={styles.brandName}>tóc.tie</div>
            <div className={styles.slogan}>tie your happiness</div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userText}>
              <div className={styles.userName}>{user.fullName}</div>
              <div className={styles.userProgress}>
                Tiến trình: <strong>{pieceCount}/4 mảnh</strong>
              </div>
            </div>
          </div>

          <a
            href="https://www.facebook.com/toc.tie26"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.fbHeaderBtn}
            title="Fanpage Facebook tóc.tie"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Fanpage</span>
          </a>

          <button
            className={`btn btn-secondary ${styles.logoutBtn}`}
            onClick={onLogout}
            type="button"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Đăng xuất</span>
          </button>

          <a
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-secondary ${styles.adminIconBtn}`}
            title="Trang quản trị (Admin)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </a>
        </div>
      </header>

      {/* ── Demo Testing Banner ── */}
      {showDemoBanner && (
        <div className={styles.demoBanner}>
          <div className={styles.demoBannerContent}>
            <span className={styles.demoBadgeText}>DEMO:</span>
            <span className={styles.demoBannerText}>
              Bấm vào một mã thử nghiệm để tự động điền —{" "}
              {["TOCTIE-2010-AAAA", "TOCTIE-2010-BBBB", "TOCTIE-2010-CCCC", "TOCTIE-2010-DDDD"].map((c) => (
                <code
                  key={c}
                  className={styles.demoBannerCode}
                  onClick={() => setCode(c)}
                  title="Bấm để điền mã này vào ô nhập"
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
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Main Dashboard Workspace ── */}
      <main className={styles.main}>
        {/* Left Column: Code Input & Progress Card */}
        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <div className={styles.sideTitle}>
                <span className={styles.sideTitleIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="7.5" cy="15.5" r="4.5" />
                    <path d="m21 2-9.6 9.6M15.5 7.5l3 3M18.5 4.5l3 3" />
                  </svg>
                </span>
                <span>Nhập mã dự thưởng</span>
              </div>
              <span className={styles.sideBadge}>1 mã / 1 mảnh</span>
            </div>

            <p className={styles.sideDesc}>
              Mỗi sản phẩm phụ kiện <strong>tóc.tie</strong> bạn mua kèm theo một mã dự thưởng độc quyền.
              Nhập mã vào ô dưới để mở ngẫu nhiên một góc còn khóa.
            </p>

            <form onSubmit={handleRedeem} className={styles.codeForm} noValidate>
              <div className="input-group">
                <label className="input-label" htmlFor="redeem-code">
                  Mã dự thưởng của bạn
                </label>
                <input
                  id="redeem-code"
                  type="text"
                  className={`input-field ${error ? "error" : ""}`}
                  placeholder="Ví dụ: TOCTIE-2010-XXXX"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError("");
                  }}
                  disabled={loading || isComplete}
                  maxLength={24}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {error && (
                <div className="message message-error" role="alert">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="message message-success" role="status">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className={`btn btn-primary w-full ${styles.submitBtn}`}
                disabled={loading || isComplete}
                id="submit-code"
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Đang xác thực...
                  </>
                ) : isComplete ? (
                  <>Đã hoàn thành 4/4 mảnh ghép</>
                ) : (
                  <>
                    <span>Mở mảnh ghép</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Progress Card */}
            <div className={styles.progressBox}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>Tiến trình bộ sưu tập</span>
                <span className={styles.progressCount}>{pieceCount} / 4 mảnh</span>
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
                    title={`Mảnh ${i + 1}: ${i < pieceCount ? "Đã mở" : "Chưa mở"}`}
                  />
                ))}
              </div>

              <p className={styles.progressNote}>
                {pieceCount === 0 && "Nhập mã dự thưởng để mở mảnh ghép đầu tiên của bạn."}
                {pieceCount === 1 && "Khởi đầu tuyệt vời! Còn 3 mảnh ghép để hoàn tất bức tranh."}
                {pieceCount === 2 && "Đã hoàn thành 50% chặng đường! Tiếp tục khám phá nhé."}
                {pieceCount === 3 && "Chỉ còn 1 mảnh ghép cuối cùng để nhận quà!"}
                {pieceCount === 4 && "Bức tranh đã hoàn chỉnh! Hãy nhận phần quà 20/10 của bạn."}
              </p>
            </div>

            {/* When Complete: Big Win Button */}
            {isComplete && (
              <button
                className={`btn btn-pink w-full ${styles.winBtn}`}
                onClick={onShowWin}
                type="button"
                id="show-reward"
              >
                Nhận phần thưởng 20/10 ngay ➔
              </button>
            )}

            {/* How-to guide box */}
            <div className={styles.howToBox}>
              <div className={styles.howToTitle}>
                Bạn cần hỗ trợ lấy mã?
              </div>
              <ul className={styles.howToList}>
                <li>Mua bất kỳ set quà hoặc sản phẩm tại tiệm tóc.tie</li>
                <li>Mã dự thưởng in trên tem hoặc thiệp trong hộp quà</li>
                <li>Mỗi mã chỉ có giá trị sử dụng <strong>duy nhất một lần</strong></li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Right Column: Puzzle Board */}
        <section className={styles.puzzleSection}>
          <div className={styles.puzzleHeader}>
            <div className={styles.puzzleBadge}>Bộ sưu tập 20/10 · tóc.tie</div>
            <h1 className={styles.puzzleTitle}>Bức Tranh Hạnh Phúc Của Bạn</h1>
            <p className={styles.puzzleSubtitle}>
              Mỗi mảnh ghép đại diện cho một phụ kiện xinh xắn và sự nâng niu dành cho mái tóc nàng.
            </p>
          </div>

          {/* Upgraded Interlocking Puzzle Grid */}
          <PuzzleGrid
            unlockedPieces={user.unlockedPieces}
            newlyRevealedPiece={newlyRevealedPiece}
          />

          {/* Redeemed Codes History */}
          {user.redeemedCodes.length > 0 && (
            <div className={styles.codeHistory}>
              <div className={styles.codeHistoryTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 12 11 14 15 10" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span>Mã dự thưởng đã dùng ({user.redeemedCodes.length})</span>
              </div>
              <div className={styles.codeList}>
                {user.redeemedCodes.map((c) => (
                  <span key={c} className={styles.codeTag}>
                    <span className={styles.codeTagCheck}>✓</span> {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
