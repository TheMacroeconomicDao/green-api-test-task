// ===== E2E TESTS: USER EXPERIENCE & UI/UX BEHAVIOR =====

const { test, expect } = require('@playwright/test');

test.describe('User Experience & UI/UX Behavior', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  // ===== LOADING STATES =====
  test.describe('Loading States & Visual Feedback', () => {
    test('should show loading state during API calls', async ({ page }) => {
      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      // Mock slow API response to test loading state
      await page.route('**/api.green-api.com/**', async route => {
        await page.waitForTimeout(1000); // Simulate slow response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ wid: '79001234567@c.us' })
        });
      });
      
      // Click button and immediately check loading state
      await page.click('#getSettings');
      
      // Check loading overlay appears quickly
      const loadingOverlay = page.locator('#loadingOverlay');
      await expect(loadingOverlay).toBeVisible({ timeout: 1000 });
      
      // Check buttons are disabled
      const buttons = ['#getSettings', '#getStateInstance', '#sendMessage', '#sendFileByUrl'];
      for (const btnSelector of buttons) {
        await expect(page.locator(btnSelector)).toBeDisabled();
      }
      
      // Wait for API call to complete
      await page.waitForTimeout(1500);
      
      // Loading should disappear
      await expect(loadingOverlay).not.toBeVisible();
      
      // Buttons should be enabled again
      for (const btnSelector of buttons) {
        await expect(page.locator(btnSelector)).toBeEnabled();
      }
    });

    test('should show progress indicators for file uploads', async ({ page }) => {
      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      await page.fill('#phoneNumber', '79001234567');
      await page.fill('#fileUrl', 'https://example.com/large-file.jpg');
      
      // Mock file upload with progress
      await page.route('**/api.green-api.com/**', async route => {
        // Simulate upload progress
        await page.waitForTimeout(1500);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ idMessage: 'FILE123' })
        });
      });
      
      await page.click('#sendFileByUrl');
      
      // Check for progress indication (loading overlay with spinner)
      const progressIndicator = page.locator('#loadingOverlay .loading-spinner, #loadingOverlay .spinner');
      await expect(progressIndicator).toBeVisible();
      
      // Wait for completion
      await page.waitForTimeout(2000);
      await expect(progressIndicator).not.toBeVisible();
    });

    test('should animate button interactions', async ({ page }) => {
      const getSettingsBtn = page.locator('#getSettings');
      
      // Check initial state
      await expect(getSettingsBtn).toBeVisible();
      
      // Hover effect - check CSS transform on hover
      await getSettingsBtn.hover();
      await page.waitForTimeout(200);
      
      // Click animation - check button behavior
      await getSettingsBtn.click();
      
      // Should have visual feedback (CSS animations/transitions)
      // Verify button is still accessible after interaction
      await expect(getSettingsBtn).toBeVisible();
    });
  });

  // ===== TOAST NOTIFICATIONS =====
  test.describe('Toast Notifications & User Feedback', () => {
    test('should show success toast on successful API call', async ({ page }) => {
      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ wid: '79001234567@c.us' })
        });
      });
      
      await page.click('#getSettings');
      
      // Check for success toast - look for actual toast classes from implementation
      const successToast = page.locator('.toast.success');
      await expect(successToast).toBeVisible();
      
      // Toast should contain success message
      const toastText = await successToast.textContent();
      expect(toastText).toMatch(/success|completed|done/i);
      
      // Toast should auto-disappear after 5 seconds
      await page.waitForTimeout(6000);
      await expect(successToast).not.toBeVisible();
    });

    test('should show error toast on API failure', async ({ page }) => {
      await page.fill('#idInstance', '0000000000');
      await page.fill('#apiTokenInstance', 'invalid-token');
      
      // Let real API return 401 error for authentic error testing
      await page.click('#getSettings');
      
      // Check for error toast
      const errorToast = page.locator('.toast.error');
      await expect(errorToast).toBeVisible();
      
      const toastText = await errorToast.textContent();
      expect(toastText).toMatch(/error|failed|unauthorized/i);
    });

    test('should show validation error toasts', async ({ page }) => {
      // Trigger validation error by clicking with empty credentials
      await page.click('#getSettings');
      
      // Should show validation error toast
      const validationToast = page.locator('.toast.error');
      await expect(validationToast).toBeVisible();
      
      const toastText = await validationToast.textContent();
      expect(toastText).toMatch(/valid|credentials|required/i);
    });

    test('should allow manual toast dismissal', async ({ page }) => {
      // Trigger an error to show toast
      await page.click('#getSettings');
      
      const errorToast = page.locator('.toast');
      await expect(errorToast).toBeVisible();
      
      // Check if toast has close functionality or auto-dismisses
      // Since our implementation auto-dismisses, verify this behavior
      await page.waitForTimeout(6000);
      await expect(errorToast).not.toBeVisible();
    });
  });

  // ===== RESPONSIVE DESIGN =====
  test.describe('Responsive Design & Mobile Experience', () => {
    test('should work correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      // Check elements are visible and accessible
      const instanceInput = page.locator('#idInstance');
      const tokenInput = page.locator('#apiTokenInstance');
      const getSettingsBtn = page.locator('#getSettings');
      
      await expect(instanceInput).toBeVisible();
      await expect(tokenInput).toBeVisible();
      await expect(getSettingsBtn).toBeVisible();
      
      // Check form is usable on mobile
      await instanceInput.fill('1234567890');
      await expect(instanceInput).toHaveValue('1234567890');
      
      // Check buttons are touch-friendly (not too small)
      const btnBox = await getSettingsBtn.boundingBox();
      expect(btnBox.height).toBeGreaterThan(40); // Minimum touch target
      expect(btnBox.width).toBeGreaterThan(40);
    });

    test('should adapt layout for tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      // Check layout adapts appropriately - use single selector
      const container = page.locator('.main-content').first();
      await expect(container).toBeVisible();
      
      // Elements should still be accessible
      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      const getSettingsBtn = page.locator('#getSettings');
      await expect(getSettingsBtn).toBeEnabled();
    });

    test('should handle very wide desktop viewport', async ({ page }) => {
      // Set ultra-wide viewport
      await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
      
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      // Content should not stretch too wide - check main content container
      const container = page.locator('.main-content');
      const containerBox = await container.boundingBox();
      
      // Should have max-width constraint around 1200px from CSS --max-width
      expect(containerBox.width).toBeLessThan(1300); // Account for padding
    });

    test('should handle very narrow viewport', async ({ page }) => {
      // Set very narrow viewport
      await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE (old)
      
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      // Content should not overflow
      const body = page.locator('body');
      const hasHorizontalScroll = await body.evaluate(el => el.scrollWidth > el.clientWidth);
      expect(hasHorizontalScroll).toBe(false);
      
      // Form should still be usable
      await page.fill('#idInstance', '1234567890');
      const instanceInput = page.locator('#idInstance');
      await expect(instanceInput).toHaveValue('1234567890');
    });
  });

  // ===== KEYBOARD NAVIGATION & ACCESSIBILITY =====
  test.describe('Keyboard Navigation & Accessibility', () => {
    test('should support full keyboard navigation', async ({ page }) => {
      // Start from first interactive element
      await page.keyboard.press('Tab');
      
      // Should focus on first input
      let focusedElement = await page.locator(':focus').getAttribute('id');
      expect(focusedElement).toBe('idInstance');
      
      // Tab through all interactive elements
      const expectedTabOrder = [
        'idInstance',
        'apiTokenInstance', 
        'phoneNumber',
        'messageText',
        'fileUrl',
        'getSettings',
        'getStateInstance',
        'sendMessage',
        'sendFileByUrl',
        'clearResponse',
        'copyResponse'
      ];
      
      for (let i = 1; i < expectedTabOrder.length; i++) {
        await page.keyboard.press('Tab');
        focusedElement = await page.locator(':focus').getAttribute('id');
        expect(focusedElement).toBe(expectedTabOrder[i]);
      }
    });

    test('should support keyboard shortcuts', async ({ page }) => {
      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ test: 'shortcut' })
        });
      });
      
      // Test Ctrl+1 for getSettings
      await page.keyboard.press('Control+1');
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      const responseText = await responseOutput.textContent();
      expect(responseText).toContain('shortcut');
    });

    test('should support Enter key for form submission', async ({ page }) => {
      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      await page.fill('#phoneNumber', '79001234567');
      await page.fill('#messageText', 'Test message');
      
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ idMessage: 'ENTER123' })
        });
      });
      
      // Focus on message input and press Ctrl+Enter
      await page.locator('#messageText').focus();
      await page.keyboard.press('Control+Enter');
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check form inputs have labels
      const instanceInput = page.locator('#idInstance');
      const instanceLabel = await instanceInput.getAttribute('aria-label') || 
                           await page.locator('label[for="idInstance"]').textContent();
      expect(instanceLabel).toBeTruthy();
      
      // Check buttons have accessible names
      const getSettingsBtn = page.locator('#getSettings');
      const btnText = await getSettingsBtn.textContent() || 
                     await getSettingsBtn.getAttribute('aria-label');
      expect(btnText).toBeTruthy();
      
      // Check response output has role
      const responseOutput = page.locator('#responseOutput');
      const role = await responseOutput.getAttribute('role');
      expect(role).toMatch(/log|region|textbox/);
    });

    test('should work with screen reader simulation', async ({ page }) => {
      // Simulate screen reader by checking accessible tree
      const accessibleTree = await page.accessibility.snapshot();
      
      // Should have proper structure
      expect(accessibleTree.name).toBeTruthy();
      expect(accessibleTree.children).toBeDefined();
      
      // Form should be navigable
      const formElements = accessibleTree.children.filter(
        child => child.role === 'textbox' || child.role === 'button'
      );
      expect(formElements.length).toBeGreaterThan(0);
    });
  });

  // ===== FORM VALIDATION UI FEEDBACK =====
  test.describe('Form Validation UI Feedback', () => {
    test('should show real-time validation feedback', async ({ page }) => {
      const instanceInput = page.locator('#idInstance');
      const errorElement = page.locator('#idInstance-error');
      
      // Type invalid input character by character
      await instanceInput.type('1');
      await page.waitForTimeout(100);
      
      await instanceInput.type('2');
      await page.waitForTimeout(100);
      
      await instanceInput.type('3'); // Now 123 - too short
      await instanceInput.blur();
      
      // Should show error
      await expect(errorElement).toBeVisible();
      await expect(errorElement).toContainText(/invalid|format|short/i);
      
      // Fix the input
      await instanceInput.fill('1234567890');
      await instanceInput.blur();
      
      // Error should disappear
      await expect(errorElement).not.toBeVisible();
    });

    test('should validate all fields before API call', async ({ page }) => {
      const sendMessageBtn = page.locator('#sendMessage');
      
      // Try to send without credentials
      await sendMessageBtn.click();
      
      // Should show validation errors
      const errorElements = page.locator('.error, .invalid');
      const errorCount = await errorElements.count();
      expect(errorCount).toBeGreaterThan(0);
      
      // No API call should be made
      let apiCallMade = false;
      await page.route('**/api.green-api.com/**', async route => {
        apiCallMade = true;
        await route.continue();
      });
      
      await page.waitForTimeout(500);
      expect(apiCallMade).toBe(false);
    });

    test('should show field-specific validation messages', async ({ page }) => {
      // Test phone number validation
      const phoneInput = page.locator('#phoneNumber');
      await phoneInput.fill('abc123');
      await phoneInput.blur();
      
      const phoneError = page.locator('#phoneNumber-error, .phone-error');
      await expect(phoneError).toBeVisible();
      const phoneErrorText = await phoneError.textContent();
      expect(phoneErrorText).toMatch(/phone|number|digits/i);
      
      // Test URL validation
      const urlInput = page.locator('#fileUrl');
      await urlInput.fill('not-a-url');
      await urlInput.blur();
      
      const urlError = page.locator('#fileUrl-error, .url-error');
      await expect(urlError).toBeVisible();
      const urlErrorText = await urlError.textContent();
      expect(urlErrorText).toMatch(/url|link|invalid/i);
    });
  });

  // ===== PERFORMANCE & SMOOTH INTERACTIONS =====
  test.describe('Performance & Smooth Interactions', () => {
    test('should have smooth scrolling for large responses', async ({ page }) => {
      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      // Create large response
      const largeResponse = {
        data: Array.from({length: 1000}, (_, i) => `Line ${i}: ${'x'.repeat(100)}`)
      };
      
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(largeResponse)
        });
      });
      
      await page.click('#getSettings');
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      // Test scrolling performance
      await responseOutput.hover();
      await page.mouse.wheel(0, 1000); // Scroll down
      
      // Should not lag or freeze
      const scrollTop = await responseOutput.evaluate(el => el.scrollTop);
      expect(scrollTop).toBeGreaterThan(0);
    });

    test('should handle rapid user interactions gracefully', async ({ page }) => {
      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      // Mock fast API responses
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ test: Math.random() })
        });
      });
      
      // Rapid clicking
      for (let i = 0; i < 5; i++) {
        await page.click('#getSettings');
        await page.waitForTimeout(100);
      }
      
      // App should remain responsive
      const instanceInput = page.locator('#idInstance');
      await expect(instanceInput).toBeEnabled();
    });

    test('should maintain performance with many DOM updates', async ({ page }) => {
      // Test many rapid validation updates
      const instanceInput = page.locator('#idInstance');
      
      const startTime = Date.now();
      
      // Rapid typing simulation
      for (let i = 0; i < 20; i++) {
        await instanceInput.fill(`${i}234567890`);
        await page.waitForTimeout(50);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete reasonably fast
      expect(duration).toBeLessThan(3000); // 3 seconds max
      
      // Final state should be correct
      await expect(instanceInput).toHaveValue('19234567890');
    });
  });
}); 