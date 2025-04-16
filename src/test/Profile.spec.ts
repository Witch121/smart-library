/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

test.describe("Profile Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the sign-in page and log in as a user
    await page.goto("/SignIn");
    await page.getByPlaceholder("Email").fill("mika@moon.com");
    await page.getByPlaceholder("Password").fill("mikamoon");
    await page.getByRole("button", { name: /Sign In/i }).click();

    // Navigate to the Profile page
    await page.waitForURL("**/profile");
  });

  // [Verification] Checks if the profile page is rendered with the correct title
  test("renders the profile page with title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Bookworm's Profile/i })).toBeVisible();
  });

  // [Verification] Verifies that user data (nickname, email, registered date) is displayed
  test("displays user data", async ({ page }) => {
    await expect(page.getByText(/Username:/i)).toBeVisible();
    await expect(page.getByText(/Email:/i)).toBeVisible();
    await expect(page.getByText(/Registered:/i)).toBeVisible();
  });

  // [Verification] Verifies that the wishlist table is rendered and displays books
  test("renders wishlist table and displays books", async ({ page }) => {
    const wishlistTable = page.locator(".library_table.wishlist");
    await expect(wishlistTable).toBeVisible();

    // Check if at least one book is displayed in the wishlist
    const wishlistBooks = wishlistTable.locator("tbody tr");
    const wishlistBooksCount = await wishlistBooks.count();
    expect(wishlistBooksCount).toBeGreaterThan(0);

    // Verify the title and author of the first book in the wishlist
    const firstWishlistBookTitle = await wishlistBooks.first().locator("strong").textContent();
    expect(firstWishlistBookTitle).not.toBeNull();
  });

  // [Verification] Verifies that the reserved books table is rendered and displays books
  test("renders reserved books table and displays books", async ({ page }) => {
    const reservedBooksTable = page.locator(".library_table.reserved");
    await expect(reservedBooksTable).toBeVisible();

    // Check if at least one book is displayed in the reserved books table
    const reservedBooks = reservedBooksTable.locator("tbody tr");
    const reservedBooksCount = await reservedBooks.count();
    expect(reservedBooksCount).toBeGreaterThan(0);

    // Verify the title and author of the first reserved book
    const firstReservedBookTitle = await reservedBooks.first().locator("strong").textContent();
    expect(firstReservedBookTitle).not.toBeNull();
  });

  // [Verification] Verifies that the current books table is rendered and displays books
  test("renders current books table and displays books", async ({ page }) => {
    const currentBooksTable = page.locator(".library_table.current");
    await expect(currentBooksTable).toBeVisible();

    // Check if at least one book is displayed in the current books table
    const currentBooks = currentBooksTable.locator("tbody tr");
    const currentBooksCount = await currentBooks.count();
    expect(currentBooksCount).toBeGreaterThan(0);

    // Verify the title and author of the first current book
    const firstCurrentBookTitle = await currentBooks.first().locator("strong").textContent();
    expect(firstCurrentBookTitle).not.toBeNull();
  });

  // [Verification] Verifies that the reading history table is rendered and displays books
  test("renders reading history table and displays books", async ({ page }) => {
    const readingHistoryTable = page.locator(".library_table.history");
    await expect(readingHistoryTable).toBeVisible();

    // Check if at least one book is displayed in the reading history table
    const readingHistoryBooks = readingHistoryTable.locator("tbody tr");
    const readingHistoryBooksCount = await readingHistoryBooks.count();
    expect(readingHistoryBooksCount).toBeGreaterThan(0);

    // Verify the title and author of the first book in the reading history
    const firstHistoryBookTitle = await readingHistoryBooks.first().locator("strong").textContent();
    expect(firstHistoryBookTitle).not.toBeNull();
  });

  // [Verification] Verifies the edit profile functionality
  test("allows editing the profile", async ({ page }) => {
    // Click the "Edit Profile" button
    await page.getByRole("button", { name: /Edit Profile/i }).click();

    // Verify that the edit form is displayed
    await expect(page.getByPlaceholder("Username")).toBeVisible();

    // Update the username
    const newNickname = "UpdatedNickname";
    await page.getByPlaceholder("Username").fill(newNickname);

    // Save the changes
    await page.getByRole("button", { name: /Save/i }).click();

    // Verify that the updated username is displayed
    await expect(page.getByText(`Username: ${newNickname}`)).toBeVisible();
  });

  // [Verification] Verifies that the avatar can be changed
  test("allows changing the avatar", async ({ page }) => {
    // Click the "Edit Profile" button
    await page.getByRole("button", { name: /Edit Profile/i }).click();

    // Select a new avatar
    const newAvatar = page.locator(".avatar-option-container").nth(1); // Select the second avatar
    await newAvatar.click();

    // Save the changes
    await page.getByRole("button", { name: /Save/i }).click();

    // Verify that the new avatar is displayed
    const avatarImg = page.locator(".profile-img");
    await expect(avatarImg).toHaveAttribute("src", /avatar2/); // Adjust based on the avatar's file name
  });
});