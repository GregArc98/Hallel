import { expect, test } from "@playwright/test";

test.describe("sem login", () => {
  test("áreas internas mandam para /entrar, lembrando o destino", async ({ page }) => {
    await page.goto("/musicas");
    await expect(page).toHaveURL(/\/entrar\?proximo=%2Fmusicas/);
    await expect(page.getByRole("button", { name: /Receber link de acesso/ })).toBeVisible();
  });

  test("link vencido mostra mensagem em português", async ({ page }) => {
    await page.goto("/auth/callback");
    await expect(page).toHaveURL(/erro=link/);
    await expect(page.getByText(/Esse link não vale mais/)).toBeVisible();
  });

  test("página inexistente em português", async ({ page }) => {
    await page.goto("/demo/nao-existe");
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  });

  test("manifesto e service worker", async ({ request }) => {
    const manifesto = await (await request.get("/manifest.webmanifest")).json();
    expect(manifesto.short_name).toBe("Hallel");
    const sw = await request.get("/sw.js");
    expect(sw.status()).toBe(200);
    expect(sw.headers()["cache-control"]).toContain("no-store");
  });
});

test.describe("visualizador de cifra (/demo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
  });

  test("abre no tom do culto e transpõe", async ({ page }) => {
    const tom = page.getByLabel(/^Tom [A-G]/).first();
    await expect(tom).toHaveText("G");
    await page.getByRole("button", { name: "Subir meio tom" }).click();
    await expect(tom).toHaveText("Ab");
    await page.getByRole("button", { name: /tom do culto/i }).click();
    await expect(tom).toHaveText("G");
  });

  test("modo letra esconde os acordes", async ({ page }) => {
    await expect(page.getByText("F/G").first()).toBeVisible();
    await page.getByRole("radio", { name: /Letra/ }).click();
    await expect(page.locator("[data-mode=letra]").first()).toBeVisible();
    await expect(page.locator("[data-mode=letra]").first().getByText("F/G")).toHaveCount(0);
  });

  test("modo palco abre e fecha", async ({ page }) => {
    await page.getByRole("button", { name: /palco/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Sair do modo palco" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("cifra colada é entendida", async ({ page }) => {
    await page.locator("textarea").fill("Tom: G\nGrande É o Senhor\n\n[Refrão]\nG          D/F#\nGrande é o Senhor");
    await expect(page.getByText(/1 seção · tom G/)).toBeVisible();
  });
});
