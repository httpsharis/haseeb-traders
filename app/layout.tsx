import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

import type { Metadata, Viewport } from "next";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {

  metadataBase: new URL("https://haseebtraders.com"),
  
  title: "Haseeb Traders | Billing & Invoicing",
  description: "Professional invoice management and client billing system for Haseeb Traders.",
  openGraph: {
    title: "Haseeb Traders | Billing & Invoicing",
    description: "Professional invoice management and client billing system for Haseeb Traders.",
    url: "https://haseebtraders.com",
    siteName: "Haseeb Traders",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Haseeb Traders Dashboard",
      },
    ],
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Haseeb Traders | Billing & Invoicing",
    description: "Professional invoice management and client billing system.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}