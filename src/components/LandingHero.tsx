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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
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
            <span className={styles.headerCtaArrow}>➔</span>
          </button>
        </nav>
      </header>

      {/* ── Hero Section ── */}
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          {/* Left Column: Headlines & Call to Action */}
          <div className={styles.heroContent}>
            <div className={styles.campaignBadge}>
              <span className={styles.badgePulseDot} />
              <span>🎀 Chiến dịch 20/10 · Món quà cho người thương</span>
            </div>

            <h1 className={styles.mainHeadline}>
              Mảnh ghép
              <br />
              <span className={styles.headlineAccent}>hạnh phúc</span>
              <br />
              của bạn <span className={styles.ribbonEmoji}>🎀</span>
            </h1>

            <p className={styles.heroDescription}>
              Mỗi sản phẩm phụ kiện xinh xắn từ <strong>tóc.tie</strong> gửi gắm một mảnh ghép bí ẩn.
              Thu thập đủ <strong>4 mảnh ghép</strong> để mở trọn bức tranh và nhận món quà tri ân đặc biệt
              dành tặng người phụ nữ bạn yêu thương nhất dịp 20/10 này.
            </p>

            {/* Quick 3-step pills preview */}
            <div className={styles.miniStepsList}>
              <div className={styles.miniStepItem}>
                <span className={styles.miniStepIcon}>🛍️</span>
                <span>Mua set quà tặng</span>
              </div>
              <span className={styles.miniStepDivider}>➔</span>
              <div className={styles.miniStepItem}>
                <span className={styles.miniStepIcon}>🔑</span>
                <span>Nhập mã mở góc</span>
              </div>
              <span className={styles.miniStepDivider}>➔</span>
              <div className={styles.miniStepItem}>
                <span className={styles.miniStepIcon}>🎁</span>
                <span>Nhận quà bất ngờ</span>
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
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className={styles.ctaAssurance}>
                <span className={styles.checkIcon}>✓</span> Miễn phí tham gia
                <span className={styles.dotSeparator}>·</span>
                <span>Mỗi mã mở đúng 1 mảnh không trùng</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interlocking Puzzle Box Teaser */}
          <div className={styles.heroVisualCol}>
            <div className={styles.puzzleTeaserCard}>
              {/* Badge top of board */}
              <div className={styles.teaserHeader}>
                <div className={styles.teaserBadge}>
                  <span>🎁 Trò chơi 4 mảnh ghép</span>
                </div>
                <span className={styles.teaserBrand}>tóc.tie</span>
              </div>

              {/* 2x2 preview of the authentic puzzle */}
              <div className={styles.teaserGrid}>
                {/* Piece 0: Scrunchie */}
                <div className={`${styles.teaserPiece} ${styles.teaserPiece0}`}>
                  <div className={styles.pieceTeaserContent}>
                    <span className={styles.pieceIcon}>🎀</span>
                    <span className={styles.pieceName}>Scrunchie lụa</span>
                    <span className={styles.pieceLockBadge}>Góc 1</span>
                  </div>
                </div>

                {/* Piece 1: Pocket Mirror */}
                <div className={`${styles.teaserPiece} ${styles.teaserPiece1}`}>
                  <div className={styles.pieceTeaserContent}>
                    <span className={styles.pieceIcon}>🌸</span>
                    <span className={styles.pieceName}>Gương hoa xinh</span>
                    <span className={styles.pieceLockBadge}>Góc 2</span>
                  </div>
                </div>

                {/* Piece 2: Radiant Star */}
                <div className={`${styles.teaserPiece} ${styles.teaserPiece2}`}>
                  <div className={styles.pieceTeaserContent}>
                    <span className={styles.pieceIcon}>✨</span>
                    <span className={styles.pieceName}>Ánh sao sáng</span>
                    <span className={styles.pieceLockBadge}>Góc 3</span>
                  </div>
                </div>

                {/* Piece 3: Love Gift Box */}
                <div className={`${styles.teaserPiece} ${styles.teaserPiece3}`}>
                  <div className={styles.pieceTeaserContent}>
                    <span className={styles.pieceIcon}>💖</span>
                    <span className={styles.pieceName}>Hộp quà 20/10</span>
                    <span className={styles.pieceLockBadge}>Góc 4</span>
                  </div>
                </div>

                {/* Interlocking center knot */}
                <div className={styles.teaserCenterKnot} aria-hidden="true">
                  <span className={styles.knotRibbon}>🎀</span>
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
                  Mở khóa ✦
                </button>
              </div>
            </div>

            {/* Floating decorative stickers */}
            <div className={styles.floatStickerBow} aria-hidden="true">🎀</div>
            <div className={styles.floatStickerStar1} aria-hidden="true">✦</div>
            <div className={styles.floatStickerStar2} aria-hidden="true">✧</div>
            <div className={styles.floatStickerHeart} aria-hidden="true">💙</div>
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
            <div className={styles.journeyCard}>
              <div className={styles.journeyStepNumber}>01</div>
              <div className={styles.journeyIconBox}>🛍️</div>
              <h3 className={styles.journeyCardTitle}>Chọn mua sản phẩm tóc.tie</h3>
              <p className={styles.journeyCardDesc}>
                Mua bất kỳ set quà 20/10, scrunchies bồng bềnh hay kẹp tóc xinh xắn. Bạn sẽ nhận được mã dự thưởng độc quyền in kèm sản phẩm.
              </p>
              <div className={styles.journeyTag}>Mỗi món quà một mã riêng</div>
            </div>

            <div className={styles.journeyCard}>
              <div className={styles.journeyStepNumber}>02</div>
              <div className={styles.journeyIconBox}>🔑</div>
              <h3 className={styles.journeyCardTitle}>Nhập mã mở ngẫu nhiên</h3>
              <p className={styles.journeyCardDesc}>
                Đăng nhập bằng tài khoản riêng và nhập mã dự thưởng. Hệ thống sẽ mở khóa ngẫu nhiên một trong bốn góc tranh mà không bao giờ bị trùng lặp.
              </p>
              <div className={styles.journeyTag}>Thuật toán mở góc độc quyền</div>
            </div>

            <div className={styles.journeyCard}>
              <div className={styles.journeyStepNumber}>03</div>
              <div className={styles.journeyIconBox}>🎁</div>
              <h3 className={styles.journeyCardTitle}>Gom đủ 4 mảnh nhận quà</h3>
              <p className={styles.journeyCardDesc}>
                Khi thu thập đủ 4 góc, bức tranh hạnh phúc hoàn chỉnh sẽ lộ diện và mở khóa phần quà tri ân đặc biệt từ tóc.tie dành cho người thương.
              </p>
              <div className={styles.journeyTag}>Quà tặng tri ân 20/10</div>
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
                  {/* Floating sparkles */}
                  <path d="M30,45 L33,52 L40,54 L33,56 L30,63 L27,56 L20,54 L27,52 Z" fill="#FFE066" stroke="#1E2D6B" strokeWidth="1" />
                  <path d="M165,130 L167,135 L172,136 L167,137 L165,142 L163,137 L158,136 L163,135 Z" fill="#FFE066" stroke="#1E2D6B" strokeWidth="1" />
                  <circle cx="160" cy="50" r="5" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            <div className={styles.mysteryContent}>
              <span className={styles.mysteryBadge}>Bí mật 20/10 🎁</span>
              <h2 className={styles.mysteryTitle}>Món quà đang chờ được bật mí</h2>
              <p className={styles.mysteryDesc}>
                Phía sau 4 mảnh ghép là phần thưởng đặc biệt được đội ngũ <strong>tóc.tie</strong> chuẩn bị riêng
                cho dịp Ngày Phụ nữ Việt Nam 20/10. Dù là chiếc scrunchie lụa dịu êm hay set quà xinh xắn,
                mỗi phần quà đều được gửi gắm lời chúc hạnh phúc trọn vẹn nhất.
              </p>
              <div className={styles.mysteryHighlights}>
                <div className={styles.mysteryPoint}>
                  <span>🎀</span>
                  <div>
                    <strong>Quà tặng giới hạn</strong>
                    <p>Dành riêng cho khách hàng hoàn tất 4 mảnh</p>
                  </div>
                </div>
                <div className={styles.mysteryPoint}>
                  <span>💌</span>
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
                Nhập mã để khám phá ngay ➔
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
                tóc.tie và món quà dành cho người thương 🎀
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
                  <span className={styles.valueIcon}>🌸</span>
                  <div>
                    <strong>Chất liệu êm ái cho mái tóc</strong>
                    <p>Lụa mềm, voan cao cấp, không làm gãy rụng tóc nàng</p>
                  </div>
                </div>
                <div className={styles.valueItem}>
                  <span className={styles.valueIcon}>✨</span>
                  <div>
                    <strong>Đóng gói tỉ mỉ & chỉn chu</strong>
                    <p>Hộp quà kraft, rơm lót hoa và thiệp viết tay xinh xắn</p>
                  </div>
                </div>
                <div className={styles.valueItem}>
                  <span className={styles.valueIcon}>💙</span>
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
                  <span className={styles.storyBadgeTag}>🎀 Tiệm phụ kiện tóc xinh</span>
                  <span className={styles.storyBadgeTag}>🎓 Khởi nghiệp sinh viên NEU</span>
                  <span className={styles.storyBadgeTag}>📍 207 Giải Phóng, Hà Nội</span>
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
                      <span className={styles.faqQuestionIcon}>✦</span>
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
                  <span>📞 Hotline:</span> <strong>0342.830.553</strong>
                </li>
                <li>
                  <span>📍 Địa chỉ:</span> 207 Giải Phóng, Hai Bà Trưng, Hà Nội
                </li>
                <li>
                  <span>🌐 Facebook:</span>{" "}
                  <a
                    href="https://www.facebook.com/toc.tie26"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    facebook.com/toc.tie26
                  </a>
                </li>
                <li>
                  <span>📷 Instagram:</span>{" "}
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
                Nhập mã tham gia ➔
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
