// ===== INTEGRATION TESTS FOR GREEN-API =====
// Testing real API interactions and component integration

describe('GREEN-API Integration Tests', () => {
    let client;
    let fetchMock;

    beforeEach(() => {
        // Mock fetch globally
        fetchMock = jest.fn();
        global.fetch = fetchMock;

        // Setup client with mock DOM
        client = new GreenAPIClient();
        client.elements = {
            idInstance: { value: '1101123456' },
            apiTokenInstance: { value: 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345' },
            phoneNumber: { value: '79001234567' },
            messageText: { value: 'Integration test message' },
            fileUrl: { value: 'https://example.com/test.jpg' },
            responseOutput: { innerHTML: '', textContent: '', scrollTop: 0 },
            loadingOverlay: { classList: { add: jest.fn(), remove: jest.fn() } },
            toastContainer: { appendChild: jest.fn() }
        };

        client.showToast = jest.fn();
        client.displayResponse = jest.fn();
        client.displayError = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // ===== API ENDPOINT TESTS =====
    describe('API Endpoint Integration', () => {
        test('getSettings - successful request', async () => {
            const mockResponse = {
                webhookUrl: 'https://webhook.site/test',
                delaySendMessagesMilliseconds: 1000,
                markIncomingMessagesReaded: 'yes'
            };

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await client.handleAPICall('getSettings');

            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.green-api.com/waInstance1101123456/getSettings/d75b3a66374942c5b3c019c698abc2067e151558acbd412345',
                expect.objectContaining({
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                })
            );

            expect(client.displayResponse).toHaveBeenCalledWith('getSettings', mockResponse);
            expect(client.showToast).toHaveBeenCalledWith('getSettings completed successfully', 'success');
        });

        test('getStateInstance - successful request', async () => {
            const mockResponse = {
                stateInstance: 'authorized'
            };

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await client.handleAPICall('getStateInstance');

            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.green-api.com/waInstance1101123456/getStateInstance/d75b3a66374942c5b3c019c698abc2067e151558acbd412345',
                expect.objectContaining({
                    method: 'GET'
                })
            );

            expect(client.displayResponse).toHaveBeenCalledWith('getStateInstance', mockResponse);
        });

        test('sendMessage - successful request', async () => {
            const mockResponse = {
                idMessage: 'BAE515F2C5A12345'
            };

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await client.handleAPICall('sendMessage');

            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.green-api.com/waInstance1101123456/sendMessage/d75b3a66374942c5b3c019c698abc2067e151558acbd412345',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        chatId: '79001234567@c.us',
                        message: 'Integration test message'
                    })
                })
            );

            expect(client.displayResponse).toHaveBeenCalledWith('sendMessage', mockResponse);
        });

        test('sendFileByUrl - successful request', async () => {
            const mockResponse = {
                idMessage: 'BAE515F2C5A12346'
            };

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await client.handleAPICall('sendFileByUrl');

            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.green-api.com/waInstance1101123456/sendFileByUrl/d75b3a66374942c5b3c019c698abc2067e151558acbd412345',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        chatId: '79001234567@c.us',
                        urlFile: 'https://example.com/test.jpg',
                        fileName: 'test.jpg'
                    })
                })
            );

            expect(client.displayResponse).toHaveBeenCalledWith('sendFileByUrl', mockResponse);
        });
    });

    // ===== ERROR HANDLING INTEGRATION =====
    describe('API Error Handling', () => {
        test('handles 401 Unauthorized', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
            });

            await client.handleAPICall('getSettings');

            expect(client.displayError).toHaveBeenCalledWith(
                'getSettings', 
                expect.objectContaining({
                    message: 'HTTP 401: Unauthorized'
                })
            );
            expect(client.showToast).toHaveBeenCalledWith(
                expect.stringContaining('getSettings failed'), 
                'error'
            );
        });

        test('handles 403 Forbidden', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 403,
                statusText: 'Forbidden'
            });

            await client.handleAPICall('sendMessage');

            expect(client.displayError).toHaveBeenCalledWith(
                'sendMessage',
                expect.objectContaining({
                    message: 'HTTP 403: Forbidden'
                })
            );
        });

        test('handles 404 Not Found', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });

            await client.handleAPICall('getStateInstance');

            expect(client.displayError).toHaveBeenCalledWith(
                'getStateInstance',
                expect.objectContaining({
                    message: 'HTTP 404: Not Found'
                })
            );
        });

        test('handles 500 Server Error', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            await client.handleAPICall('sendFileByUrl');

            expect(client.displayError).toHaveBeenCalledWith(
                'sendFileByUrl',
                expect.objectContaining({
                    message: 'HTTP 500: Internal Server Error'
                })
            );
        });

        test('handles network errors', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'));

            await client.handleAPICall('getSettings');

            expect(client.displayError).toHaveBeenCalledWith(
                'getSettings',
                expect.objectContaining({
                    message: 'Network error'
                })
            );
        });

        test('handles invalid JSON response', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => {
                    throw new Error('Invalid JSON');
                }
            });

            await client.handleAPICall('getSettings');

            expect(client.displayError).toHaveBeenCalledWith(
                'getSettings',
                expect.objectContaining({
                    message: 'Invalid JSON'
                })
            );
        });
    });

    // ===== REAL API RESPONSE FORMATS =====
    describe('Real API Response Formats', () => {
        test('handles getSettings response format', async () => {
            const realResponse = {
                "webhookUrl": "",
                "delaySendMessagesMilliseconds": 1000,
                "markIncomingMessagesReaded": "no",
                "outgoingWebhook": "yes",
                "outgoingMessageWebhook": "yes",
                "outgoingAPIMessageWebhook": "yes",
                "incomingWebhook": "yes"
            };

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => realResponse
            });

            await client.handleAPICall('getSettings');

            expect(client.displayResponse).toHaveBeenCalledWith('getSettings', realResponse);
        });

        test('handles getStateInstance authorized response', async () => {
            const realResponse = {
                "stateInstance": "authorized"
            };

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => realResponse
            });

            await client.handleAPICall('getStateInstance');

            expect(client.displayResponse).toHaveBeenCalledWith('getStateInstance', realResponse);
        });

        test('handles getStateInstance notAuthorized response', async () => {
            const realResponse = {
                "stateInstance": "notAuthorized"
            };

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => realResponse
            });

            await client.handleAPICall('getStateInstance');

            expect(client.displayResponse).toHaveBeenCalledWith('getStateInstance', realResponse);
        });

        test('handles sendMessage success response', async () => {
            const realResponse = {
                "idMessage": "BAE515F2C53A5A1582C5D8B95CF4F4C0"
            };

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => realResponse
            });

            await client.handleAPICall('sendMessage');

            expect(client.displayResponse).toHaveBeenCalledWith('sendMessage', realResponse);
        });

        test('handles sendFileByUrl success response', async () => {
            const realResponse = {
                "idMessage": "BAE515F2C53A5A1582C5D8B95CF4F4C1"
            };

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => realResponse
            });

            await client.handleAPICall('sendFileByUrl');

            expect(client.displayResponse).toHaveBeenCalledWith('sendFileByUrl', realResponse);
        });
    });

    // ===== RATE LIMITING TESTS =====
    describe('Rate Limiting and Concurrent Requests', () => {
        test('prevents concurrent API calls', async () => {
            fetchMock.mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve({
                    ok: true,
                    json: async () => ({ success: true })
                }), 100))
            );

            // Start first call
            const firstCall = client.handleAPICall('getSettings');
            
            // Try to start second call immediately
            await client.handleAPICall('getStateInstance');

            expect(client.showToast).toHaveBeenCalledWith(
                'Please wait for the current request to complete', 
                'info'
            );

            await firstCall;
        });

        test('handles rapid successive calls', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: async () => ({ success: true })
            });

            // Wait for first call to complete
            await client.handleAPICall('getSettings');
            
            // Then immediately make another
            await client.handleAPICall('getStateInstance');

            expect(fetchMock).toHaveBeenCalledTimes(2);
        });
    });

    // ===== TIMEOUT TESTS =====
    describe('Request Timeout Handling', () => {
        test('handles slow API responses', async () => {
            jest.setTimeout(10000);

            fetchMock.mockImplementation(() =>
                new Promise(resolve => 
                    setTimeout(() => resolve({
                        ok: true,
                        json: async () => ({ delayed: true })
                    }), 5000)
                )
            );

            const start = Date.now();
            await client.handleAPICall('getSettings');
            const duration = Date.now() - start;

            expect(duration).toBeGreaterThan(4900);
            expect(client.displayResponse).toHaveBeenCalledWith('getSettings', { delayed: true });
        });

        test('handles request abort', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Request timeout'));

            await client.handleAPICall('getSettings');

            expect(client.displayError).toHaveBeenCalledWith(
                'getSettings',
                expect.objectContaining({
                    message: 'Request timeout'
                })
            );
        });
    });

    // ===== AUTHENTICATION TESTS =====
    describe('Authentication Edge Cases', () => {
        test('handles expired token', async () => {
            const errorResponse = {
                "error": "Authentication failed. Check parameters idInstance and ApiTokenInstance"
            };

            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => errorResponse
            });

            await client.handleAPICall('getSettings');

            expect(client.displayError).toHaveBeenCalledWith(
                'getSettings',
                expect.objectContaining({
                    message: 'HTTP 401: Unauthorized'
                })
            );
        });

        test('handles invalid instance ID', async () => {
            client.elements.idInstance.value = 'invalid123';
            
            const result = client.validateCredentials();
            expect(result).toBe(false);
        });

        test('handles malformed API token', async () => {
            client.elements.apiTokenInstance.value = 'short';
            
            const result = client.validateCredentials();
            expect(result).toBe(false);
        });
    });

    // ===== DATA VALIDATION INTEGRATION =====
    describe('Data Validation Integration', () => {
        test('validates phone number format before API call', async () => {
            client.elements.phoneNumber.value = '123'; // invalid

            await client.handleAPICall('sendMessage');

            expect(fetchMock).not.toHaveBeenCalled();
            expect(client.showToast).toHaveBeenCalledWith(
                'Please fill in valid phone number and message',
                'error'
            );
        });

        test('validates message content before API call', async () => {
            client.elements.messageText.value = ''; // empty

            await client.handleAPICall('sendMessage');

            expect(fetchMock).not.toHaveBeenCalled();
            expect(client.showToast).toHaveBeenCalledWith(
                'Phone number and message are required',
                'error'
            );
        });

        test('validates file URL before API call', async () => {
            client.elements.fileUrl.value = 'invalid-url';

            await client.handleAPICall('sendFileByUrl');

            expect(fetchMock).not.toHaveBeenCalled();
            expect(client.showToast).toHaveBeenCalledWith(
                'Please fill in valid phone number and file URL',
                'error'
            );
        });
    });

    // ===== REAL WORLD SCENARIOS =====
    describe('Real World Scenarios', () => {
        test('complete user workflow - settings check and message send', async () => {
            // Step 1: Check settings
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ stateInstance: 'authorized' })
            });

            await client.handleAPICall('getSettings');

            // Step 2: Send message
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ idMessage: 'BAE515F2C53A5A1582C5D8B95CF4F4C0' })
            });

            await client.handleAPICall('sendMessage');

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(client.displayResponse).toHaveBeenCalledTimes(2);
        });

        test('error recovery - retry after failure', async () => {
            // First call fails
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Server Error'
            });

            await client.handleAPICall('getSettings');
            expect(client.displayError).toHaveBeenCalled();

            // Second call succeeds
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });

            await client.handleAPICall('getSettings');
            expect(client.displayResponse).toHaveBeenCalledWith('getSettings', { success: true });
        });

        test('handles special characters in messages', async () => {
            client.elements.messageText.value = 'Hello! 🌟 Special: @#$%^&*()_+-=[]{}|;:,.<>?';

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ idMessage: 'test123' })
            });

            await client.handleAPICall('sendMessage');

            const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(sentBody.message).toBe('Hello! 🌟 Special: @#$%^&*()_+-=[]{}|;:,.<>?');
        });

        test('handles international phone numbers', async () => {
            const testNumbers = [
                '79001234567',   // Russia
                '380501234567',  // Ukraine
                '77012345678',   // Kazakhstan
                '375291234567'   // Belarus
            ];

            for (const number of testNumbers) {
                client.elements.phoneNumber.value = number;
                
                fetchMock.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ idMessage: `msg_${number}` })
                });

                await client.handleAPICall('sendMessage');

                const sentBody = JSON.parse(fetchMock.mock.calls[fetchMock.mock.calls.length - 1][1].body);
                expect(sentBody.chatId).toBe(`${number}@c.us`);
            }
        });
    });
}); 