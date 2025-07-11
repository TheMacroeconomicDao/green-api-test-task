// ===== END-TO-END TESTS FOR GREEN-API INTERFACE =====
// Testing complete user workflows and UI interactions

const { test, expect } = require('@playwright/test');

test.describe('GREEN-API E2E Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('http://localhost:8000');
        
        // Wait for application to load
        await page.waitForSelector('.app-container');
        
        // Clear any existing localStorage
        await page.evaluate(() => localStorage.clear());
    });

    // ===== BASIC UI TESTS =====
    test.describe('Basic UI Functionality', () => {
        test('page loads with all required elements', async ({ page }) => {
            // Check header
            await expect(page.locator('.header-title')).toContainText('GREEN API');
            await expect(page.locator('.header-subtitle')).toContainText('WhatsApp API Integration');
            
            // Check input fields
            await expect(page.locator('#idInstance')).toBeVisible();
            await expect(page.locator('#apiTokenInstance')).toBeVisible();
            await expect(page.locator('#phoneNumber')).toBeVisible();
            await expect(page.locator('#messageText')).toBeVisible();
            await expect(page.locator('#fileUrl')).toBeVisible();
            
            // Check buttons
            await expect(page.locator('#getSettings')).toBeVisible();
            await expect(page.locator('#getStateInstance')).toBeVisible();
            await expect(page.locator('#sendMessage')).toBeVisible();
            await expect(page.locator('#sendFileByUrl')).toBeVisible();
            
            // Check response area
            await expect(page.locator('#responseOutput')).toBeVisible();
            await expect(page.locator('.response-placeholder')).toBeVisible();
        });

        test('responsive design works on mobile', async ({ page }) => {
            // Set mobile viewport
            await page.setViewportSize({ width: 375, height: 667 });
            
            // Check elements are still visible and usable
            await expect(page.locator('.app-container')).toBeVisible();
            await expect(page.locator('#idInstance')).toBeVisible();
            await expect(page.locator('#getSettings')).toBeVisible();
            
            // Check mobile-specific styling
            const container = page.locator('.content-grid');
            const styles = await container.evaluate(el => getComputedStyle(el));
            expect(styles.gridTemplateColumns).toBe('1fr'); // Single column on mobile
        });

        test('dark theme is applied correctly', async ({ page }) => {
            const body = page.locator('body');
            const backgroundColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);
            
            // Should have dark background
            expect(backgroundColor).toMatch(/rgb\(1[0-9], 1[0-9], 1[0-9]\)/);
        });
    });

    // ===== FORM VALIDATION TESTS =====
    test.describe('Form Validation', () => {
        test('validates idInstance field', async ({ page }) => {
            const field = page.locator('#idInstance');
            const errorElement = page.locator('#idInstance-error');
            
            // Test invalid input
            await field.fill('123');
            await field.blur();
            
            await expect(errorElement).toBeVisible();
            await expect(errorElement).toContainText('Invalid instance ID format');
            await expect(field).toHaveClass(/error/);
            
            // Test valid input
            await field.fill('1234567890');
            await field.blur();
            
            await expect(errorElement).not.toBeVisible();
            await expect(field).not.toHaveClass(/error/);
        });

        test('validates apiTokenInstance field', async ({ page }) => {
            const field = page.locator('#apiTokenInstance');
            const errorElement = page.locator('#apiTokenInstance-error');
            
            // Test invalid input
            await field.fill('short');
            await field.blur();
            
            await expect(errorElement).toBeVisible();
            await expect(errorElement).toContainText('API Token too short');
            
            // Test valid input
            await field.fill('d75b3a66374942c5b3c019c698abc2067e151558acbd412345');
            await field.blur();
            
            await expect(errorElement).not.toBeVisible();
        });

        test('validates phone number field', async ({ page }) => {
            const field = page.locator('#phoneNumber');
            const errorElement = page.locator('#phoneNumber-error');
            
            // Test non-numeric input gets filtered
            await field.fill('abc123def456');
            await expect(field).toHaveValue('123456');
            
            // Test too short number
            await field.fill('123');
            await field.blur();
            
            await expect(errorElement).toBeVisible();
            await expect(errorElement).toContainText('Phone number should be 11-15 digits');
            
            // Test valid number
            await field.fill('79001234567');
            await field.blur();
            
            await expect(errorElement).not.toBeVisible();
        });

        test('validates message text field', async ({ page }) => {
            const field = page.locator('#messageText');
            const errorElement = page.locator('#messageText-error');
            
            // Test very long message
            const longMessage = 'a'.repeat(4097);
            await field.fill(longMessage);
            await field.blur();
            
            await expect(errorElement).toBeVisible();
            await expect(errorElement).toContainText('Message too long');
            
            // Test valid message
            await field.fill('Hello World!');
            await field.blur();
            
            await expect(errorElement).not.toBeVisible();
        });

        test('validates file URL field', async ({ page }) => {
            const field = page.locator('#fileUrl');
            const errorElement = page.locator('#fileUrl-error');
            
            // Test invalid URL
            await field.fill('not-a-url');
            await field.blur();
            
            await expect(errorElement).toBeVisible();
            await expect(errorElement).toContainText('Invalid URL format');
            
            // Test valid URL
            await field.fill('https://example.com/file.jpg');
            await field.blur();
            
            await expect(errorElement).not.toBeVisible();
        });
    });

    // ===== KEYBOARD SHORTCUTS TESTS =====
    test.describe('Keyboard Shortcuts', () => {
        test('Ctrl+1 triggers getSettings', async ({ page }) => {
            // Fill valid credentials
            await page.fill('#idInstance', '1234567890');
            await page.fill('#apiTokenInstance', 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345');
            
            // Mock API response
            await page.route('**/getSettings/**', route => {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true })
                });
            });
            
            // Press Ctrl+1
            await page.keyboard.press('Control+1');
            
            // Check loading state appears
            await expect(page.locator('#loadingOverlay')).toBeVisible();
            
            // Wait for response
            await page.waitForSelector('#loadingOverlay.hidden');
            
            // Check response is displayed
            await expect(page.locator('#responseOutput')).toContainText('getSettings');
        });

        test('Ctrl+K clears response', async ({ page }) => {
            // Add some content to response
            await page.evaluate(() => {
                document.getElementById('responseOutput').textContent = 'Some response content';
            });
            
            // Press Ctrl+K
            await page.keyboard.press('Control+k');
            
            // Check response is cleared
            await expect(page.locator('.response-placeholder')).toBeVisible();
        });

        test('Ctrl+Enter in textarea sends message', async ({ page }) => {
            // Fill all required fields
            await page.fill('#idInstance', '1234567890');
            await page.fill('#apiTokenInstance', 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345');
            await page.fill('#phoneNumber', '79001234567');
            await page.fill('#messageText', 'Test message');
            
            // Mock API response
            await page.route('**/sendMessage/**', route => {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ idMessage: 'test123' })
                });
            });
            
            // Focus textarea and press Ctrl+Enter
            await page.focus('#messageText');
            await page.keyboard.press('Control+Enter');
            
            // Check API call was made
            await expect(page.locator('#loadingOverlay')).toBeVisible();
        });
    });

    // ===== API INTERACTION TESTS =====
    test.describe('API Interactions', () => {
        test('successful getSettings call', async ({ page }) => {
            const mockResponse = {
                webhookUrl: 'https://webhook.site/test',
                delaySendMessagesMilliseconds: 1000,
                markIncomingMessagesReaded: 'no'
            };
            
            // Mock successful API response
            await page.route('**/getSettings/**', route => {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(mockResponse)
                });
            });
            
            // Fill credentials and click button
            await page.fill('#idInstance', '1234567890');
            await page.fill('#apiTokenInstance', 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345');
            await page.click('#getSettings');
            
            // Wait for loading to complete
            await page.waitForSelector('#loadingOverlay.hidden');
            
            // Check success toast appears
            await expect(page.locator('.toast.success')).toBeVisible();
            await expect(page.locator('.toast')).toContainText('getSettings completed successfully');
            
            // Check response is displayed
            await expect(page.locator('#responseOutput')).toContainText('webhookUrl');
            await expect(page.locator('#responseOutput')).toContainText('success');
        });

        test('API error handling', async ({ page }) => {
            // Mock API error
            await page.route('**/getSettings/**', route => {
                route.fulfill({
                    status: 401,
                    statusText: 'Unauthorized'
                });
            });
            
            // Fill credentials and click button
            await page.fill('#idInstance', '1234567890');
            await page.fill('#apiTokenInstance', 'invalid-token');
            await page.click('#getSettings');
            
            // Wait for loading to complete
            await page.waitForSelector('#loadingOverlay.hidden');
            
            // Check error toast appears
            await expect(page.locator('.toast.error')).toBeVisible();
            await expect(page.locator('.toast')).toContainText('getSettings failed');
            
            // Check error response is displayed
            await expect(page.locator('#responseOutput')).toContainText('error');
            await expect(page.locator('#responseOutput')).toContainText('HTTP 401');
        });

        test('prevents concurrent API calls', async ({ page }) => {
            // Mock slow API response
            await page.route('**/getSettings/**', route => {
                setTimeout(() => {
                    route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({ success: true })
                    });
                }, 1000);
            });
            
            // Fill credentials
            await page.fill('#idInstance', '1234567890');
            await page.fill('#apiTokenInstance', 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345');
            
            // Click first button
            await page.click('#getSettings');
            
            // Immediately try to click another button
            await page.click('#getStateInstance');
            
            // Should show warning toast
            await expect(page.locator('.toast.info')).toBeVisible();
            await expect(page.locator('.toast')).toContainText('Please wait for the current request to complete');
        });

        test('sendMessage with all required fields', async ({ page }) => {
            const mockResponse = { idMessage: 'BAE515F2C53A5A1582C5D8B95CF4F4C0' };
            
            await page.route('**/sendMessage/**', route => {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(mockResponse)
                });
            });
            
            // Fill all required fields
            await page.fill('#idInstance', '1234567890');
            await page.fill('#apiTokenInstance', 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345');
            await page.fill('#phoneNumber', '79001234567');
            await page.fill('#messageText', 'Hello from E2E test!');
            
            await page.click('#sendMessage');
            
            // Wait and check success
            await page.waitForSelector('#loadingOverlay.hidden');
            await expect(page.locator('.toast.success')).toBeVisible();
            await expect(page.locator('#responseOutput')).toContainText('BAE515F2C53A5A1582C5D8B95CF4F4C0');
        });

        test('sendFileByUrl with valid URL', async ({ page }) => {
            const mockResponse = { idMessage: 'BAE515F2C53A5A1582C5D8B95CF4F4C1' };
            
            await page.route('**/sendFileByUrl/**', route => {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(mockResponse)
                });
            });
            
            // Fill all required fields
            await page.fill('#idInstance', '1234567890');
            await page.fill('#apiTokenInstance', 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345');
            await page.fill('#phoneNumber', '79001234567');
            await page.fill('#fileUrl', 'https://example.com/test.jpg');
            
            await page.click('#sendFileByUrl');
            
            await page.waitForSelector('#loadingOverlay.hidden');
            await expect(page.locator('.toast.success')).toBeVisible();
            await expect(page.locator('#responseOutput')).toContainText('BAE515F2C53A5A1582C5D8B95CF4F4C1');
        });
    });

    // ===== LOCAL STORAGE TESTS =====
    test.describe('Local Storage Persistence', () => {
        test('saves and restores credentials', async ({ page }) => {
            // Fill credentials
            await page.fill('#idInstance', '1234567890');
            await page.fill('#apiTokenInstance', 'test-token-12345678901234567890');
            
            // Trigger save (happens on input)
            await page.locator('#idInstance').blur();
            
            // Reload page
            await page.reload();
            await page.waitForSelector('.app-container');
            
            // Check credentials are restored
            await expect(page.locator('#idInstance')).toHaveValue('1234567890');
            await expect(page.locator('#apiTokenInstance')).toHaveValue('test-token-12345678901234567890');
        });

        test('handles corrupted localStorage gracefully', async ({ page }) => {
            // Corrupt localStorage
            await page.evaluate(() => {
                localStorage.setItem('greenapi-credentials', 'invalid-json');
            });
            
            // Reload page
            await page.reload();
            
            // Should load without errors
            await expect(page.locator('.app-container')).toBeVisible();
            await expect(page.locator('#idInstance')).toHaveValue('');
        });
    });

    // ===== RESPONSE HANDLING TESTS =====
    test.describe('Response Area Functionality', () => {
        test('copy response button works', async ({ page }) => {
            // Add some content to response
            await page.evaluate(() => {
                document.getElementById('responseOutput').textContent = '{"test": "data"}';
            });
            
            // Grant clipboard permissions
            await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
            
            // Click copy button
            await page.click('#copyResponse');
            
            // Check success toast
            await expect(page.locator('.toast.success')).toBeVisible();
            await expect(page.locator('.toast')).toContainText('Response copied to clipboard');
            
            // Verify clipboard content
            const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
            expect(clipboardContent).toBe('{"test": "data"}');
        });

        test('copy empty response shows warning', async ({ page }) => {
            // Ensure response is empty
            await page.evaluate(() => {
                document.getElementById('responseOutput').innerHTML = `
                    <div class="response-placeholder">
                        <div class="placeholder-icon">📡</div>
                        <p>API responses will appear here...</p>
                    </div>
                `;
            });
            
            await page.click('#copyResponse');
            
            // Check info toast
            await expect(page.locator('.toast.info')).toBeVisible();
            await expect(page.locator('.toast')).toContainText('Nothing to copy');
        });

        test('clear response button works', async ({ page }) => {
            // Add some content to response
            await page.evaluate(() => {
                document.getElementById('responseOutput').textContent = 'Some response content';
            });
            
            await page.click('#clearResponse');
            
            // Check response is cleared
            await expect(page.locator('.response-placeholder')).toBeVisible();
            await expect(page.locator('#responseOutput')).toContainText('API responses will appear here');
        });
    });

    // ===== VALIDATION ERROR SCENARIOS =====
    test.describe('Validation Error Scenarios', () => {
        test('shows error when trying API call without credentials', async ({ page }) => {
            // Try to call API without filling credentials
            await page.click('#getSettings');
            
            // Should show validation error toast
            await expect(page.locator('.toast.error')).toBeVisible();
            await expect(page.locator('.toast')).toContainText('Please fill in valid credentials');
        });

        test('shows error when trying sendMessage without phone/message', async ({ page }) => {
            // Fill only credentials
            await page.fill('#idInstance', '1234567890');
            await page.fill('#apiTokenInstance', 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345');
            
            // Try to send message without phone/message
            await page.click('#sendMessage');
            
            await expect(page.locator('.toast.error')).toBeVisible();
            await expect(page.locator('.toast')).toContainText('Phone number and message are required');
        });

        test('shows error when trying sendFileByUrl without phone/URL', async ({ page }) => {
            // Fill only credentials
            await page.fill('#idInstance', '1234567890');
            await page.fill('#apiTokenInstance', 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345');
            
            await page.click('#sendFileByUrl');
            
            await expect(page.locator('.toast.error')).toBeVisible();
            await expect(page.locator('.toast')).toContainText('Phone number and file URL are required');
        });
    });

    // ===== ACCESSIBILITY TESTS =====
    test.describe('Accessibility', () => {
        test('has proper ARIA labels', async ({ page }) => {
            await expect(page.locator('label[for="idInstance"]')).toBeVisible();
            await expect(page.locator('label[for="apiTokenInstance"]')).toBeVisible();
            await expect(page.locator('label[for="phoneNumber"]')).toBeVisible();
            await expect(page.locator('label[for="messageText"]')).toBeVisible();
            await expect(page.locator('label[for="fileUrl"]')).toBeVisible();
        });

        test('supports keyboard navigation', async ({ page }) => {
            // Tab through form elements
            await page.keyboard.press('Tab');
            await expect(page.locator('#idInstance')).toBeFocused();
            
            await page.keyboard.press('Tab');
            await expect(page.locator('#apiTokenInstance')).toBeFocused();
            
            await page.keyboard.press('Tab');
            await expect(page.locator('#phoneNumber')).toBeFocused();
        });

        test('has sufficient color contrast', async ({ page }) => {
            // Check button text has good contrast
            const button = page.locator('#getSettings');
            const styles = await button.evaluate(el => {
                const computed = getComputedStyle(el);
                return {
                    backgroundColor: computed.backgroundColor,
                    color: computed.color
                };
            });
            
            // Green button should have white text (good contrast)
            expect(styles.color).toMatch(/rgb\(255, 255, 255\)/);
        });
    });

    // ===== PERFORMANCE TESTS =====
    test.describe('Performance', () => {
        test('page loads within acceptable time', async ({ page }) => {
            const startTime = Date.now();
            
            await page.goto('http://localhost:8000');
            await page.waitForSelector('.app-container');
            
            const loadTime = Date.now() - startTime;
            expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds
        });

        test('handles large response data', async ({ page }) => {
            const largeData = { data: 'x'.repeat(100000) };
            
            await page.route('**/getSettings/**', route => {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(largeData)
                });
            });
            
            await page.fill('#idInstance', '1234567890');
            await page.fill('#apiTokenInstance', 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345');
            
            const startTime = Date.now();
            await page.click('#getSettings');
            await page.waitForSelector('#loadingOverlay.hidden');
            const responseTime = Date.now() - startTime;
            
            expect(responseTime).toBeLessThan(5000); // Should handle large data in under 5 seconds
            await expect(page.locator('#responseOutput')).toContainText('data');
        });
    });

    // ===== EDGE CASES =====
    test.describe('Edge Cases', () => {
        test('handles special characters in input fields', async ({ page }) => {
            const specialMessage = 'Hello! 🌟 Special chars: @#$%^&*()_+-=[]{}|;:,.<>?';
            
            await page.fill('#messageText', specialMessage);
            await expect(page.locator('#messageText')).toHaveValue(specialMessage);
        });

        test('handles very long phone numbers', async ({ page }) => {
            const longNumber = '123456789012345678901234567890';
            
            await page.fill('#phoneNumber', longNumber);
            
            // Should be truncated to 15 digits
            const actualValue = await page.locator('#phoneNumber').inputValue();
            expect(actualValue).toBe('123456789012345');
        });

        test('handles network timeout', async ({ page }) => {
            // Mock network timeout
            await page.route('**/getSettings/**', route => {
                // Don't fulfill the request, simulating timeout
            });
            
            await page.fill('#idInstance', '1234567890');
            await page.fill('#apiTokenInstance', 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345');
            
            await page.click('#getSettings');
            
            // Wait for reasonable timeout
            await page.waitForTimeout(5000);
            
            // Should show some indication of timeout/error
            await expect(page.locator('.toast.error')).toBeVisible();
        });
    });
}); 