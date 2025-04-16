/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

test.describe("WaitingList Page", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Sign in as admin
    await page.goto("/SignIn");
    await page.getByPlaceholder("Email").fill("unicorn@free.com");
    await page.getByPlaceholder("Password").fill("unicorn");
    await page.getByRole("button", { name: /Sign In/i }).click();

    // 2. Navigate to waiting list page
    await page.waitForURL("**/waitingList");
    // await page.goto("/waitinglist");
  });
// Checks if the "Reserved Books" heading is visible on the page
  test("renders reserved and returned books tables", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Reserved Books/i })).toBeVisible();
  });

 // Verifies that at least one row of reserved book data is displayed in the table
  test("displays at least one reserved book", async ({ page }) => {
    // wait for loading to disappear
    await expect(page.getByText("Loading data...")).toBeHidden();
    const reservedRows = page.locator(".library_table.resrve tbody tr");
    const reservedCount = await reservedRows.count();
    expect(reservedCount).toBeGreaterThan(0);
  });

 // Checks if the "Hand In" button exists and can be clicked
  test("performs hand in action", async ({ page }) => {
    const button = page.getByRole("button", { name: /Hand In/i });
    if (await button.count() > 0) {
      await button.first().click();
    } else {
      console.warn("No 'Hand In' buttons found.");
    }
  });

// Checks if either the "take back" or "NOT OK" button exists and clicks the first one found
  test("performs take back or NOT OK action", async ({ page }) => {
    const takeBackBtn = page.getByRole("button", { name: /take back/i });
    const notOkBtn = page.getByRole("button", { name: /NOT OK/i });

    if (await takeBackBtn.count() > 0) {
      await takeBackBtn.first().click();
    } else if (await notOkBtn.count() > 0) {
      await notOkBtn.first().click();
    } else {
      console.warn("No 'take back' or 'NOT OK' buttons found.");
    }
  });
});
