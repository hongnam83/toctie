"use client";

import { useEffect, useState } from "react";
import styles from "./PuzzleGrid.module.css";

// Piece positions: 0=Top-Left, 1=Top-Right, 2=Bottom-Left, 3=Bottom-Right
const PIECE_LABELS = ["Trái tim", "Nụ cười", "Ánh sao", "Hạnh phúc"];
const PIECE_ICONS = ["💙", "🌸", "✨", "🎀"];

interface Props {
  unlockedPieces: number[];
  newlyRevealedPiece: number | null;
}

// SVG artwork for each quadrant of the full image
// Each piece shows part of a stylized tóc.tie illustration
function PieceArtwork({ pieceIndex }: { pieceIndex: number }) {
  const colors = [
    { bg: "#D6E5F3", accent: "#1E2D6B" },
    { bg: "#FAE0E8", accent: "#C0392B" },
    { bg: "#FFF3C4", accent: "#8B6914" },
    { bg: "#C8EDDD", accent: "#065F46" },
  ];
  const c = colors[pieceIndex];

  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width="200" height="200" fill={c.bg} />
      {/* Stripe pattern inside piece */}
      {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180].map((x) => (
        <rect key={x} x={x} y="0" width="10" height="200" fill={c.bg} opacity="0.5" />
      ))}
      {/* Decorative bow/ribbon element */}
      {pieceIndex === 0 && (
        <g transform="translate(100,100)">
          <path d="M-40,-20 Q-10,-40 0,-10 Q10,-40 40,-20 Q20,0 0,5 Q-20,0 -40,-20Z" fill={c.accent} opacity="0.85" />
          <circle cx="0" cy="0" r="8" fill={c.accent} />
          <path d="M0,5 Q-8,30 -15,55" stroke={c.accent} strokeWidth="3" fill="none" opacity="0.5" />
          <path d="M0,5 Q8,30 15,55" stroke={c.accent} strokeWidth="3" fill="none" opacity="0.5" />
          {/* Sparkles */}
          <circle cx="-50" cy="-50" r="4" fill={c.accent} opacity="0.4" />
          <circle cx="55" cy="-30" r="3" fill={c.accent} opacity="0.4" />
          <circle cx="-30" cy="60" r="5" fill={c.accent} opacity="0.3" />
        </g>
      )}
      {pieceIndex === 1 && (
        <g transform="translate(100,100)">
          {/* Flower */}
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <ellipse
              key={angle}
              cx={Math.cos((angle * Math.PI) / 180) * 35}
              cy={Math.sin((angle * Math.PI) / 180) * 35}
              rx="18"
              ry="10"
              fill={c.accent}
              opacity="0.75"
              transform={`rotate(${angle}, ${Math.cos((angle * Math.PI) / 180) * 35}, ${Math.sin((angle * Math.PI) / 180) * 35})`}
            />
          ))}
          <circle cx="0" cy="0" r="15" fill="#FFF3C4" />
          <circle cx="0" cy="0" r="8" fill={c.accent} />
        </g>
      )}
      {pieceIndex === 2 && (
        <g transform="translate(100,100)">
          {/* Star */}
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <polygon
              key={i}
              points="0,-50 12,-20 45,-20 22,8 33,40 0,22 -33,40 -22,8 -45,-20 -12,-20"
              fill={c.accent}
              opacity="0.8"
              transform={`rotate(${angle})`}
            />
          ))}
        </g>
      )}
      {pieceIndex === 3 && (
        <g transform="translate(100,100)">
          {/* Heart */}
          <path
            d="M0,40 C-70,-10 -90,-80 -30,-75 C-15,-73 0,-60 0,-60 C0,-60 15,-73 30,-75 C90,-80 70,-10 0,40Z"
            fill={c.accent}
            opacity="0.85"
          />
          {/* Inner heart */}
          <path
            d="M0,20 C-35,-5 -45,-40 -15,-38 C-7,-36 0,-30 0,-30 C0,-30 7,-36 15,-38 C45,-40 35,-5 0,20Z"
            fill="white"
            opacity="0.25"
          />
        </g>
      )}
      {/* Brand mark watermark */}
      <text x="100" y="190" textAnchor="middle" fontFamily="'Shantell Sans',cursive" fontSize="10" fill={c.accent} opacity="0.4">
        tóc.tie
      </text>
    </svg>
  );
}

function LockedPiece({ pieceIndex }: { pieceIndex: number }) {
  return (
    <div className={styles.lockedInner}>
      <div className={styles.lockIcon}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <div className={styles.lockPieceNum}>Mảnh {pieceIndex + 1}</div>
      <div className={styles.lockHint}>Nhập mã để mở</div>
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
    <div className={`${styles.wrapper} ${isComplete ? styles.wrapperComplete : ""}`}>
      {/* The 4-piece grid */}
      <div className={styles.grid}>
        {[0, 1, 2, 3].map((pieceIndex) => {
          const isUnlocked = revealedMap.has(pieceIndex);
          const isNew = newlyRevealedPiece === pieceIndex;

          return (
            <div
              key={pieceIndex}
              className={`
                ${styles.piece}
                ${isUnlocked ? styles.pieceUnlocked : styles.pieceLocked}
                ${isNew ? styles.pieceNew : ""}
                ${isComplete ? styles.pieceComplete : ""}
              `}
              aria-label={
                isUnlocked
                  ? `Mảnh ${pieceIndex + 1}: ${PIECE_LABELS[pieceIndex]} — đã mở`
                  : `Mảnh ${pieceIndex + 1} — chưa mở`
              }
            >
              {isUnlocked ? (
                <div className={`${styles.artworkWrapper} ${isNew ? "piece-reveal" : ""}`}>
                  <PieceArtwork pieceIndex={pieceIndex} />
                  {isNew && (
                    <div className={styles.newBadge}>
                      <span>{PIECE_ICONS[pieceIndex]}</span>
                      <span>Mới!</span>
                    </div>
                  )}
                  <div className={styles.pieceOverlay}>
                    <span className={styles.pieceOverlayIcon}>{PIECE_ICONS[pieceIndex]}</span>
                    <span className={styles.pieceOverlayLabel}>{PIECE_LABELS[pieceIndex]}</span>
                  </div>
                </div>
              ) : (
                <LockedPiece pieceIndex={pieceIndex} />
              )}
            </div>
          );
        })}

        {/* Center connector — shows when some are unlocked */}
        <div className={styles.centerDot} aria-hidden="true">
          <TieRibbon progress={unlockedPieces.length} />
        </div>
      </div>

      {isComplete && (
        <div className={styles.completeOverlay}>
          <div className={styles.completeText}>
            <div className={styles.completeEmoji}>🎉</div>
            <div className={styles.completeTitle}>Hoàn thành!</div>
            <div className={styles.completeSub}>Bộ sưu tập của bạn đã đầy đủ</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Small ribbon SVG in center of grid
function TieRibbon({ progress }: { progress: number }) {
  const opacity = Math.max(0, (progress - 1) / 3);
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" style={{ opacity }}>
      <path d="M10,10 Q20,0 30,10 Q20,20 10,10Z" fill="#1E2D6B" opacity="0.7" />
      <path d="M10,30 Q20,40 30,30 Q20,20 10,30Z" fill="#1E2D6B" opacity="0.7" />
      <circle cx="20" cy="20" r="5" fill="#F4C5D3" />
    </svg>
  );
}
