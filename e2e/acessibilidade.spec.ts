import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const rota of ["/entrar", "/demo", "/offline", "/nao-existe"]) {
  test(`sem problemas graves de acessibilidade em ${rota}`, async ({ page }) => {
    await page.goto(rota);
    await page.waitForLoadState("networkidle");
    // O @axe-core/playwright traz os tipos de outra versão do Playwright; o objeto é o mesmo.
    const axe = new AxeBuilder({ page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"] });
    const { violations } = await axe.withTags(["wcag2a", "wcag2aa"]).analyze();
    const graves = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(graves.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
}
