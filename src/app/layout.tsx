import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ObserveIQ for Educators",
  description: "Teacher evidence workspace for classroom notes, review, and citation-backed reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={openSans.variable}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
