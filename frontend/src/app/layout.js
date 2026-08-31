import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "모빌리티 초이스",
  description: "생활패턴 기반 모빌리티 선택 지원 서비스",
};

export default function RootLayout({ children }) {
  return (
      <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
      {children}
      </body>
      </html>
  );
}