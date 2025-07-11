// ===== E2E TESTS: API INTEGRATION & NETWORK HANDLING =====

const { test, expect } = require('@playwright/test');

test.describe('API Integration & Network Handling', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  // ===== REAL API CALLS WITH MOCKING =====
  test.describe('Real fetch() Calls to GREEN-API', () => {
    test('should make correct getSettings API call', async ({ page }) => {
      // Mock successful API response
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            wid: '79001234567@c.us',
            countryInstance: 'Russia',
            typeAccount: 'trial',
            webhookUrl: '',
            delaySendMessagesMilliseconds: 1000,
            markIncomingMessagesReaded: 'no',
            markIncomingMessagesReadedOnReply: 'no',
            sharedSession: 'yes'
          })
        });
      });

      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      await page.click('#getSettings');
      
      // Wait for response to appear
      await page.waitForTimeout(1000);
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      const responseText = await responseOutput.textContent();
      
      expect(responseText).toContain('getSettings');
      expect(responseText).toContain('success');
      expect(responseText).toContain('Russia');
    });

    test('should make correct sendMessage API call', async ({ page }) => {
      // Mock successful API response
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            idMessage: 'BAE5F4D22F9C6D1C'
          })
        });
      });

      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      await page.fill('#phoneNumber', '79001234567');
      await page.fill('#messageText', 'Hello from GREEN API Test!');
      
      await page.click('#sendMessage');
      
      // Wait for response to appear
      await page.waitForTimeout(1000);
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      const responseText = await responseOutput.textContent();
      
      expect(responseText).toContain('sendMessage');
      expect(responseText).toContain('BAE5F4D22F9C6D1C');
    });

    test('should make correct sendFileByUrl API call', async ({ page }) => {
      // Mock successful API response
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            idMessage: 'FILE123456789'
          })
        });
      });

      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      await page.fill('#phoneNumber', '79001234567');
      await page.fill('#fileUrl', 'https://example.com/test-image.jpg');
      
      await page.click('#sendFileByUrl');
      
      // Wait for response to appear
      await page.waitForTimeout(1000);
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      const responseText = await responseOutput.textContent();
      
      expect(responseText).toContain('sendFileByUrl');
      expect(responseText).toContain('FILE123456789');
    });
  });

  // ===== REAL API ERROR HANDLING =====
  test.describe('Network Error Handling', () => {
    test('should handle 401 Unauthorized error', async ({ page }) => {
      // Use real API with invalid credentials to test actual error handling
      await page.fill('#idInstance', '0000000000');
      await page.fill('#apiTokenInstance', 'invalid-token');
      
      await page.click('#getSettings');
      
      // Wait for error response
      await page.waitForTimeout(2000);
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      const responseText = await responseOutput.textContent();
      
      expect(responseText).toContain('error');
      expect(responseText).toContain('401');
      expect(responseText).toContain('Unauthorized');
    });

    test('should handle 404 Not Found error', async ({ page }) => {
      // Mock 404 response
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not Found' })
        });
      });

      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      await page.click('#getSettings');
      
      // Wait for error response
      await page.waitForTimeout(1000);
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      const responseText = await responseOutput.textContent();
      
      expect(responseText).toContain('error');
      expect(responseText).toContain('404');
    });

    test('should handle network timeout', async ({ page }) => {
      // Mock slow/timeout response
      await page.route('**/api.green-api.com/**', async route => {
        // Simulate timeout by delaying then failing
        await page.waitForTimeout(1000);
        await route.abort('timedout');
      });

      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      await page.click('#getSettings');
      
      // Wait for error response
      await page.waitForTimeout(2000);
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      const responseText = await responseOutput.textContent();
      
      expect(responseText).toContain('error');
      expect(responseText).toMatch(/network|timeout|failed/i);
    });

    test('should handle malformed JSON response', async ({ page }) => {
      // Mock malformed JSON
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{"invalid": json syntax'
        });
      });

      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      await page.click('#getSettings');
      
      // Wait for error response
      await page.waitForTimeout(1000);
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      const responseText = await responseOutput.textContent();
      
      expect(responseText).toContain('error');
      expect(responseText).toMatch(/parse|json|invalid/i);
    });

    test('should handle CORS errors', async ({ page }) => {
      // Mock CORS error
      await page.route('**/api.green-api.com/**', async route => {
        await route.abort('blockedbyclient');
      });

      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      await page.click('#getSettings');
      
      // Wait for error response
      await page.waitForTimeout(1000);
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      const responseText = await responseOutput.textContent();
      
      expect(responseText).toContain('error');
    });
  });

  // ===== RATE LIMITING & CONCURRENT REQUESTS =====
  test.describe('Rate Limiting Behavior', () => {
    test('should handle 429 Too Many Requests', async ({ page }) => {
      // Mock rate limiting response
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: 60
          })
        });
      });

      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      await page.click('#getSettings');
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      const responseText = await responseOutput.textContent();
      
      expect(responseText).toContain('error');
      expect(responseText).toContain('429');
      expect(responseText).toMatch(/rate.*limit|too.*many/i);
    });

    test('should prevent multiple simultaneous requests', async ({ page }) => {
      let requestCount = 0;
      
      // Track requests
      await page.route('**/api.green-api.com/**', async route => {
        requestCount++;
        await page.waitForTimeout(500); // Simulate slow response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ test: 'data' })
        });
      });

      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      // Click multiple times rapidly
      await page.click('#getSettings');
      await page.click('#getSettings');
      await page.click('#getSettings');
      
      await page.waitForTimeout(1000);
      
      // Should only make one request (buttons disabled during request)
      expect(requestCount).toBe(1);
    });
  });

  // ===== RESPONSE PARSING & VALIDATION =====
  test.describe('Response Parsing & Validation', () => {
    test('should parse and validate successful responses', async ({ page }) => {
      const mockResponse = {
        wid: '79001234567@c.us',
        countryInstance: 'Russia',
        typeAccount: 'trial',
        webhookUrl: 'https://mywebhook.com/webhook',
        delaySendMessagesMilliseconds: 1000,
        markIncomingMessagesReaded: 'no',
        markIncomingMessagesReadedOnReply: 'no',
        sharedSession: 'yes',
        outgoingAPIMessageWebhook: 'yes',
        incomingWebhook: 'yes',
        deviceWebhook: 'no'
      };

      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponse)
        });
      });

      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      await page.click('#getSettings');
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      const responseText = await responseOutput.textContent();
      
      // Verify JSON structure is preserved
      expect(responseText).toContain('79001234567@c.us');
      expect(responseText).toContain('Russia');
      expect(responseText).toContain('outgoingAPIMessageWebhook');
      
      // Verify response format
      expect(responseText).toContain('"status": "success"');
      expect(responseText).toContain('"method": "getSettings"');
    });

    test('should handle empty or null responses', async ({ page }) => {
      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'null'
        });
      });

      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      await page.click('#getSettings');
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      const responseText = await responseOutput.textContent();
      
      expect(responseText).toContain('null');
      expect(responseText).toContain('success'); // Still successful HTTP status
    });

    test('should handle large responses', async ({ page }) => {
      // Create large response object
      const largeResponse = {
        data: Array.from({length: 1000}, (_, i) => ({
          id: i,
          message: `Test message ${i}`,
          details: 'x'.repeat(100)
        }))
      };

      await page.route('**/api.green-api.com/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(largeResponse)
        });
      });

      await page.fill('#idInstance', '1234567890');
      await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
      
      await page.click('#getSettings');
      
      const responseOutput = page.locator('#responseOutput');
      await expect(responseOutput).not.toBeEmpty();
      
      // Check scroll functionality for large content
      const scrollHeight = await responseOutput.evaluate(el => el.scrollHeight);
      expect(scrollHeight).toBeGreaterThan(1000);
    });
  });
}); 