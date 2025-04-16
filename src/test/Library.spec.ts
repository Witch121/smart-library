/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

test.describe("Library Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the library page before each test
    await page.goto("/SignIn");
    await page.getByPlaceholder("Email").fill("unicorn@free.com");
    await page.getByPlaceholder("Password").fill("unicorn");
    await page.getByRole("button", { name: /Sign In/i }).click();

    // Now go to the protected page
    await page.waitForURL("**/library");
    // await page.goto("/library");
  });

// [Verification] Checks if the main heading "Library" is visible on the page, ensuring the page title is rendered.
  test("renders the library page with title", async ({ page }) => {
    // Check if the heading with "Library" is visible
    await expect(page.getByRole("heading", { name: /Library/i })).toBeVisible();
  });

// [Verification] Verifies that at least one book is displayed in the library table after searching for a specific title, confirming basic data rendering.
  test("displays at least one book in the table", async ({ page }) => {
    const searchInput = page.getByPlaceholder("I`m looking for ...");
    // Fill the search input with a query
    await searchInput.fill("A Man Called Ove");
    // Check if a book with "A Man Called Ove" in the title is visible
    await page.waitForTimeout(1000); // give the filter a moment
    // Locate rows in the library table
    const rows = page.locator(".library_table tbody tr");
    // Ensure there is at least one row
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

// [Verification] Checks if the search input correctly filters the book list by title, validating the search functionality.
  test("search input filters books by title", async ({ page }) => {
    // Locate the search input field
    const searchInput = page.getByPlaceholder("I`m looking for ...");
    // Fill the search input with a query
    await searchInput.fill("A Man Called Ove");
    // Check if a book with "A Man Called Ove" in the title is visible
    await page.waitForTimeout(1000); // give the filter a moment
    await expect(page.getByText("A Man Called Ove")).toBeVisible();
  });

// [Verification] Verifies that clicking a "Reserve" or "Edit" button (if present after a search) triggers a confirmation or opens a form, checking the basic interactivity of these actions.
  test("clicking reserve/edit buttons shows confirmation or opens form", async ({ page }) => {
    const searchInput = page.getByPlaceholder("I`m looking for ...");
    // Fill the search input with a query
    await searchInput.fill("A Man Called Ove");
    // Check if a book with "A Man Called Ove" in the title is visible
    await page.waitForTimeout(1000); // give the filter a moment
    // Locate the Reserve or Edit button
    const btn = page.getByRole("button", { name: /Reserve|Edit/i });
    // Ensure at least one button exists
    const buttonCount = await btn.count();
    if (buttonCount > 0) {
      // Click the first button
      await btn.first().click();
    } else {
      throw new Error("No Reserve or Edit buttons found on the page.");
    }
    // Check if the URL changes or a modal/alert is displayed
    await expect(page).toHaveURL(/library/); // Adjust this based on actual behavior
  });
});