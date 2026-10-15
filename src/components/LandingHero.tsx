"use client";

import styles from "./LandingHero.module.css";
import TocTieLogo from "@/components/TocTieLogo";

interface Props {
  onOpenAuth: () => void;
}

export default function LandingHero({ onOpenAuth }: Props) {
  return (
    <div className={styles.page}>
      {/* Decorative stripe background */}
      <div className={styles.stripeBg} aria-hidden="true" />

      {/* Header */}
      <header className={styles.header}>
        <TocTieLogo size={48} />
        <a
          href="https://www.facebook.com/toc.tie26"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.fbLink}
          aria-label="Trang Facebook tóc.tie"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </a>
      </header>

      {/* Hero content */}
      <section className={styles.hero}>
        {/* Left: Text */}
        <div className={styles.heroText}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Chương trình 20/10 đặc biệt
          </div>

          <h1 className={styles.headline}>
            Mảnh ghép
            <br />
            <em className={styles.headlineAccent}>hạnh phúc</em>
            <br />
            của bạn 🎀
          </h1>

          <p className={styles.subtext}>
            Mỗi sản phẩm <strong>tóc.tie</strong> bạn mua mang đến một mảnh ghép bí ẩn.
            Thu thập đủ <strong>4 mảnh</strong> để mở ra phần thưởng đặc biệt — một món quà
            hoàn hảo dành tặng người con gái bạn yêu thương.
          </p>

          {/* How it works - compact */}
          <div className={styles.steps}>
            {[
              { icon: "🛍️", label: "Mua sản phẩm", desc: "và nhận mã dự thưởng" },
              { icon: "🔑", label: "Nhập mã", desc: "mở ngẫu nhiên 1 mảnh ghép" },
              { icon: "🎁", label: "Đủ 4 mảnh", desc: "nhận phần thưởng bất ngờ" },
            ].map((step, i) => (
              <div key={i} className={styles.step}>
                <span className={styles.stepIcon}>{step.icon}</span>
                <div>
                  <div className={styles.stepLabel}>{step.label}</div>
                  <div className={styles.stepDesc}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            className={`btn btn-primary btn-lg ${styles.cta}`}
            onClick={onOpenAuth}
            id="cta-start"
          >
            Bắt đầu thu thập ngay
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <p className={styles.ctaNote}>
            Miễn phí tham gia · Không cần tài khoản mạng xã hội
          </p>
        </div>

        {/* Right: Puzzle preview illustration */}
        <div className={styles.heroVisual}>
          <div className={styles.puzzlePreview}>
            {/* Puzzle grid - teaser */}
            <div className={styles.previewGrid}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={styles.previewPiece}>
                  <div className={styles.previewPieceLocked}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.previewLabel}>
              <span>tóc.tie</span>
              <span className={styles.previewSub}>tie your happiness</span>
            </div>
          </div>

          {/* Floating decorative elements */}
          <div className={styles.floatBow} aria-hidden="true">🎀</div>
          <div className={styles.floatStar1} aria-hidden="true">✦</div>
          <div className={styles.floatStar2} aria-hidden="true">✦</div>
          <div className={styles.floatHeart} aria-hidden="true">💙</div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className={styles.footer}>
        <p>
          © 2024 <strong>tóc.tie</strong> — Tiệm phụ kiện xinh cho mái tóc
          &nbsp;·&nbsp;
          <a href="https://www.facebook.com/toc.tie26" target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
          &nbsp;·&nbsp;
          <a href="https://instagram.com/toc.tie26" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </p>
      </footer>
    </div>
  );
}
