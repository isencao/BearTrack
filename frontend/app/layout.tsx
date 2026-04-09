import type { Metadata, Viewport } from "next";
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

// Uygulama gibi hissettirmesi için Viewport ayarları
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Kullanıcının zoom yapmasını engeller, app hissi verir
};

// PWA ve SEO Metadataları
export const metadata: Metadata = {
  title: "BearGuard OS",
  description: "Yapay Zeka Destekli Fitness ve Beslenme Sistemi",
  manifest: "/manifest.json", // Uygulama olarak yüklenmesi için şart
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BearGuard OS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-black`}
    >
      <body className="min-h-full flex flex-col bg-black text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}