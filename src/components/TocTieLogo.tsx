import Image from "next/image";

interface Props {
  size?: number;
  className?: string;
  rounded?: boolean;
}

export default function TocTieLogo({ size = 48, className, rounded = true }: Props) {
  return (
    <Image
      src="/toctie-logo.jpg"
      alt="tóc.tie - tie your happiness"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? "50%" : "14px",
        objectFit: "cover",
        display: "inline-block",
        boxShadow: "0 2px 10px rgba(30, 45, 107, 0.12)",
        border: "2.5px solid #B8CCE4",
        aspectRatio: "1 / 1",
        flexShrink: 0,
      }}
      priority
    />
  );
}
