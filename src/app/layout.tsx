import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AIAssistant } from "@/components/AIAssistant";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Anime Tracker | แหล่งข้อมูลอนิเมะและตารางฉายเรียลไทม์ 🎮",
  description: "ค้นพบอนิเมะยอดนิยม อัปเดตตารางฉายประจำสัปดาห์แบบสด ๆ เรียลไทม์ และระบบค้นหาอนิเมะที่ตอบสนองรวดเร็ว พร้อมแดชบอร์ดระดับพรีเมียม",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        {/* เมาท์ที่ปรึกษา AI ทรงพลังไว้ที่ระดับชั้นสากล เพื่อเก็บประวัติการสนทนาข้ามหน้าเว็บ */}
        <AIAssistant />
      </body>
    </html>
  );
}
