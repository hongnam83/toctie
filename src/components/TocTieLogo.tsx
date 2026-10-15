// SVG Brand Logo Component for tóc.tie
interface Props {
  size?: number;
  className?: string;
}

export default function TocTieLogo({ size = 48, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="tóc.tie logo"
    >
      {/* Circular blue-stripe background */}
      <circle cx="50" cy="50" r="50" fill="#D6E5F3" />
      {/* Stripes */}
      {[10, 24, 38, 52, 66, 80].map((x) => (
        <rect key={x} x={x} y="0" width="8" height="100" fill="#B8CCE4" opacity="0.6" />
      ))}
      <circle cx="50" cy="50" r="50" fill="none" stroke="#1E2D6B" strokeWidth="0" />

      {/* Hair illustration — simplified girl silhouette */}
      {/* Head */}
      <ellipse cx="50" cy="38" rx="18" ry="20" fill="#FDFCF8" />
      {/* Hair flowing */}
      <path
        d="M32 32 Q28 50 30 65 Q40 72 50 68 Q60 72 70 65 Q72 50 68 32 Q60 18 50 20 Q40 18 32 32Z"
        fill="#1E2D6B"
      />
      {/* Face highlights */}
      <ellipse cx="50" cy="40" rx="14" ry="16" fill="#FDFCF8" />
      {/* Eyes */}
      <ellipse cx="44" cy="38" rx="2" ry="2.5" fill="#1E2D6B" />
      <ellipse cx="56" cy="38" rx="2" ry="2.5" fill="#1E2D6B" />
      {/* Smile */}
      <path d="M44 46 Q50 52 56 46" stroke="#1E2D6B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Bow/ribbon on hair */}
      <path d="M38 26 Q45 22 46 28 Q45 30 44 28 Q38 30 38 26Z" fill="#F4C5D3" />
      <path d="M54 26 Q62 22 62 26 Q62 30 56 28 Q55 30 54 28Z" fill="#F4C5D3" />
      <circle cx="50" cy="27" r="3" fill="#E8A0BA" />

      {/* "tóc.tie" text area — simple brand mark */}
      <text
        x="50"
        y="90"
        textAnchor="middle"
        fontFamily="'Shantell Sans', cursive"
        fontWeight="700"
        fontSize="11"
        fill="#1E2D6B"
        letterSpacing="-0.3"
      >
        tóc.tie
      </text>
    </svg>
  );
}
