// ===== E2E TESTS: DOM INTERACTIONS & EVENT HANDLING =====

const { test, expect } = require('@playwright/test');

test.describe('DOM Interactions & Event Handling', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  // ===== DOM MANIPULATION TESTS =====
  test.describe('DOM Manipulation', () => {
    test('should manipulate DOM elements correctly', async ({ page }) => {
      // Test getElementById functionality
      const instanceInput = page.locator('#idInstance');
      const tokenInput = page.locator('#apiTokenInstance');
      
      await expect(instanceInput).toBeVisible();
      await expect(tokenInput).toBeVisible();
      
      // Test value setting and getting
      await instanceInput.fill('1234567890');
      await expect(instanceInput).toHaveValue('1234567890');
      
      await tokenInput.fill('test-token-12345678901234567890');
      await expect(tokenInput).toHaveValue('test-token-12345678901234567890');
    });

    test('should add/remove CSS classes correctly', async ({ page }) => {
      const instanceInput = page.locator('#idInstance');
      
      // Test error class addition
      await instanceInput.fill('123'); // Invalid short ID
      await instanceInput.blur();
      
      // Wait for validation and check error class
      await page.waitForTimeout(100);
      await expect(instanceInput).toHaveClass(/error/);
      
      // Test error class removal
      await instanceInput.fill('1234567890'); // Valid ID
      await instanceInput.blur();
      
      await page.waitForTimeout(100);
      await expect(instanceInput).not.toHaveClass(/error/);
    });

    test('should handle form elements state changes', async ({ page }) => {
      const buttons = [
        '#getSettings',
        '#getStateInstance', 
        '#sendMessage',
        '#sendFileByUrl'
      ];
      
      // Initially buttons should be enabled
      for (const buttonSelector of buttons) {
        await expect(page.locator(buttonSelector)).toBeEnabled();
      }
      
      // Fill credentials and test API button
      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      // Click getSettings and check loading state
      await page.click('#getSettings');
      
      // Buttons should be disabled during request
      await page.waitForTimeout(50);
      for (const buttonSelector of buttons) {
        await expect(page.locator(buttonSelector)).toBeDisabled();
      }
    });
  });

  // ===== EVENT HANDLING TESTS =====
  test.describe('Event Handling', () => {
    test('should handle click events correctly', async ({ page }) => {
      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      // Mock API response
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            wid: '79001234567@c.us',
            countryInstance: 'Russia',
            typeAccount: 'trial'
          })
        });
      });
      
      // Test click event
      await page.click('#getSettings');
      
      // Check that response was displayed
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      const responseText = await responseOutput.textContent();
      expect(responseText).toContain('getSettings');
      expect(responseText).toContain('success');
    });

    test('should handle form submission events', async ({ page }) => {
      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      await page.fill('#phoneNumber', '79001234567');
      await page.fill('#messageText', 'Test message');
      
      // Mock API response
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            idMessage: 'BAE5F4D22F9C6D1C'
          })
        });
      });
      
      // Test form submission via button
      await page.click('#sendMessage');
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
    });

    test('should handle input validation events', async ({ page }) => {
      const instanceInput = page.locator('#idInstance');
      const errorElement = page.locator('#idInstance-error');
      
      // Test blur event with invalid input
      await instanceInput.fill('abc123');
      await instanceInput.blur();
      
      await page.waitForTimeout(100);
      await expect(errorElement).toBeVisible();
      await expect(errorElement).toContainText('Invalid instance ID format');
      
      // Test blur event with valid input
      await instanceInput.fill('1234567890');
      await instanceInput.blur();
      
      await page.waitForTimeout(100);
      await expect(errorElement).not.toBeVisible();
    });

    test('should handle keyboard events', async ({ page }) => {
      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      // Test keyboard shortcuts
      await page.keyboard.press('Control+1');
      
      // Should trigger getSettings
      await page.waitForTimeout(100);
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      // Test Enter key on input
      await page.fill('#phoneNumber', '79001234567');
      await page.fill('#messageText', 'Test message');
      
      await page.locator('#messageText').press('Control+Enter');
      // Should trigger sendMessage
      await page.waitForTimeout(200);
    });
  });

  // ===== PHONE NUMBER FORMATTING =====
  test.describe('Phone Number Formatting', () => {
    test('should format phone numbers on input', async ({ page }) => {
      const phoneInput = page.locator('#phoneNumber');
      
      // Test automatic formatting
      await phoneInput.fill('+7 (900) 123-45-67');
      await phoneInput.blur();
      
      // Should remove non-digits
      await expect(phoneInput).toHaveValue('79001234567');
      
      // Test length limitation
      await phoneInput.fill('123456789012345678901234567890');
      await phoneInput.blur();
      
      const value = await phoneInput.inputValue();
      expect(value.length).toBeLessThanOrEqual(15);
    });
  });

  // ===== RESPONSE DISPLAY =====
  test.describe('Response Display', () => {
    test('should display and format responses correctly', async ({ page }) => {
      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      const mockResponse = {
        wid: '79001234567@c.us',
        countryInstance: 'Russia',
        typeAccount: 'trial',
        webhookUrl: '',
        delaySendMessagesMilliseconds: 1000
      };
      
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponse)
        });
      });
      
      await page.click('#getSettings');
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      const responseText = await responseOutput.textContent();
      
      // Check JSON formatting
      expect(responseText).toContain('"method": "getSettings"');
      expect(responseText).toContain('"status": "success"');
      expect(responseText).toContain('"wid": "79001234567@c.us"');
      expect(responseText).toContain('"countryInstance": "Russia"');
      
      // Check timestamp format
      expect(responseText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Date format
    });

    test('should clear response when requested', async ({ page }) => {
      // First add some response
      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ test: 'data' })
        });
      });
      
      await page.click('#getSettings');
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      // Clear response
      await page.click('#clearResponse');
      
      const responseText = await responseOutput.textContent();
      expect(responseText).toContain('No response yet');
    });
  });
}); 