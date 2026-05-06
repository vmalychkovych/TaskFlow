import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

import { AuthProvider } from "@/components/providers/auth-provider";

import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "Modern workspace and task orchestration for your .NET backend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${headingFont.variable} font-[family-name:var(--font-body)] antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
