import type { Metadata, Viewport } from "next";
import { Geist, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StrideWork",
  description: "Client and task management",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StrideWork",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${barlow.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
