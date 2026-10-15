import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tóc.tie — tie your happiness 🎀",
  description:
    "Chương trình loyalty đặc biệt từ tóc.tie. Thu thập 4 mảnh ghép để nhận phần thưởng bí ẩn dành cho người đặc biệt của bạn.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
