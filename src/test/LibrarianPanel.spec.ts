/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

test.describe("Librarian Panel Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the sign-in page and log in as an admin
    await page.goto("/SignIn");
    await page.getByPlaceholder("Email").fill("unicorn@free.com");
    await page.getByPlaceholder("Password").fill("unicorn");
    await page.getByRole("button", { name: /Sign In/i }).click();

    // Navigate to the Librarian Panel page
    await page.waitForURL("**/librarianPanel");
  });

  // [Verification] Checks if the main heading "Librarian Panel" is visible on the page
  test("renders the librarian panel page with title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Librarian Panel/i })).toBeVisible();
  });

  // [Verification] Verifies that the form for adding a book is rendered and functional
  test("renders the add book form and allows adding a book", async ({ page }) => {
    // Fill out the form fields
    await page.getByPlaceholder("Title").fill("Test Book Title");
    await page.getByPlaceholder("Author").fill("Test Author");
    await page.getByPlaceholder("Genres (comma separated)").fill("Fiction, Mystery");
    await page.getByPlaceholder("Year").fill("2023");
    await page.getByPlaceholder("Publisher").fill("Test Publisher");
    await page.getByPlaceholder("Language").fill("English");
    // await page.getByRole("combobox", { name: /Availability/i }).selectOption("true");

    // Click the "Add Book to Library" button
    await page.getByRole("button", { name: /Add Book to Library/i }).click();

    // Verify that a success message is displayed
    await expect(page.getByText(/Book "Test Book Title" added to database/i)).toBeVisible();
  });

  // [Verification] Verifies that the form can be reset
  test("resets the add book form", async ({ page }) => {
    // Fill out the form fields
    await page.getByPlaceholder("Title").fill("Test Book Title");
    await page.getByPlaceholder("Author").fill("Test Author");

    // Click the "Clear Form" button
    await page.getByRole("button", { name: /Clear Form/i }).click();

    // Verify that the form fields are cleared
    await expect(page.getByPlaceholder("Title")).toHaveValue("");
    await expect(page.getByPlaceholder("Author")).toHaveValue("");
  });

  // [Verification] Verifies that the CSV upload functionality works
  test("uploads a CSV file and processes books", async ({ page }) => {
    // Select a CSV file for upload
    const filePath = "C:/Users/Asus/Desktop/khai/4C_2S/diploma/data/check1.csv"; 
    await page.setInputFiles('input[type="file"]', filePath);

    // Click the "Upload CSV" button
    await page.getByRole("button", { name: /Upload CSV/i }).click();

    // Wait for the upload to complete
    await page.waitForTimeout(5000);

    // Verify that after success redirect to the library page
    await page.waitForURL("**/library");
  });

});