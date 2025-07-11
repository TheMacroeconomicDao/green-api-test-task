// ===== E2E TESTS: BROWSER APIs (localStorage, Clipboard, Service Worker) =====

const { test, expect } = require('@playwright/test');

test.describe('Browser APIs Integration', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  // ===== LOCALSTORAGE TESTS =====
  test.describe('localStorage Operations', () => {
    test('should save and load credentials from localStorage', async ({ page }) => {
      const instanceInput = page.locator('#idInstance');
      const tokenInput = page.locator('#apiTokenInstance');
      
      // Fill credentials
      await instanceInput.fill('1234567890');
      await tokenInput.fill('test-token-12345678901234567890');
      
      // Trigger save (usually happens on input change)
      await instanceInput.blur();
      await tokenInput.blur();
      
      // Wait for auto-save
      await page.waitForTimeout(100);
      
      // Check localStorage via JavaScript evaluation
      const savedCredentials = await page.evaluate(() => {
        return localStorage.getItem('greenapi-credentials');
      });
      
      expect(savedCredentials).toBeTruthy();
      
      const parsedCredentials = JSON.parse(savedCredentials);
      expect(parsedCredentials.instanceId).toBe('1234567890');
      expect(parsedCredentials.apiToken).toBe('test-token-12345678901234567890');
    });

    test('should auto-restore credentials on page load', async ({ page }) => {
      // Pre-set localStorage
      await page.evaluate(() => {
        localStorage.setItem('greenapi-credentials', JSON.stringify({
          instanceId: '9876543210',
          apiToken: 'restored-token-12345678901234567890'
        }));
      });
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      // Check if credentials were restored
      const instanceInput = page.locator('#idInstance');
      const tokenInput = page.locator('#apiTokenInstance');
      
      await expect(instanceInput).toHaveValue('9876543210');
      await expect(tokenInput).toHaveValue('restored-token-12345678901234567890');
    });

    test('should handle localStorage errors gracefully', async ({ page }) => {
      // Simulate localStorage being unavailable
      await page.addInitScript(() => {
        // Override localStorage to throw errors
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
          throw new Error('Storage quota exceeded');
        };
      });
      
      const instanceInput = page.locator('#idInstance');
      const tokenInput = page.locator('#apiTokenInstance');
      
      // This should not crash the app
      await instanceInput.fill('1234567890');
      await tokenInput.fill('test-token-12345678901234567890');
      await instanceInput.blur();
      
      // App should still work despite localStorage error
      await expect(instanceInput).toHaveValue('1234567890');
      await expect(tokenInput).toHaveValue('test-token-12345678901234567890');
    });

    test('should clear stored credentials when requested', async ({ page }) => {
      // First save some credentials
      await page.evaluate(() => {
        localStorage.setItem('greenapi-credentials', JSON.stringify({
          instanceId: '1234567890',
          apiToken: 'test-token'
        }));
      });
      
      // Reload to load credentials
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      // Check credentials are loaded
      const instanceInput = page.locator('#idInstance');
      await expect(instanceInput).toHaveValue('1234567890');
      
      // Clear credentials (if app has such functionality)
      await page.evaluate(() => {
        localStorage.removeItem('greenapi-credentials');
      });
      
      // Reload and check credentials are gone
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      await expect(instanceInput).toHaveValue('');
    });
  });

  // ===== CLIPBOARD API INTEGRATION =====
  test.describe('Clipboard API Operations', () => {
    test('should copy response to clipboard', async ({ page }) => {
      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      // Mock successful API response for copying
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
      
      await page.click('#getSettings');
      
      // Wait for response to load
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      // Grant clipboard permissions
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      
      // Copy response
      await page.click('#copyResponse');
      
      // Verify clipboard content
      const clipboardText = await page.evaluate(async () => {
        return await navigator.clipboard.readText();
      });
      
      expect(clipboardText).toContain('getSettings');
      expect(clipboardText).toContain('Russia');
      expect(clipboardText).toContain('79001234567@c.us');
    });

    test('should handle clipboard API unavailability', async ({ page }) => {
      // Mock navigator.clipboard as undefined
      await page.addInitScript(() => {
        delete window.navigator.clipboard;
      });
      
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
      await page.click('#copyResponse');
      
      // Should handle gracefully (show error toast or fallback)
      const errorToast = page.locator('.toast.error');
      await expect(errorToast).toBeVisible();
    });
  });

  // ===== SERVICE WORKER & PWA FEATURES =====
  test.describe('Service Worker & PWA Features', () => {
    test('should register service worker successfully', async ({ page }) => {
      // Check if service worker is registered
      const swRegistration = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          return !!registration;
        }
        return false;
      });
      
      expect(swRegistration).toBe(true);
    });

    test('should cache static resources', async ({ page }) => {
      // Wait for service worker to be active
      await page.waitForTimeout(1000);
      
      // Check if static resources are cached
      const staticCacheContent = await page.evaluate(async () => {
        const cacheNames = await caches.keys();
        if (cacheNames.length > 0) {
          const cache = await caches.open(cacheNames[0]);
          const requests = await cache.keys();
          return requests.map(req => req.url);
        }
        return [];
      });
      
      // Should cache at least some static resources
      expect(staticCacheContent.length).toBeGreaterThan(0);
      
      // Check for specific cached files (adjust based on actual implementation)
      const hasJSFile = staticCacheContent.some(url => url.includes('app.js') || url.includes('.js'));
      const hasCSSFile = staticCacheContent.some(url => url.includes('main.css') || url.includes('.css'));
      
      expect(hasJSFile || hasCSSFile).toBe(true);
    });

    test('should work offline with cached resources', async ({ page }) => {
      // Wait for service worker and caching
      await page.waitForTimeout(2000);
      
      // Go offline
      await page.context().setOffline(true);
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      // Basic functionality should still work
      const instanceInput = page.locator('#idInstance');
      await expect(instanceInput).toBeVisible();
      
      // Try to fill form (should work with cached JS)
      await instanceInput.fill('1234567890');
      await expect(instanceInput).toHaveValue('1234567890');
      
      // Go back online
      await page.context().setOffline(false);
    });

    test('should handle online/offline status changes', async ({ page }) => {
      // Go offline
      await page.context().setOffline(true);
      
      const isOffline = await page.evaluate(() => !navigator.onLine);
      expect(isOffline).toBe(true);
      
      // Go back online
      await page.context().setOffline(false);
      
      const isOnline = await page.evaluate(() => navigator.onLine);
      expect(isOnline).toBe(true);
    });
  });

  // ===== BROWSER COMPATIBILITY TESTS =====
  test.describe('Browser API Compatibility', () => {
    test('should handle missing modern APIs gracefully', async ({ page }) => {
      // Simulate older browser without some APIs
      await page.addInitScript(() => {
        delete window.IntersectionObserver;
        delete window.ResizeObserver;
        delete navigator.clipboard;
      });
      
      // Page should still load and work
      await page.waitForLoadState('domcontentloaded');
      
      const instanceInput = page.locator('#idInstance');
      await expect(instanceInput).toBeVisible();
      
      // Basic functionality should work
      await instanceInput.fill('1234567890');
      await expect(instanceInput).toHaveValue('1234567890');
    });

    test('should work with disabled JavaScript features', async ({ page }) => {
      // Test with some modern JS features disabled
      await page.addInitScript(() => {
        // Disable some ES6+ features simulation
        delete Array.prototype.includes;
        delete String.prototype.startsWith;
      });
      
      // App should still work with polyfills or fallbacks
      await page.waitForLoadState('domcontentloaded');
      
      const instanceInput = page.locator('#idInstance');
      await expect(instanceInput).toBeVisible();
    });
  });
}); 