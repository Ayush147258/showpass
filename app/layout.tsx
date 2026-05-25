import type { Metadata, Viewport } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";
import { Toaster } from "sonner";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SHOWPASS — Your event. Your crowd. Your moment.",
    template: "%s | SHOWPASS",
  },
  description:
    "India's smartest event ticketing platform. Buy tickets, host events, manage check-ins — all in one place.",
  keywords: ["event tickets", "ticketing India", "college fest", "concert tickets", "event management"],
  openGraph: {
    title: "SHOWPASS",
    description: "Your event. Your crowd. Your moment.",
    type: "website",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1628",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@700,600,500,400&display=swap"
          rel="stylesheet"
        />
        <style>{`:root { --font-clash: 'Clash Display'; }`}</style>
      </head>
      <body className={`${sora.variable} ${jetbrains.variable} font-body antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0A1628",
                border: "1px solid rgba(255,107,53,0.3)",
                color: "#fff",
                fontFamily: "var(--font-sora)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
