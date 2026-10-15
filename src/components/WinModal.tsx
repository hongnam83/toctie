"use client";

import { useEffect, useRef } from "react";
import styles from "./WinModal.module.css";
import TocTieLogo from "@/components/TocTieLogo";
import type { UserSession } from "@/app/page";

interface Props {
  user: UserSession;
  onClose: () => void;
}

const CONFETTI_COLORS = [
  "#1E2D6B", "#B8CCE4", "#F4C5D3", "#FFF3C4", "#2D3A8C", "#FAE0E8",
];

function launchConfetti() {
  const pieces = 80;
  for (let i = 0; i < pieces; i++) {
    const el = document.createElement("div");
    el.className = "confetti-particle";

    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const size = 6 + Math.random() * 10;
    const left = Math.random() * 100;
    const duration = 2.5 + Math.random() * 2;
    const delay = Math.random() * 1.5;

    el.style.cssText = `
      background: ${color};
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      top: -20px;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
    `;

    document.body.appendChild(el);
    setTimeout(() => el.remove(), (duration + delay) * 1000 + 500);
  }
}

export default function WinModal({ user, onClose }: Props) {
  const hasLaunched = useRef(false);

  useEffect(() => {
    if (!hasLaunched.current) {
      hasLaunched.current = true;
      launchConfetti();
      // Second wave
      setTimeout(launchConfetti, 1000);
    }
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Chúc mừng bạn!"
      onClick={handleOverlayClick}
    >
      <div className={styles.modal}>
        {/* Decorative top */}
        <div className={styles.topBanner}>
          <div className={styles.confettiBar} aria-hidden="true">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={styles.confettiDot} style={{
                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
          </div>
          <div className={styles.bigEmoji}>🎉</div>
        </div>

        <div className={styles.content}>
          {/* Logo */}
          <TocTieLogo size={72} />

          <h2 className={styles.congratsTitle}>
            Chúc mừng, {user.fullName}!
          </h2>

          <p className={styles.congratsText}>
            Bạn đã thu thập đủ <strong>4 mảnh ghép</strong> và hoàn thành
            bộ sưu tập <strong>tóc.tie</strong>. Phần thưởng bí ẩn đang chờ bạn!
          </p>

          {/* Prize teaser */}
          <div className={styles.prizeBox}>
            <div className={styles.prizeIcon}>🎁</div>
            <div className={styles.prizeContent}>
              <div className={styles.prizeTitle}>Phần thưởng của bạn</div>
              <div className={styles.prizeDesc}>
                Liên hệ <strong>tóc.tie</strong> qua Facebook để nhận phần thưởng.
                Xuất trình màn hình này hoặc chụp ảnh lại nhé!
              </div>
            </div>
          </div>

          {/* Puzzle complete receipt */}
          <div className={styles.receipt}>
            <div className={styles.receiptRow}>
              <span>Người tham gia</span>
              <strong>{user.fullName}</strong>
            </div>
            <div className={styles.receiptRow}>
              <span>Tổng mã đã dùng</span>
              <strong>{user.redeemedCodes.length} mã</strong>
            </div>
            <div className={styles.receiptRow}>
              <span>Trạng thái</span>
              <span className={styles.receiptBadge}>✅ Hoàn thành</span>
            </div>
          </div>

          <div className={styles.actions}>
            <a
              href="https://www.facebook.com/toc.tie26"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg"
              id="win-contact-fb"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Nhận thưởng qua Facebook
            </a>
            <button
              className="btn btn-secondary"
              onClick={onClose}
              type="button"
              id="win-close"
            >
              Đóng
            </button>
          </div>

          <p className={styles.footerNote}>
            🎀 tie your happiness — tóc.tie
          </p>
        </div>
      </div>
    </div>
  );
}
