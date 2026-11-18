import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("página visitada abre sem internet; a não visitada mostra 'Sem internet'", async ({ page, context }) => {
  await page.goto("/demo");
  await page.waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 15_000 });
  await page.reload({ waitUntil: "networkidle" }); // agora passa pelo service worker e fica salva

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Felicidade no Serviço" })).toBeVisible();
  await page.getByRole("button", { name: "Subir meio tom" }).click();
  await expect(page.getByLabel(/^Tom [A-G]/).first()).toHaveText("Ab");

  await page.goto("/equipe");
  await expect(page.getByRole("heading", { name: "Sem internet" })).toBeVisible();
});
