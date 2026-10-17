"use client";

import { useEffect, useState } from "react";
import styles from "./PuzzleGrid.module.css";

// 4 Piece metadata matching tóc.tie 20/10 gift theme
export const PIECE_INFO = [
  {
    id: 0,
    name: "Trái tim",
    subtitle: "Scrunchie lụa thắt nơ",
    color: "#F4C5D3",
    tag: "Góc 1",
  },
  {
    id: 1,
    name: "Nụ cười",
    subtitle: "Gương mini hoa xinh",
    color: "#B8CCE4",
    tag: "Góc 2",
  },
  {
    id: 2,
    name: "Ánh sao",
    subtitle: "Ruy băng & ánh sao",
    color: "#FFF3C4",
    tag: "Góc 3",
  },
  {
    id: 3,
    name: "Hạnh phúc",
    subtitle: "Hộp quà 20/10 yêu thương",
    color: "#C8EDDD",
    tag: "Góc 4",
  },
];

interface Props {
  unlockedPieces: number[];
  newlyRevealedPiece: number | null;
}

// ── SVG Artwork for each quadrant representing authentic tóc.tie assets ──
function PieceArtwork({ pieceIndex }: { pieceIndex: number }) {
  if (pieceIndex === 0) {
    // Top-Left: Silk Scrunchie & Ribbon Bow with pearls & sparkles
    return (
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className={styles.artSvg}>
        <defs>
          <linearGradient id="scrunchieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FAE0E8" />
            <stop offset="50%" stopColor="#F4C5D3" />
            <stop offset="100%" stopColor="#E8A0BA" />
          </linearGradient>
          <radialGradient id="softGlow0" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D6E5F3" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="200" height="200" fill="#FAF6EE" />
        {[0, 24, 48, 72, 96, 120, 144, 168, 192].map((x) => (
          <rect key={x} x={x} y="0" width="10" height="200" fill="#D6E5F3" opacity="0.35" />
        ))}
        <circle cx="100" cy="100" r="80" fill="url(#softGlow0)" opacity="0.7" />

        {/* Fluffy Scrunchie Ring */}
        <g transform="translate(100,95)">
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const cx = Math.cos(rad) * 44;
            const cy = Math.sin(rad) * 44;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r="22"
                fill="url(#scrunchieGrad)"
                stroke="#1E2D6B"
                strokeWidth="1.8"
                opacity="0.95"
              />
            );
          })}
          <circle cx="0" cy="0" r="26" fill="#FAF6EE" stroke="#1E2D6B" strokeWidth="2" />
          <circle cx="0" cy="0" r="20" fill="#D6E5F3" opacity="0.4" />

          {/* Ribbon Bow tied to scrunchie */}
          <g transform="translate(0, 22)">
            <path d="M0,0 C-24,-18 -38,10 -12,8 Z" fill="#1E2D6B" />
            <path d="M0,0 C24,-18 38,10 12,8 Z" fill="#1E2D6B" />
            <circle cx="0" cy="0" r="6" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="1.5" />
            <path d="M-3,4 Q-12,25 -16,36 Q-10,32 -6,34 Q-3,22 0,6" fill="#1E2D6B" />
            <path d="M3,4 Q12,25 16,36 Q10,32 6,34 Q3,22 0,6" fill="#1E2D6B" />
          </g>

          {/* Floating pearls & clean vector sparkles */}
          <circle cx="-55" cy="-35" r="4" fill="#FFFFFF" stroke="#1E2D6B" strokeWidth="1.5" />
          <circle cx="58" cy="-25" r="3" fill="#FFFFFF" stroke="#1E2D6B" strokeWidth="1.5" />
          <path d="M-40,-55 L-37,-45 L-27,-42 L-37,-39 L-40,-29 L-43,-39 L-53,-42 L-43,-45 Z" fill="#FFE066" stroke="#1E2D6B" strokeWidth="1" />
          <path d="M48,40 L50,46 L56,48 L50,50 L48,56 L46,50 L40,48 L46,46 Z" fill="#FFE066" stroke="#1E2D6B" strokeWidth="0.8" />
        </g>

        <text x="100" y="185" textAnchor="middle" fontFamily="'Shantell Sans', cursive" fontSize="11" fontWeight="700" fill="#1E2D6B">
          Scrunchie Lụa
        </text>
      </svg>
    );
  }

  if (pieceIndex === 1) {
    // Top-Right: Handheld Daisy Pocket Mirror with floral frame & sparkle
    return (
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className={styles.artSvg}>
        <defs>
          <linearGradient id="mirrorGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#D6E5F3" />
            <stop offset="100%" stopColor="#B8CCE4" />
          </linearGradient>
        </defs>

        <rect width="200" height="200" fill="#FAF6EE" />
        {[0, 24, 48, 72, 96, 120, 144, 168, 192].map((x) => (
          <rect key={x} x={x} y="0" width="10" height="200" fill="#B8CCE4" opacity="0.3" />
        ))}

        <g transform="translate(100,95)">
          <path d="M-6,45 L-9,85 Q0,92 9,85 L6,45 Z" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="2" />
          <circle cx="0" cy="76" r="3" fill="#FAF6EE" stroke="#1E2D6B" strokeWidth="1.2" />

          {/* Daisy Petals Frame around mirror */}
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const cx = Math.cos(rad) * 46;
            const cy = Math.sin(rad) * 46;
            return (
              <ellipse
                key={i}
                cx={cx}
                cy={cy}
                rx="14"
                ry="9"
                transform={`rotate(${deg}, ${cx}, ${cy})`}
                fill="#FFFFFF"
                stroke="#1E2D6B"
                strokeWidth="1.8"
              />
            );
          })}

          <circle cx="0" cy="0" r="42" fill="#F5EFE0" stroke="#1E2D6B" strokeWidth="2.2" />
          <circle cx="0" cy="0" r="36" fill="url(#mirrorGlass)" stroke="#1E2D6B" strokeWidth="1.5" />
          <path d="M-15,-20 Q-5,-25 15,-15 Q25,-5 20,15" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
          <circle cx="16" cy="18" r="2.5" fill="#FFFFFF" />

          {/* Handcrafted cute smile on mirror */}
          <path d="M-12,2 Q-6,8 0,2" stroke="#1E2D6B" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M4,2 Q10,8 16,2" stroke="#1E2D6B" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M-4,10 Q2,16 8,10" stroke="#1E2D6B" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <circle cx="-14" cy="8" r="3" fill="#F4C5D3" />
          <circle cx="18" cy="8" r="3" fill="#F4C5D3" />

          <path d="M-55,-40 L-53,-32 L-45,-30 L-53,-28 L-55,-20 L-57,-28 L-65,-30 L-57,-32 Z" fill="#FFE066" stroke="#1E2D6B" strokeWidth="1" />
          <circle cx="55" cy="-45" r="4" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="1.2" />
        </g>

        <text x="100" y="185" textAnchor="middle" fontFamily="'Shantell Sans', cursive" fontSize="11" fontWeight="700" fill="#1E2D6B">
          Gương Hoa Cúc Mini
        </text>
      </svg>
    );
  }

  if (pieceIndex === 2) {
    // Bottom-Left: Ribbon Swirl & Starlight Cluster in signature Yellow & Navy
    return (
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className={styles.artSvg}>
        <rect width="200" height="200" fill="#FAF6EE" />
        {[0, 24, 48, 72, 96, 120, 144, 168, 192].map((x) => (
          <rect key={x} x={x} y="0" width="10" height="200" fill="#FFF3C4" opacity="0.5" />
        ))}

        <g transform="translate(100,95)">
          <path
            d="M-70,30 C-30,-20 30,-20 70,30 C45,35 20,20 0,22 C-20,24 -45,38 -70,30 Z"
            fill="#FFF3C4"
            stroke="#1E2D6B"
            strokeWidth="2"
          />

          {/* Central 4-point Diamond Star */}
          <g transform="translate(0, -10)">
            <path
              d="M0,-52 Q4,-12 36,0 Q4,12 0,52 Q-4,12 -36,0 Q-4,-12 0,-52 Z"
              fill="#FFE066"
              stroke="#1E2D6B"
              strokeWidth="2.2"
            />
            <path
              d="M0,-30 Q2,-6 20,0 Q2,6 0,30 Q-2,6 -20,0 Q-2,-6 0,-30 Z"
              fill="#FFFFFF"
              opacity="0.8"
            />
            <circle cx="0" cy="0" r="4" fill="#1E2D6B" />
          </g>

          <g transform="translate(-48, -40)">
            <path d="M0,-16 Q2,-4 12,0 Q2,4 0,16 Q-2,4 -12,0 Q-2,-4 0,-16 Z" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="1.5" />
          </g>
          <g transform="translate(48, -38)">
            <path d="M0,-14 Q2,-3 10,0 Q2,3 0,14 Q-2,3 -10,0 Q-2,-3 0,-14 Z" fill="#D6E5F3" stroke="#1E2D6B" strokeWidth="1.5" />
          </g>
          <g transform="translate(-40, 42)">
            <path d="M0,8 C-10,-4 -15,-12 -6,-12 C-2,-12 0,-9 0,-9 C0,-9 2,-12 6,-12 C15,-12 10,-4 0,8 Z" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="1.5" />
          </g>
          <g transform="translate(42, 40)">
            <circle cx="0" cy="0" r="4" fill="#1E2D6B" />
          </g>
        </g>

        <text x="100" y="185" textAnchor="middle" fontFamily="'Shantell Sans', cursive" fontSize="11" fontWeight="700" fill="#1E2D6B">
          Ruy Băng & Ánh Sao
        </text>
      </svg>
    );
  }

  // Piece 3 (Bottom-Right): 20/10 Gift Box with Bow & Greeting Note
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className={styles.artSvg}>
      <defs>
        <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5EFE0" />
          <stop offset="100%" stopColor="#EDE5CF" />
        </linearGradient>
      </defs>

      <rect width="200" height="200" fill="#FAF6EE" />
      {[0, 24, 48, 72, 96, 120, 144, 168, 192].map((x) => (
        <rect key={x} x={x} y="0" width="10" height="200" fill="#C8EDDD" opacity="0.35" />
      ))}

      <g transform="translate(100,95)">
        <rect x="-44" y="-12" width="88" height="66" rx="6" fill="url(#boxGrad)" stroke="#1E2D6B" strokeWidth="2.2" />
        <rect x="-48" y="-24" width="96" height="18" rx="5" fill="#FAF6EE" stroke="#1E2D6B" strokeWidth="2.2" />

        <rect x="-8" y="-24" width="16" height="78" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="1.6" />
        <rect x="-48" y="-20" width="96" height="10" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="1.2" opacity="0.7" />

        <g transform="translate(0, -24)">
          <path d="M0,0 C-26,-22 -36,-2 -10,3 Z" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="1.8" />
          <path d="M0,0 C26,-22 36,-2 10,3 Z" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="1.8" />
          <circle cx="0" cy="0" r="6" fill="#1E2D6B" />
          <path d="M-2,3 Q-14,20 -18,28" stroke="#1E2D6B" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M2,3 Q14,20 18,28" stroke="#1E2D6B" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>

        {/* 20/10 Greeting Card Tag */}
        <g transform="translate(24, 18) rotate(10)">
          <rect x="-14" y="-10" width="28" height="20" rx="3" fill="#FFFFFF" stroke="#1E2D6B" strokeWidth="1.4" />
          <circle cx="0" cy="-6" r="1.5" fill="#1E2D6B" />
          <text x="0" y="4" textAnchor="middle" fontFamily="'Shantell Sans', cursive" fontSize="7" fontWeight="700" fill="#1E2D6B">
            20/10
          </text>
        </g>

        <circle cx="-56" cy="10" r="3" fill="#FFE066" stroke="#1E2D6B" strokeWidth="1" />
        <path d="M52,-45 L54,-38 L61,-36 L54,-34 L52,-27 L50,-34 L43,-36 L50,-38 Z" fill="#FFE066" stroke="#1E2D6B" strokeWidth="0.8" />
      </g>

      <text x="100" y="185" textAnchor="middle" fontFamily="'Shantell Sans', cursive" fontSize="11" fontWeight="700" fill="#1E2D6B">
        Hộp Quà Tặng 20/10
      </text>
    </svg>
  );
}

// ── Locked Piece with Warm Hand-drawn Craft & Ribbon Padlock ──
function LockedPiece({ pieceIndex }: { pieceIndex: number }) {
  return (
    <div className={styles.lockedInner}>
      {/* Stitch border */}
      <div className={styles.stitchBorder} aria-hidden="true" />

      {/* Decorative ribbon padlock icon */}
      <div className={styles.lockIconBox}>
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 17V12C12 8.134 15.134 5 19 5C22.866 5 26 8.134 26 12V17"
            stroke="#1E2D6B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <rect x="8" y="16" width="22" height="17" rx="5" fill="#FAF6EE" stroke="#1E2D6B" strokeWidth="2.2" />
          <circle cx="19" cy="23" r="2.5" fill="#1E2D6B" />
          <path d="M19 25.5V29" stroke="#1E2D6B" strokeWidth="2" strokeLinecap="round" />
          <g transform="translate(19, 5)">
            <path d="M0,0 C-7,-6 -10,0 -3,2 Z" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="1" />
            <path d="M0,0 C7,-6 10,0 3,2 Z" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="1" />
            <circle cx="0" cy="0" r="1.8" fill="#1E2D6B" />
          </g>
        </svg>
      </div>

      <div className={styles.lockPieceMeta}>
        <span className={styles.lockPieceIndex}>Mảnh {pieceIndex + 1}</span>
      </div>

      <div className={styles.lockPieceTag}>
        <span className={styles.lockPulseDot} />
        <span>Nhập mã để mở</span>
      </div>
    </div>
  );
}

export default function PuzzleGrid({ unlockedPieces, newlyRevealedPiece }: Props) {
  const [revealedMap, setRevealedMap] = useState<Set<number>>(new Set(unlockedPieces));

  useEffect(() => {
    setRevealedMap(new Set(unlockedPieces));
  }, [unlockedPieces]);

  const isComplete = unlockedPieces.length === 4;

  return (
    <div
      className={`${styles.container} ${isComplete ? styles.containerComplete : ""}`}
      id="puzzle-board"
    >
      {/* Outer Board Card */}
      <div className={styles.boardCard}>
        {/* Header indicator inside board */}
        <div className={styles.boardHeader}>
          <div className={styles.boardProgressBadge}>
            <span>Tiến trình: <strong>{unlockedPieces.length}/4 mảnh</strong></span>
          </div>
          <span className={styles.boardBrandSlogan}>tie your happiness</span>
        </div>

        {/* 2x2 Interconnected Puzzle Matrix */}
        <div className={styles.puzzleMatrix}>
          {[0, 1, 2, 3].map((pieceIndex) => {
            const isUnlocked = revealedMap.has(pieceIndex);
            const isNew = newlyRevealedPiece === pieceIndex;
            const info = PIECE_INFO[pieceIndex];

            return (
              <div
                key={pieceIndex}
                className={`
                  ${styles.piece}
                  ${styles[`pieceCorner${pieceIndex}`]}
                  ${isUnlocked ? styles.pieceUnlocked : styles.pieceLocked}
                  ${isNew ? styles.pieceNew : ""}
                `}
                aria-label={
                  isUnlocked
                    ? `Mảnh ${pieceIndex + 1}: ${info.name} (${info.subtitle}) — đã mở khóa`
                    : `Mảnh ${pieceIndex + 1}: ${info.name} — đang khóa, cần nhập mã để mở`
                }
              >
                {isUnlocked ? (
                  <div className={`${styles.artworkWrapper} ${isNew ? "piece-reveal" : ""}`}>
                    <PieceArtwork pieceIndex={pieceIndex} />

                    {isNew && (
                      <div className={styles.newBadge}>
                        <span>Mới mở!</span>
                      </div>
                    )}

                    {/* Subtle info pill visible on hover */}
                    <div className={styles.pieceOverlay}>
                      <strong className={styles.pieceOverlayName}>Mảnh {pieceIndex + 1}: {info.name}</strong>
                      <span className={styles.pieceOverlaySub}>{info.subtitle}</span>
                    </div>
                  </div>
                ) : (
                  <LockedPiece pieceIndex={pieceIndex} />
                )}
              </div>
            );
          })}

          {/* Interlocking puzzle seam lines */}
          <div className={styles.seamVertical} aria-hidden="true" />
          <div className={styles.seamHorizontal} aria-hidden="true" />

          {/* Center Brand Ribbon Knot */}
          <div className={styles.centerKnot} aria-hidden="true">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <circle cx="22" cy="22" r="19" fill="#FDFCF8" stroke="#1E2D6B" strokeWidth="2.5" />
              <g transform="translate(22, 22)">
                <path d="M0,0 C-11,-10 -15,0 -5,3 Z" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="1.5" />
                <path d="M0,0 C11,-10 15,0 5,3 Z" fill="#F4C5D3" stroke="#1E2D6B" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="3.5" fill="#1E2D6B" />
                <path d="M-1,3 Q-6,11 -8,15" stroke="#1E2D6B" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M1,3 Q6,11 8,15" stroke="#1E2D6B" strokeWidth="1.6" strokeLinecap="round" />
              </g>
            </svg>
          </div>
        </div>

        {/* Footer info under board */}
        <div className={styles.boardFooter}>
          <span className={styles.boardNote}>
            {isComplete
              ? "Bức tranh đã hoàn chỉnh với trọn vẹn 4 mảnh ghép."
              : "Mỗi mã dự thưởng hợp lệ mở ngẫu nhiên một góc còn khóa."}
          </span>
        </div>
      </div>

      {/* Complete celebration banner overlay */}
      {isComplete && (
        <div className={styles.completeBanner}>
          <div className={styles.completeIconBox}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E2D6B" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#FFE066" />
            </svg>
          </div>
          <div className={styles.completeInfo}>
            <div className={styles.completeTitle}>Chúc mừng! Tranh đã hoàn chỉnh</div>
            <div className={styles.completeSub}>Bạn đã mở khóa phần quà 20/10 từ tóc.tie</div>
          </div>
        </div>
      )}
    </div>
  );
}
