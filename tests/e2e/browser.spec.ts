import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Fluxo completo no navegador + Auditoria WCAG AA (@axe-core): Onboarding -> Feed -> Multi-idioma -> Coleções -> Quiz -> Refinador -> LGPD", async ({ page }) => {
  await page.goto("/");

  // 1. Onboarding sem paywall bloqueante
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Pular" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  // 2. Auditoria automatizada de acessibilidade (WCAG 2.1 A/AA) na tela principal
  const a11yResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(a11yResults.violations).toEqual([]);

  // 3. Feed visível + troca de idioma ES-ES e volta para PT-BR
  await expect(page.getByRole("heading", { name: "eloquência" })).toBeVisible();
  await page.getByLabel("Idioma do léxico").selectOption("es-ES");
  await expect(page.getByRole("heading", { name: "elocuencia" })).toBeVisible();
  await page.getByLabel("Idioma do léxico").selectOption("pt-BR");
  await expect(page.getByRole("heading", { name: "eloquência" })).toBeVisible();

  // 4. Favoritar palavra e criar nova coleção
  await page.getByRole("button", { name: "Salvar palavra" }).first().click();
  await expect(page.getByRole("button", { name: /Coleções \(1\)/ })).toBeVisible();
  await page.getByRole("button", { name: /Coleções \(1\)/ }).click();
  await page.getByPlaceholder(/Nome da nova coleção/i).fill("Reuniões Executivas");
  await page.getByRole("button", { name: "Criar coleção" }).click();
  await expect(page.getByRole("heading", { name: "Reuniões Executivas" })).toBeVisible();

  // 5. Quiz contextual
  await page.getByRole("button", { name: /Quiz & SRS/ }).click();
  await expect(page.getByRole("heading", { name: /Micro-Quiz Contextual/ })).toBeVisible();

  // 6. Refinador Web
  await page.getByRole("button", { name: /Refinador Web/ }).click();
  await page.getByRole("button", { name: "Refinar texto" }).click();
  await expect(page.getByText(/Precisamos ratificar o novo acordo/i)).toBeVisible();

  // 7. Conta, Registro/Login & LGPD
  await page.getByRole("button", { name: /Conta & Planos/ }).click();
  await expect(page.getByText(/Plano Gratuito/i)).toBeVisible();
  await page.getByRole("button", { name: "Criar Conta (Senha)" }).click();
  await page.getByPlaceholder("Seu nome").fill("Sávio E2E");
  await page.getByPlaceholder("seu@email.com").fill(`e2e-${Date.now()}@vocabulando.app`);
  await page.getByPlaceholder(/Senha/i).fill("SenhaSegura123");
  await page.getByRole("button", { name: "Registrar conta" }).click();
  await expect(page.getByText(/Conta registrada com sucesso!/i)).toBeVisible();
});
