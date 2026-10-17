"use client";

import { useState } from "react";
import styles from "./LandingHero.module.css";
import TocTieLogo from "@/components/TocTieLogo";

interface Props {
  onOpenAuth: () => void;
}

const FAQ_ITEMS = [
  {
    q: "Làm thế nào để tôi nhận được mã dự thưởng?",
    a: "Khi mua bất kỳ set quà tặng hoặc sản phẩm phụ kiện nào tại tóc.tie trong dịp 20/10, bạn sẽ nhận được một mã dự thưởng độc quyền in bên trong hộp hoặc gửi kèm thiệp đơn hàng.",
  },
  {
    q: "Mỗi mã dự thưởng sử dụng được bao nhiêu lần?",
    a: "Mỗi mã chỉ có thể sử dụng duy nhất một lần. Sau khi hệ thống xác thực thành công và mở một mảnh ghép, mã đó sẽ được lưu trạng thái đã dùng trên server.",
  },
  {
    q: "Các mảnh ghép có bị mở trùng góc đã có không?",
    a: "Hoàn toàn không! Thuật toán của tóc.tie luôn chọn ngẫu nhiên một trong những vị trí góc còn đang khóa, đảm bảo 4 mã hợp lệ sẽ giúp bạn mở trọn vẹn 4/4 mảnh ghép.",
  },
  {
    q: "Tôi có cần tài khoản mạng xã hội hay mật khẩu phức tạp không?",
    a: "Không cần! Bạn chỉ cần đặt một tên tài khoản riêng ngắn gọn (nickname, tên thân mật hoặc số điện thoại) để hệ thống lưu giữ các mảnh ghép bạn đã thu thập.",
  },
  {
    q: "Khi gom đủ 4/4 mảnh ghép, tôi nhận quà bằng cách nào?",
    a: "Khi hoàn thành đủ 4 mảnh ghép, hệ thống sẽ mở khóa thông báo chúc mừng. Bạn chỉ cần chụp màn hình hoặc liên hệ trực tiếp với fanpage tóc.tie để đội ngũ gửi quà tặng tri ân đến bạn!",
  },
];

export default function LandingHero({ onOpenAuth }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className={styles.page}>
      {/* Background delicate stripes */}
      <div className={styles.stripeBg} aria-hidden="true" />

      {/* ── Top Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <TocTieLogo size={48} />
          <div className={styles.brandTitleBox}>
            <span className={styles.brandName}>tóc.tie</span>
            <span className={styles.slogan}>tie your happiness</span>
          </div>
        </div>

        <nav className={styles.headerNav}>
          <a
            href="https://www.facebook.com/toc.tie26"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            aria-label="Fanpage Facebook tóc.tie"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </a>
          <button
            className={`btn btn-primary btn-sm ${styles.headerCta}`}
            onClick={onOpenAuth}
            id="nav-start-btn"
          >
            <span>Nhập mã ngay</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.headerCtaArrow} aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </nav>
      </header>

      {/* ── Hero Section ── */}
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          {/* Left Column: Headlines & Call to Action */}
          <div className={styles.heroContent}>
            <h1 className={styles.mainHeadline}>
              Mảnh ghép
              <br />
              <span className={styles.headlineAccent}>hạnh phúc</span>
              <br />
              của bạn
            </h1>

            <p className={styles.heroDescription}>
              Mỗi sản phẩm phụ kiện xinh xắn từ <strong>tóc.tie</strong> gửi gắm một mảnh ghép bí ẩn.
              Thu thập đủ <strong>4 mảnh ghép</strong> để mở trọn bức tranh và nhận món quà tri ân đặc biệt
              dành tặng người phụ nữ bạn yêu thương nhất dịp 20/10 này.
            </p>

            {/* Quick 3-step pills preview */}
            <div className={styles.miniStepsList}>
              <div className={styles.miniStepItem}>
                <span className={styles.miniStepNum}>01</span>
                <span>Mua set quà</span>
              </div>
              <span className={styles.miniStepDivider}>➔</span>
              <div className={styles.miniStepItem}>
                <span className={styles.miniStepNum}>02</span>
                <span>Nhập mã mở góc</span>
              </div>
              <span className={styles.miniStepDivider}>➔</span>
              <div className={styles.miniStepItem}>
                <span className={styles.miniStepNum}>03</span>
                <span>Nhận quà tri ân</span>
              </div>
            </div>

            {/* Main Action Area */}
            <div className={styles.ctaGroup}>
              <button
                className={`btn btn-primary btn-lg ${styles.mainCtaBtn}`}
                onClick={onOpenAuth}
                id="cta-start"
              >
                <span>Bắt đầu thu thập ngay</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className={styles.ctaAssurance}>
                <span className={styles.checkIcon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>Miễn phí tham gia</span>
                <span className={styles.dotSeparator}>·</span>
                <span>Mỗi mã mở đúng 1 góc không trùng</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interlocking Puzzle Box Teaser */}
          <div className={styles.heroVisualCol}>
            <div className={styles.puzzleTeaserCard}>
              {/* Badge top of board */}
              <div className={styles.teaserHeader}>
                <div className={styles.teaserBadge}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                  <span>Bộ tranh 4 mảnh ghép</span>
                </div>
                <span className={styles.teaserBrand}>tóc.tie</span>
              </div>

              {/* 2x2 preview of the authentic puzzle */}
              <div className={styles.teaserGrid}>
                {/* Piece 0 */}
                <div className={`${styles.teaserPiece} ${styles.teaserPiece0}`}>
                  <div className={styles.pieceTeaserContent}>
                    <div className={styles.pieceIconSvgBox}>
                      {/* Bespoke Scrunchie SVG */}
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <circle cx="20" cy="20" r="14" stroke="#1E2D6B" strokeWidth="2.5" fill="#F4C5D3" />
                        <circle cx="20" cy="20" r="6" stroke="#1E2D6B" strokeWidth="2" fill="#FAF6EE" />
                        <path d="M14 8C17 11 23 11 26 8M32 14C29 17 29 23 32 26M26 32C23 29 17 29 14 32M8 26C11 23 11 17 8 14" stroke="#1E2D6B" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className={styles.pieceLockBadge}>Góc 01</span>
                  </div>
                </div>

                {/* Piece 1 */}
                <div className={`${styles.teaserPiece} ${styles.teaserPiece1}`}>
                  <div className={styles.pieceTeaserContent}>
                    <div className={styles.pieceIconSvgBox}>
                      {/* Bespoke Pocket Mirror SVG */}
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <circle cx="20" cy="18" r="11" stroke="#1E2D6B" strokeWidth="2.5" fill="#B8CCE4" />
                        <circle cx="20" cy="18" r="7.5" fill="#FAF6EE" stroke="#1E2D6B" strokeWidth="1.5" />
                        <path d="M20 29L20 36M17 36H23" stroke="#1E2D6B" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M17 15L23 21" stroke="#1E2D6B" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
                      </svg>
                    </div>
                    <span className={styles.pieceLockBadge}>Góc 02</span>
                  </div>
                </div>

                {/* Piece 2 */}
                <div className={`${styles.teaserPiece} ${styles.teaserPiece2}`}>
                  <div className={styles.pieceTeaserContent}>
                    <div className={styles.pieceIconSvgBox}>
                      {/* Bespoke Radiant Star SVG */}
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <path
                          d="M20 4L22.5 15L33.5 17.5L22.5 20L20 31L17.5 20L6.5 17.5L17.5 15Z"
                          fill="#FFE066"
                          stroke="#1E2D6B"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />
                        <circle cx="20" cy="17.5" r="3" fill="#FAF6EE" stroke="#1E2D6B" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <span className={styles.pieceLockBadge}>Góc 03</span>
                  </div>
                </div>

                {/* Piece 3 */}
                <div className={`${styles.teaserPiece} ${styles.teaserPiece3}`}>
                  <div className={styles.pieceTeaserContent}>
                    <div className={styles.pieceIconSvgBox}>
                      {/* Bespoke Gift Box SVG */}
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <rect x="9" y="15" width="22" height="18" rx="3" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="2.5" />
                        <rect x="7" y="11" width="26" height="5" rx="1.5" fill="#FFE066" stroke="#1E2D6B" strokeWidth="2" />
                        <line x1="20" y1="11" x2="20" y2="33" stroke="#1E2D6B" strokeWidth="2" />
                        <path d="M20 11C18 7 13 7 15 11ZM20 11C22 7 27 7 25 11Z" fill="#FAF6EE" stroke="#1E2D6B" strokeWidth="2" />
                      </svg>
                    </div>
                    <span className={styles.pieceLockBadge}>Góc 04</span>
                  </div>
                </div>

                {/* Interlocking center knot */}
                <div className={styles.teaserCenterKnot} aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#FAF6EE" stroke="#1E2D6B" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3.5" fill="#1E2D6B" />
                    <path d="M12 2C8 6 8 8 12 12C16 16 16 18 12 22" stroke="#1E2D6B" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Footer teaser label */}
              <div className={styles.teaserFooter}>
                <div className={styles.teaserFooterText}>
                  <strong>tie your happiness</strong>
                  <span>Mỗi góc tranh là một thông điệp yêu thương</span>
                </div>
                <button
                  className={styles.teaserUnlockBtn}
                  onClick={onOpenAuth}
                  type="button"
                >
                  <span>Mở khóa ngay</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Floating decorative vector elements */}
            <div className={styles.floatStickerBow} aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                <path d="M24 24C16 12 6 18 14 26C20 32 24 24 24 24Z" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="2.5" />
                <path d="M24 24C32 12 42 18 34 26C28 32 24 24 24 24Z" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="2.5" />
                <circle cx="24" cy="24" r="5" fill="#1E2D6B" />
                <path d="M21 28C19 36 15 42 12 44M27 28C29 36 33 42 36 44" stroke="#1E2D6B" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.floatStickerStar1} aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8Z" fill="#FFE066" stroke="#1E2D6B" strokeWidth="1.5" />
              </svg>
            </div>
            <div className={styles.floatStickerStar2} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8" stroke="#B8CCE4" strokeWidth="2.5" strokeDasharray="3 3" />
              </svg>
            </div>
            <div className={styles.floatStickerHeart} aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#B8CCE4" stroke="#1E2D6B" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section A: Hành Trình 4 Mảnh Ghép ── */}
      <section className={styles.journeySection}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeadingBox}>
            <span className={styles.sectionPill}>Quy trình đơn giản</span>
            <h2 className={styles.sectionTitle}>Hành trình 4 mảnh ghép</h2>
            <p className={styles.sectionSubtitle}>
              Chỉ với 3 bước chạm, bạn sẽ hoàn thiện bức tranh quà tặng bí mật cùng tóc.tie
            </p>
          </div>

          <div className={styles.journeyGrid}>
            {/* Step 01 */}
            <div className={styles.journeyCard}>
              <div className={styles.journeyHeaderRow}>
                <span className={styles.journeyStepNumber}>01</span>
                <div className={styles.journeyIconBox}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E2D6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
              </div>
              <h3 className={styles.journeyCardTitle}>01 — Chọn sản phẩm</h3>
              <p className={styles.journeyCardDesc}>
                Mua sản phẩm tóc.tie và nhận mã dự thưởng độc quyền in kèm thiệp hoặc trên hộp quà dịp 20/10.
              </p>
              <div className={styles.journeyTag}>
                <span>Nhận mã dự thưởng</span>
              </div>
            </div>

            {/* Step 02 */}
            <div className={styles.journeyCard}>
              <div className={styles.journeyHeaderRow}>
                <span className={styles.journeyStepNumber}>02</span>
                <div className={styles.journeyIconBox}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E2D6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="15" r="4" />
                    <path d="M10.85 12.15L19 4M18 5l2 2M15 8l2 2" />
                  </svg>
                </div>
              </div>
              <h3 className={styles.journeyCardTitle}>02 — Khám phá mảnh ghép</h3>
              <p className={styles.journeyCardDesc}>
                Nhập mã để mở khóa một mảnh ghép bí ẩn. Hệ thống tự động chọn ngẫu nhiên một góc chưa mở, không bị trùng.
              </p>
              <div className={styles.journeyTag}>
                <span>Mở góc ngẫu nhiên</span>
              </div>
            </div>

            {/* Step 03 */}
            <div className={styles.journeyCard}>
              <div className={styles.journeyHeaderRow}>
                <span className={styles.journeyStepNumber}>03</span>
                <div className={styles.journeyIconBox}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E2D6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="8" width="18" height="13" rx="2" />
                    <path d="M12 8v13M3 13h18M7.5 8a2.5 2.5 0 0 1 0-5A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
                  </svg>
                </div>
              </div>
              <h3 className={styles.journeyCardTitle}>03 — Hoàn thành bộ sưu tập</h3>
              <p className={styles.journeyCardDesc}>
                Thu thập đủ 4 mảnh để khám phá phần thưởng đặc biệt từ tóc.tie và lưu giữ kỷ niệm cho người thương.
              </p>
              <div className={styles.journeyTag}>
                <span>Mở trọn vẹn quà tặng</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section B: Món Quà Đang Chờ Được Bật Mí ── */}
      <section className={styles.mysterySection}>
        <div className={styles.sectionContainer}>
          <div className={styles.mysteryCard}>
            <div className={styles.mysteryVisual}>
              <div className={styles.giftBoxIllustration}>
                {/* Handcrafted Gift Box SVG */}
                <svg width="220" height="220" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="giftGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFF3C4" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#F5EFE0" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <circle cx="100" cy="100" r="90" fill="url(#giftGlow)" />
                  {/* Kraft gift box */}
                  <rect x="45" y="75" width="110" height="85" rx="10" fill="#FAF6EE" stroke="#1E2D6B" strokeWidth="3" />
                  <rect x="40" y="60" width="120" height="24" rx="8" fill="#F5EFE0" stroke="#1E2D6B" strokeWidth="3" />
                  {/* Ribbon wrap */}
                  <rect x="90" y="60" width="20" height="100" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="2" />
                  {/* Fluffy ribbon bow */}
                  <g transform="translate(100, 60)">
                    <path d="M0,0 C-35,-30 -48,0 -12,4 Z" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="2.5" />
                    <path d="M0,0 C35,-30 48,0 12,4 Z" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="2.5" />
                    <circle cx="0" cy="0" r="8" fill="#1E2D6B" />
                    <path d="M-3,4 Q-18,24 -22,34" stroke="#1E2D6B" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M3,4 Q18,24 22,34" stroke="#1E2D6B" strokeWidth="2.5" strokeLinecap="round" />
                  </g>
                  {/* Geometric sparkles */}
                  <path d="M30,45 L33,52 L40,54 L33,56 L30,63 L27,56 L20,54 L27,52 Z" fill="#FFE066" stroke="#1E2D6B" strokeWidth="1" />
                  <path d="M165,130 L167,135 L172,136 L167,137 L165,142 L163,137 L158,136 L163,135 Z" fill="#FFE066" stroke="#1E2D6B" strokeWidth="1" />
                  <circle cx="160" cy="50" r="5" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            <div className={styles.mysteryContent}>
              <span className={styles.mysteryBadge}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}>
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
                Bí mật ngày 20/10
              </span>
              <h2 className={styles.mysteryTitle}>Món quà đang chờ được bật mí</h2>
              <p className={styles.mysteryDesc}>
                Phía sau 4 mảnh ghép là phần thưởng đặc biệt được đội ngũ <strong>tóc.tie</strong> chuẩn bị riêng
                cho dịp Ngày Phụ nữ Việt Nam 20/10. Dù là chiếc scrunchie lụa dịu êm hay set quà xinh xắn,
                mỗi phần quà đều được gửi gắm lời chúc hạnh phúc trọn vẹn nhất.
              </p>
              <div className={styles.mysteryHighlights}>
                <div className={styles.mysteryPoint}>
                  <div className={styles.mysteryPointIconBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E2D6B" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="8" width="18" height="13" rx="2" />
                      <path d="M12 8v13M3 13h18M7.5 8a2.5 2.5 0 0 1 0-5A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
                    </svg>
                  </div>
                  <div>
                    <strong>Quà tặng giới hạn</strong>
                    <p>Dành riêng cho khách hàng hoàn tất 4 mảnh</p>
                  </div>
                </div>
                <div className={styles.mysteryPoint}>
                  <div className={styles.mysteryPointIconBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E2D6B" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div>
                    <strong>Thiệp chúc ý nghĩa</strong>
                    <p>Kèm lời nhắn gửi yêu thương đến người nhận</p>
                  </div>
                </div>
              </div>
              <button
                className={`btn btn-primary ${styles.mysteryCta}`}
                onClick={onOpenAuth}
              >
                <span>Nhập mã để khám phá ngay</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section C: Về tóc.tie & Món Quà Cho Người Thương ── */}
      <section className={styles.brandStorySection}>
        <div className={styles.sectionContainer}>
          <div className={styles.storyGrid}>
            <div className={styles.storyTextCol}>
              <span className={styles.sectionPill}>Câu chuyện thương hiệu</span>
              <h2 className={styles.storyTitle}>
                tóc.tie và món quà dành cho người thương
              </h2>
              <p className={styles.storyParagraph}>
                Xuất phát từ một dự án khởi nghiệp nhỏ của các bạn sinh viên Đại học Kinh tế Quốc dân (NEU),
                <strong> tóc.tie</strong> mong muốn mang đến những món phụ kiện tóc tinh tế, mềm mại và đáng yêu nhất.
              </p>
              <p className={styles.storyParagraph}>
                Chúng mình tin rằng, một chiếc nơ xinh hay chiếc scrunchie bồng bềnh không chỉ giúp mái tóc gọn gàng,
                mà còn là sợi dây thắt chặt niềm vui, sự tự tin và nụ cười rạng rỡ của người con gái bạn yêu mến.
              </p>

              <div className={styles.valuesList}>
                <div className={styles.valueItem}>
                  <div className={styles.valueIconBox}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E2D6B" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 3a9 9 0 0 0 0 18" fill="#F4C5D3" />
                      <path d="M12 7c2 2 3 4 3 5s-1 3-3 3" />
                    </svg>
                  </div>
                  <div>
                    <strong>Chất liệu êm ái cho mái tóc</strong>
                    <p>Lụa mềm, voan cao cấp, không làm gãy rụng tóc nàng</p>
                  </div>
                </div>
                <div className={styles.valueItem}>
                  <div className={styles.valueIconBox}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E2D6B" strokeWidth="2" strokeLinecap="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <div>
                    <strong>Đóng gói tỉ mỉ & chỉn chu</strong>
                    <p>Hộp quà kraft, rơm lót hoa và thiệp viết tay xinh xắn</p>
                  </div>
                </div>
                <div className={styles.valueItem}>
                  <div className={styles.valueIconBox}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E2D6B" strokeWidth="2" strokeLinecap="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </div>
                  <div>
                    <strong>tie your happiness</strong>
                    <p>Buộc lại niềm vui và sự ân cần trong từng khoảnh khắc</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Story Visual Badge Frame */}
            <div className={styles.storyVisualCol}>
              <div className={styles.storyCardFrame}>
                <TocTieLogo size={88} className={styles.storyLogo} />
                <div className={styles.storyCardTitle}>tóc.tie</div>
                <div className={styles.storyCardSlogan}>tie your happiness</div>
                <div className={styles.storyCardBadges}>
                  <span className={styles.storyBadgeTag}>Tiệm phụ kiện tóc xinh</span>
                  <span className={styles.storyBadgeTag}>Khởi nghiệp sinh viên NEU</span>
                  <span className={styles.storyBadgeTag}>207 Giải Phóng, Hà Nội</span>
                </div>
                <div className={styles.storyQuote}>
                  “Mỗi chiếc nơ buộc là một lời nhắn nhủ: Nàng xứng đáng được nâng niu mỗi ngày.”
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section D: Bạn Muốn Biết Thêm? (FAQ Accordion) ── */}
      <section className={styles.faqSection}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeadingBox}>
            <span className={styles.sectionPill}>Giải đáp thắc mắc</span>
            <h2 className={styles.sectionTitle}>Bạn muốn biết thêm?</h2>
            <p className={styles.sectionSubtitle}>
              Mọi điều bạn cần biết về chương trình thu thập 4 mảnh ghép và nhận quà 20/10
            </p>
          </div>

          <div className={styles.faqList}>
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ""}`}
                >
                  <button
                    className={styles.faqQuestionBtn}
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                  >
                    <span className={styles.faqQuestionText}>
                      <span className={styles.faqQuestionDot} />
                      {item.q}
                    </span>
                    <span className={styles.faqToggleIcon}>{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className={styles.faqAnswer}>
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Rich Brand Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrandCol}>
              <div className={styles.footerLogoRow}>
                <TocTieLogo size={46} />
                <div>
                  <div className={styles.footerBrandName}>tóc.tie</div>
                  <div className={styles.footerSlogan}>tie your happiness</div>
                </div>
              </div>
              <p className={styles.footerBio}>
                Tiệm phụ kiện xinh cho mái tóc — Dự án khởi nghiệp của sinh viên Đại học Kinh tế Quốc dân (NEU).
                Đồng hành cùng bạn tạo nên những món quà 20/10 ngọt ngào nhất.
              </p>
            </div>

            <div className={styles.footerInfoCol}>
              <h4 className={styles.footerHeading}>Liên hệ & Cửa hàng</h4>
              <ul className={styles.footerContactList}>
                <li>
                  <span className={styles.contactIconLabel}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Hotline:
                  </span>{" "}
                  <strong>0342.830.553</strong>
                </li>
                <li>
                  <span className={styles.contactIconLabel}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Địa chỉ:
                  </span>{" "}
                  207 Giải Phóng, Hai Bà Trưng, Hà Nội
                </li>
                <li>
                  <span className={styles.contactIconLabel}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook:
                  </span>{" "}
                  <a
                    href="https://www.facebook.com/toc.tie26"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    facebook.com/toc.tie26
                  </a>
                </li>
                <li>
                  <span className={styles.contactIconLabel}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                    Instagram:
                  </span>{" "}
                  <a
                    href="https://instagram.com/toc.tie26"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @toc.tie26
                  </a>
                </li>
              </ul>
            </div>

            <div className={styles.footerActionCol}>
              <h4 className={styles.footerHeading}>Chương trình 20/10</h4>
              <p className={styles.footerActionText}>
                Đã có mã dự thưởng? Hãy nhập ngay để mở bức tranh hạnh phúc của bạn!
              </p>
              <button
                className={`btn btn-primary btn-sm ${styles.footerActionBtn}`}
                onClick={onOpenAuth}
              >
                <span>Nhập mã tham gia</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>© 2024 <strong>tóc.tie</strong> · tie your happiness. Tất cả quyền được bảo lưu.</p>
            <p className={styles.footerDisclaimer}>
              Chương trình tri ân khách hàng nhân dịp 20/10. Mỗi mã dự thưởng dùng 1 lần, mở ngẫu nhiên không trùng góc.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
