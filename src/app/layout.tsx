import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tóc.tie — tie your happiness",
  description:
    "Chương trình loyalty đặc biệt từ tóc.tie. Thu thập 4 mảnh ghép để nhận phần thưởng bí ẩn dành cho người đặc biệt của bạn.",
  icons: {
    icon: [
      { url: "/icon.png?v=2", type: "image/png" },
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/toctie-logo.jpg?v=2", type: "image/jpeg" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: [
      { url: "/apple-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="/icon.png?v=2" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" href="/apple-icon.png?v=2" />
      </head>
      <body>{children}</body>
    </html>
  );
}
