import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "배차 프로그램",
  description: "배차 자동 프로그램",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}