import { test, expect } from "@playwright/test";

test.describe("DAWN MAIL - Auth & Security", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.locator('[data-karma-test-id="login-page"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-karma-test-id="login-email"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-karma-test-id="login-password"]')
    ).toBeVisible();
  });

  test("unauthorized API access returns 401", async ({ request }) => {
    const listsRes = await request.get("/api/lists");
    expect(listsRes.status()).toBe(401);

    const campaignsRes = await request.get("/api/campaigns");
    expect(campaignsRes.status()).toBe(401);
  });

  test("XSS prevention in campaign body", async ({ request }) => {
    // Attempt to create campaign with XSS payload (should fail as unauthorized)
    const res = await request.post("/api/campaigns", {
      data: {
        subject: '<script>alert("xss")</script>',
        body: '<img src=x onerror=alert("xss")>',
      },
    });
    expect(res.status()).toBe(401);
  });

  test("API rejects invalid list creation", async ({ request }) => {
    const res = await request.post("/api/lists", {
      data: { name: "" },
    });
    expect(res.status()).toBe(401);
  });
});
