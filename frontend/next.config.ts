import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Turbopack uyarısını susturmak için boş yapılandırma
  // Next.js 16 tipleri henüz bunu tanımıyorsa hata vermemesi için 'as any' kullanıyoruz
  // @ts-ignore: Next.js 16 terminal suggestion may conflict with existing types
  turbopack: {} as any,

  // 2. Eğer üstteki işe yaramazsa turbo ayarı burada bekleniyor olabilir
  experimental: {
    // turbo: {} 
  },

  // 3. WebSocket (HMR) loglarını susturan Webpack ayarı
  webpack: (config) => {
    config.infrastructureLogging = {
      level: "error",
    };
    return config;
  },
};

export default nextConfig;