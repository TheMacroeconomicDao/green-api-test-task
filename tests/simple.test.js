// ===== SIMPLE TESTS FOR GREEN-API FUNCTIONALITY =====
// Testing core functions and validations

describe('GREEN-API Application Tests', () => {
    
    // ===== UTILITY FUNCTIONS TESTS =====
    describe('Utility Functions', () => {
        test('URL validation works correctly', () => {
            const isValidURL = (string) => {
                try {
                    new URL(string);
                    return true;
                } catch (_) {
                    return false;
                }
            };

            expect(isValidURL('https://example.com')).toBe(true);
            expect(isValidURL('http://test.org/file.jpg')).toBe(true);
            expect(isValidURL('not-a-url')).toBe(false);
            expect(isValidURL('')).toBe(false);
        });

        test('File name extraction from URL', () => {
            const extractFileName = (url) => {
                try {
                    const urlObj = new URL(url);
                    const pathname = urlObj.pathname;
                    const fileName = pathname.split('/').pop();
                    return fileName || 'file';
                } catch (error) {
                    return 'file';
                }
            };

            expect(extractFileName('https://example.com/image.jpg')).toBe('image.jpg');
            expect(extractFileName('https://example.com/docs/document.pdf')).toBe('document.pdf');
            expect(extractFileName('https://example.com/')).toBe('file');
            expect(extractFileName('invalid-url')).toBe('file');
        });

        test('Phone number formatting', () => {
            const formatPhoneNumber = (value) => {
                let cleaned = value.replace(/\D/g, '');
                if (cleaned.length > 15) {
                    cleaned = cleaned.substring(0, 15);
                }
                return cleaned;
            };

            expect(formatPhoneNumber('abc123def456')).toBe('123456');
            expect(formatPhoneNumber('79001234567')).toBe('79001234567');
            expect(formatPhoneNumber('12345678901234567890')).toBe('123456789012345');
        });
    });

    // ===== VALIDATION TESTS =====
    describe('Field Validation', () => {
        test('Instance ID validation', () => {
            const validateInstanceId = (value) => {
                return value && /^\d{10,}$/.test(value.trim());
            };

            expect(validateInstanceId('1234567890')).toBe(true);
            expect(validateInstanceId('12345678901')).toBe(true);
            expect(validateInstanceId('123')).toBe(false);
            expect(validateInstanceId('abc123')).toBe(false);
            expect(validateInstanceId('')).toBe(false);
        });

        test('API Token validation', () => {
            const validateApiToken = (value) => {
                return value && value.trim().length >= 20;
            };

            expect(validateApiToken('d75b3a66374942c5b3c019c698abc2067e151558acbd412345')).toBe(true);
            expect(validateApiToken('12345678901234567890')).toBe(true);
            expect(validateApiToken('short')).toBe(false);
            expect(validateApiToken('')).toBe(false);
        });

        test('Phone number validation', () => {
            const validatePhoneNumber = (value) => {
                return !value || /^\d{11,15}$/.test(value.trim());
            };

            expect(validatePhoneNumber('79001234567')).toBe(true);
            expect(validatePhoneNumber('380123456789')).toBe(true);
            expect(validatePhoneNumber('')).toBe(true); // Optional field
            expect(validatePhoneNumber('123')).toBe(false);
            expect(validatePhoneNumber('1234567890123456789')).toBe(false);
        });

        test('Message text validation', () => {
            const validateMessageText = (value) => {
                return !value || value.trim().length <= 4096;
            };

            expect(validateMessageText('Hello World!')).toBe(true);
            expect(validateMessageText('')).toBe(true); // Optional field
            expect(validateMessageText('a'.repeat(4096))).toBe(true);
            expect(validateMessageText('a'.repeat(4097))).toBe(false);
        });

        test('File URL validation', () => {
            const isValidURL = (string) => {
                try {
                    new URL(string);
                    return true;
                } catch (_) {
                    return false;
                }
            };

            const validateFileUrl = (value) => {
                return !value || isValidURL(value.trim());
            };

            expect(validateFileUrl('https://example.com/file.jpg')).toBe(true);
            expect(validateFileUrl('')).toBe(true); // Optional field
            expect(validateFileUrl('not-a-url')).toBe(false);
        });
    });

    // ===== API URL BUILDING TESTS =====
    describe('API URL Building', () => {
        const buildAPIURL = (method, instanceId, apiToken) => {
            const baseURL = `https://api.green-api.com/waInstance${instanceId}`;
            
            switch(method) {
                case 'getSettings':
                    return `${baseURL}/getSettings/${apiToken}`;
                case 'getStateInstance':
                    return `${baseURL}/getStateInstance/${apiToken}`;
                case 'sendMessage':
                    return `${baseURL}/sendMessage/${apiToken}`;
                case 'sendFileByUrl':
                    return `${baseURL}/sendFileByUrl/${apiToken}`;
                default:
                    throw new Error(`Unknown method: ${method}`);
            }
        };

        test('builds correct URLs for all methods', () => {
            const instanceId = '1234567890';
            const apiToken = 'test-token';

            expect(buildAPIURL('getSettings', instanceId, apiToken))
                .toBe('https://api.green-api.com/waInstance1234567890/getSettings/test-token');
            
            expect(buildAPIURL('getStateInstance', instanceId, apiToken))
                .toBe('https://api.green-api.com/waInstance1234567890/getStateInstance/test-token');
            
            expect(buildAPIURL('sendMessage', instanceId, apiToken))
                .toBe('https://api.green-api.com/waInstance1234567890/sendMessage/test-token');
            
            expect(buildAPIURL('sendFileByUrl', instanceId, apiToken))
                .toBe('https://api.green-api.com/waInstance1234567890/sendFileByUrl/test-token');
        });

        test('throws error for unknown method', () => {
            expect(() => buildAPIURL('unknownMethod', '123', 'token')).toThrow('Unknown method: unknownMethod');
        });
    });

    // ===== REQUEST BODY BUILDING TESTS =====
    describe('Request Body Building', () => {
        test('builds sendMessage request body', () => {
            const buildSendMessageBody = (phoneNumber, messageText) => {
                return {
                    chatId: `${phoneNumber.trim()}@c.us`,
                    message: messageText.trim()
                };
            };

            const body = buildSendMessageBody('79001234567', 'Hello World!');
            expect(body).toEqual({
                chatId: '79001234567@c.us',
                message: 'Hello World!'
            });
        });

        test('builds sendFileByUrl request body', () => {
            const buildSendFileBody = (phoneNumber, fileUrl) => {
                const extractFileName = (url) => {
                    try {
                        const urlObj = new URL(url);
                        const pathname = urlObj.pathname;
                        const fileName = pathname.split('/').pop();
                        return fileName || 'file';
                    } catch (error) {
                        return 'file';
                    }
                };

                return {
                    chatId: `${phoneNumber.trim()}@c.us`,
                    urlFile: fileUrl.trim(),
                    fileName: extractFileName(fileUrl.trim())
                };
            };

            const body = buildSendFileBody('79001234567', 'https://example.com/image.jpg');
            expect(body).toEqual({
                chatId: '79001234567@c.us',
                urlFile: 'https://example.com/image.jpg',
                fileName: 'image.jpg'
            });
        });
    });

    // ===== CREDENTIALS VALIDATION TESTS =====
    describe('Complete Credentials Validation', () => {
        const validateCredentials = (instanceId, apiToken) => {
            const idValid = instanceId && /^\d{10,}$/.test(instanceId.trim());
            const tokenValid = apiToken && apiToken.trim().length >= 20;
            
            return idValid && tokenValid;
        };

        test('validates complete credentials', () => {
            expect(validateCredentials('1234567890', 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345')).toBe(true);
            expect(validateCredentials('123', 'short')).toBe(false);
            expect(validateCredentials('1234567890', 'short')).toBe(false);
            expect(validateCredentials('123', 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345')).toBe(false);
        });

        test('handles edge cases', () => {
            expect(validateCredentials('', '')).toBe(false);
            expect(validateCredentials('  1234567890  ', '  d75b3a66374942c5b3c019c698abc2067e151558acbd412345  ')).toBe(true);
        });
    });

    // ===== RESPONSE FORMATTING TESTS =====
    describe('Response Formatting', () => {
        test('formats success response', () => {
            const formatResponse = (method, data, status = 'success') => {
                return {
                    timestamp: new Date().toLocaleString(),
                    method: method,
                    status: status,
                    data: data
                };
            };

            const response = formatResponse('getSettings', { test: 'data' });
            expect(response.method).toBe('getSettings');
            expect(response.status).toBe('success');
            expect(response.data).toEqual({ test: 'data' });
            expect(response.timestamp).toBeDefined();
        });

        test('formats error response', () => {
            const formatErrorResponse = (method, error) => {
                return {
                    timestamp: new Date().toLocaleString(),
                    method: method,
                    status: 'error',
                    error: {
                        message: error.message,
                        name: error.name
                    }
                };
            };

            const testError = new Error('Test error');
            const response = formatErrorResponse('sendMessage', testError);
            expect(response.method).toBe('sendMessage');
            expect(response.status).toBe('error');
            expect(response.error.message).toBe('Test error');
        });
    });

    // ===== INTEGRATION SCENARIO TESTS =====
    describe('End-to-End Scenarios', () => {
        test('complete API call workflow simulation', () => {
            // Simulate user input
            const userInput = {
                instanceId: '1234567890',
                apiToken: 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345',
                phoneNumber: '79001234567',
                messageText: 'Hello from test!'
            };

            // 1. Validate credentials
            const credentialsValid = userInput.instanceId && /^\d{10,}$/.test(userInput.instanceId) &&
                                   userInput.apiToken && userInput.apiToken.length >= 20;
            expect(credentialsValid).toBe(true);

            // 2. Build API URL
            const url = `https://api.green-api.com/waInstance${userInput.instanceId}/sendMessage/${userInput.apiToken}`;
            expect(url).toBe('https://api.green-api.com/waInstance1234567890/sendMessage/d75b3a66374942c5b3c019c698abc2067e151558acbd412345');

            // 3. Build request body
            const requestBody = {
                chatId: `${userInput.phoneNumber}@c.us`,
                message: userInput.messageText
            };
            expect(requestBody).toEqual({
                chatId: '79001234567@c.us',
                message: 'Hello from test!'
            });

            // 4. Simulate request options
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            };
            expect(requestOptions.method).toBe('POST');
            expect(JSON.parse(requestOptions.body)).toEqual(requestBody);
        });
    });

    // ===== PERFORMANCE AND EDGE CASES =====
    describe('Performance and Edge Cases', () => {
        test('handles large message text', () => {
            const largeText = 'a'.repeat(4096);
            const isValid = largeText.length <= 4096;
            expect(isValid).toBe(true);

            const tooLargeText = 'a'.repeat(4097);
            const isInvalid = tooLargeText.length <= 4096;
            expect(isInvalid).toBe(false);
        });

        test('handles special characters in phone numbers', () => {
            const formatPhoneNumber = (value) => {
                return value.replace(/\D/g, '');
            };

            expect(formatPhoneNumber('+7 (900) 123-45-67')).toBe('79001234567');
            expect(formatPhoneNumber('7-900-123-45-67')).toBe('79001234567');
            expect(formatPhoneNumber('abc7def9ghi0jkl0mno1pqr2stu3vwx4yza5')).toBe('79001234567');
        });

        test('validates extreme URL cases', () => {
            const isValidURL = (string) => {
                try {
                    new URL(string);
                    return true;
                } catch (_) {
                    return false;
                }
            };

            expect(isValidURL('https://example.com/very/long/path/to/file.jpg?param1=value1&param2=value2')).toBe(true);
            expect(isValidURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')).toBe(true);
        });
    });
}); 