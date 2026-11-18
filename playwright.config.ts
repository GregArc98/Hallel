import { defineConfig, devices } from "@playwright/test";

/**
 * Testes de ponta a ponta das telas públicas (sem login), contra o build de produção.
 * Uso: npm run build && npm run test:e2e
 */
const PORTA = 3100;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: "off",
    locale: "pt-BR",
  },
  projects: [{ name: "celular", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: `npx next start -p ${PORTA}`,
    url: `http://localhost:${PORTA}/entrar`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
