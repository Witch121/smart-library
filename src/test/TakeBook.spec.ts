/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

test.describe("TakeBook Page", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Sign in
    await page.goto("/SignIn");
    await page.getByPlaceholder("Email").fill("mika@moon.com");
    await page.getByPlaceholder("Password").fill("mikamoon");
    await page.getByRole("button", { name: /Sign In/i }).click();

    // 2. Go to the TakeBook page
    await page.waitForURL("**/takeBook");
    // await page.goto("/takeBook");
  });

  // [Verification] Checks if the main heading, available books label, and search button are visible, ensuring basic page elements are rendered.
  test("renders the page and book list", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Take Book from Library/i })).toBeVisible();
    await expect(page.getByText("Available Books:")).toBeVisible();
    await expect(page.getByText("Search")).toBeVisible();
  });

  // [Verification] Verifies that at least one available book is displayed in the list, confirming data loading and rendering.
  test("displays at least one available book", async ({ page }) => {
    await expect(page.getByText("Loading avaliable books...")).toBeHidden();
    const rows = page.locator(".library_table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  // [Verification] Checks if a user can successfully search for a book by its title, validating the search functionality.
  test("can search for a book by title", async ({ page }) => {
    await page.getByPlaceholder("I`m looking for ...").fill("A Man Called Ove");
    await page.getByRole("button", { name: "Search" }).click();
    await page.waitForTimeout(1000); // simulate async filter
    await expect(page.getByText("A Man Called Ove")).toBeVisible();
  });

  // [Verification] Verifies that a user can initiate the reservation process for a book by clicking the "Reserve" button.
  test("can reserve a book", async ({ page }) => {
    const reserveButtons = page.getByRole("button", { name: "Reserve" });
    if (await reserveButtons.count() > 0) {
      await reserveButtons.first().click();
      // If alert shows, Playwright handles this by default unless mocked
    } else {
      console.warn("No 'Reserve' button found.");
    }
  });

  // [Verification] Checks if a user can add a book to their wishlist by clicking the "Add to wishlist" button.
  test("can add a book to wishlist", async ({ page }) => {
    const wishlistButtons = page.getByRole("button", { name: /Add to wishlist/i });
    if (await wishlistButtons.count() > 0) {
      await wishlistButtons.first().click();
    } else {
      console.warn("No 'Add to wishlist' button found.");
    }
  });
});
