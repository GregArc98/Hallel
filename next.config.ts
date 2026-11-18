import type { NextConfig } from "next";

/**
 * Em desenvolvimento, o Next só serve os scripts para localhost. Para testar no
 * celular pela rede local (http://IP-DO-COMPUTADOR:3000), liberamos as faixas de IP
 * privadas. Não afeta produção. Outros hosts: DEV_ORIGINS="meu-pc.local,outro.host".
 */
const allowedDevOrigins = [
  "192.168.*.*",
  "10.*.*.*",
  "172.*.*.*",
  "*.local",
  ...(process.env.DEV_ORIGINS?.split(",").map((h) => h.trim()).filter(Boolean) ?? []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  // Cache Components desativado de propósito: quase toda tela depende do usuário
  // logado (RLS por pessoa), então o ganho é pequeno e a complexidade é grande.
  async headers() {
    return [
      {
        // Cabeçalhos de segurança em todas as páginas.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), screen-wake-lock=(self), fullscreen=(self)",
          },
        ],
      },
      {
        // O service worker nunca fica em cache: atualizações chegam na hora.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
