/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

test.describe("Sign Up Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

// [Verification] Checks if the Sign Up page renders the main heading, email, password, nickname input fields, and the Sign Up button.
  test("renders form with inputs and button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Sign Up/i })).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByPlaceholder("Nickname")).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign Up/i })).toBeVisible();
  });

// [Verification] Verifies that the Sign Up button is initially disabled when the form fields are empty.
  test("shows error if form submitted empty", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Sign Up/i })).toBeDisabled();
  });

 // [Verification] Checks if a user can fill out the signup form with valid data and successfully submit it, leading to a redirect after successful signup.
  test("can fill and submit signup form", async ({ page }) => {
    const randomEmail = `user${Date.now()}@test.com`;

    await page.getByPlaceholder("Email").fill(randomEmail);
    await page.getByPlaceholder("Password").fill("TestPassword123!");
    await page.getByPlaceholder("Nickname").fill("TestUser");
    await page.getByRole("button", { name: /Sign Up/i }).click();
    // Wait for redirect or check for success behavior
    await page.waitForURL("**/");
  });

});
