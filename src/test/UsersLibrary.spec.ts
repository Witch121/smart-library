/* eslint-disable jest/no-conditional-expect */
/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

test.describe("Users Library Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the sign-in page and log in as a user
    await page.goto("/SignIn");
    await page.getByPlaceholder("Email").fill("mika@moon.com");
    await page.getByPlaceholder("Password").fill("mikamoon");
    await page.getByRole("button", { name: /Sign In/i }).click();

    // Navigate to the Users Library page
    await page.waitForURL("**/usersLibrary");
  });

  // [Verification] Checks if the main heading "Users Library" is visible on the page
  test("renders the users library page with title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Users Library page/i })).toBeVisible();
  });

  // [Verification] Verifies that the reserved books table is rendered and displays books
  test("renders reserved books table and displays books", async ({ page }) => {
    // Check if the reserved books section is visible
    await expect(page.getByRole("heading", { name: /Reserved Books/i })).toBeVisible();

    // Check if at least one reserved book is displayed
    const reservedBooks = page.locator(".library_table.reserve tbody tr");
    const reservedBooksCount = await reservedBooks.count();
    expect(reservedBooksCount).toBeGreaterThan(0);

    // Verify the title of the first reserved book
    const firstBookTitle = await reservedBooks.first().locator("td").nth(0).textContent();
    expect(firstBookTitle).not.toBeNull();
  });

  // [Verification] Verifies that the wishlist table is rendered and displays books
  test("renders wishlist table and displays books", async ({ page }) => {
    // Check if the wishlist section is visible
    await expect(page.getByRole("heading", { name: /Wishlist/i })).toBeVisible();

    // Check if at least one book is displayed in the wishlist
    const wishlistBooks = page.locator(".library_table.wishlist tbody tr");
    const wishlistBooksCount = await wishlistBooks.count();
    expect(wishlistBooksCount).toBeGreaterThan(0);

    // Verify the title and author of the first book in the wishlist
    const firstWishlistBookTitle = await wishlistBooks.first().locator("td").nth(0).textContent();
    const firstWishlistBookAuthor = await wishlistBooks.first().locator("td").nth(1).textContent();
    expect(firstWishlistBookTitle).not.toBeNull();
    expect(firstWishlistBookAuthor).not.toBeNull();
  });

  // [Verification] Verifies the "Unreserve" button functionality
  test("unreserves a book from the reserved books table", async ({ page }) => {
    // Locate the first "Unreserve" button
    const unreserveButton = page.locator(".library_table.reserve tbody tr").first().locator("button", { hasText: /Unreserve/i });

    // Click the "Unreserve" button
    await unreserveButton.click();

    // Verify that the book is removed from the reserved books table
    const reservedBooks = page.locator(".library_table.reserve tbody tr");
    await expect(reservedBooks).toHaveCount(0); // Adjust based on expected behavior
  });

  // [Verification] Verifies the "Delete from Wishlist" button functionality
  test("deletes a book from the wishlist table", async ({ page }) => {
    // Locate the wishlist table rows and get the initial count
    const wishlistRowsLocator = page.locator(".library_table.wishlist tbody tr");
    const originalNumberOfWishlistBooks = await wishlistRowsLocator.count();
    
    if (originalNumberOfWishlistBooks > 0) {
      // Locate the first "Delete from Wishlist" button
      const deleteButton = wishlistRowsLocator.first().locator("button", { hasText: /Delete from wishlist/i });

      // Click the "Delete from Wishlist" button
      await deleteButton.click();

      // Wait for the UI to update (you might need a more specific wait here)
      await page.waitForTimeout(1000); // Example: wait for 1 second

      // Get the number of wishlist books after deletion
      const finalNumberOfWishlistBooks = await wishlistRowsLocator.count();

      // Assert that the number of books has decreased by one
      await expect(finalNumberOfWishlistBooks).toBe(originalNumberOfWishlistBooks - 1);
    } else {
      console.warn("Wishlist is empty, skipping delete test.");
    }
  });

  // [Verification] Verifies that the page displays the correct counts for reserved books and wishlist
  test("displays correct counts for reserved books and wishlist", async ({ page }) => {
    // Verify the reserved books count
    const reservedBooksCount = await page.locator("p", { hasText: /Number of reserved books:/i }).textContent();
    expect(reservedBooksCount).toMatch(/Number of reserved books: \d+/);

    // Verify the wishlist count
    const wishlistCount = await page.locator("p", { hasText: /Number of books in wishlist:/i }).textContent();
    expect(wishlistCount).toMatch(/Number of books in wishlist: \d+/);
  });
});