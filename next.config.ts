import type { NextConfig } from "next";

const producao = process.env.NODE_ENV === "production";

// A Content-Security-Policy (com nonce por requisição) fica em src/middleware.ts.
// Aqui ficam os demais cabeçalhos de segurança, que valem para TODAS as respostas (inclusive arquivos estáticos).
const nextConfig: NextConfig = {
  poweredByHeader: false, // não anuncia "X-Powered-By: Next.js"
  serverExternalPackages: ["sharp", "exceljs"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          { key: "Origin-Agent-Cluster", value: "?1" },
          // HTTPS obrigatório: o navegador lembra por 2 anos (inclui subdomínios). Só em produção.
          ...(producao ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
        ],
      },
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
};

export default nextConfig;
