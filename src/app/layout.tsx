import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ECU Master Pro 2026 - Professional Multi-Brand OBD-II Diagnostic & Tuning Platform",
  description: "Professional multi-brand OBD-II diagnostic and ECU programming platform with AI-powered predictive maintenance.",
  keywords: ["ECU", "OBD-II", "diagnostics", "automotive", "tuning", "AI", "predictive maintenance"],
  icons: {
    icon: "/ecu-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f1923] text-[#e2e8f0]`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
