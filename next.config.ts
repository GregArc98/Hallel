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
