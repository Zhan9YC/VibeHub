import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/app/providers";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeHub",
  description: "Vibecoding 应用市场与 Remix 社区"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <AppShell navbar={<Navbar />}>
            {children}
          </AppShell>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
