import type { NextConfig } from "next";

// Wykrywanie środowiska
const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "*.pixabay.com",
      },
      {
        protocol: "https",
        hostname: "pixabay.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },

  // Security headers dla wszystkich stron
  async headers() {
    // Bazowe nagłówki bezpieczeństwa (zawsze włączone)
    const securityHeaders = [
      // Zapobiega osadzaniu strony w iframe (clickjacking)
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      // Zapobiega MIME type sniffing
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      // Kontrola referrera
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      // Wyłączenie niebezpiecznych API przeglądarki
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
      // Content Security Policy
      // Uwaga: 'unsafe-inline' i 'unsafe-eval' wymagane przez Next.js
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
          "font-src 'self' fonts.gstatic.com data:",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' https:",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; "),
      },
    ];

    // HSTS - tylko na produkcji (wymaga HTTPS)
    if (isProduction) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }

    return [
      {
        // Zastosuj do wszystkich ścieżek
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
