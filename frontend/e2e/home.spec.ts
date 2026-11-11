import { expect, test } from "@playwright/test";

test.describe("Запись в салон (/)", () => {
  test("opens and shows its content", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    const response = await page.goto("/");
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle("Запись в салон");
    await expect(page.getByText("Выберите услугу, мастера и время. Записаться можно и в нашем Telegram-боте.", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Записаться", exact: true }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});
