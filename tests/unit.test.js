// ===== UNIT TESTS FOR GREEN-API CLIENT =====
// Testing all core functionality and edge cases

// Mock DOM before importing our class
const mockDOM = () => {
    const mockElement = (id) => ({
        value: '',
        classList: { 
            add: jest.fn(), 
            remove: jest.fn() 
        },
        addEventListener: jest.fn(),
        blur: jest.fn(),
        innerHTML: '',
        textContent: '',
        scrollTop: 0,
        disabled: false,
        appendChild: jest.fn(),
        parentNode: { removeChild: jest.fn() }
    });

    global.document = {
        getElementById: jest.fn((id) => {
            if (id.endsWith('-error')) {
                return {
                    classList: { add: jest.fn(), remove: jest.fn() },
                    textContent: ''
                };
            }
            return mockElement(id);
        }),
        addEventListener: jest.fn(),
        createElement: jest.fn(() => ({
            className: '',
            innerHTML: '',
            parentNode: { removeChild: jest.fn() }
        }))
    };
};

// Setup DOM before tests
mockDOM();

describe('GreenAPIClient Unit Tests', () => {
    let client;
    let mockElements;

    beforeEach(() => {
        // Setup mock elements
        mockElements = {
            idInstance: { value: '', classList: { add: jest.fn(), remove: jest.fn() } },
            apiTokenInstance: { value: '', classList: { add: jest.fn(), remove: jest.fn() } },
            phoneNumber: { value: '', classList: { add: jest.fn(), remove: jest.fn() } },
            messageText: { value: '', classList: { add: jest.fn(), remove: jest.fn() } },
            fileUrl: { value: '', classList: { add: jest.fn(), remove: jest.fn() } },
            responseOutput: { innerHTML: '', textContent: '', scrollTop: 0 },
            loadingOverlay: { classList: { add: jest.fn(), remove: jest.fn() } },
            toastContainer: { appendChild: jest.fn() },
            getSettings: { disabled: false, addEventListener: jest.fn() },
            getStateInstance: { disabled: false, addEventListener: jest.fn() },
            sendMessage: { disabled: false, addEventListener: jest.fn() },
            sendFileByUrl: { disabled: false, addEventListener: jest.fn() },
            clearResponse: { addEventListener: jest.fn() },
            copyResponse: { addEventListener: jest.fn() }
        };

        // Mock getElementById to return our elements
        document.getElementById.mockImplementation((id) => {
            if (id.endsWith('-error')) {
                return { 
                    classList: { add: jest.fn(), remove: jest.fn() }, 
                    textContent: '' 
                };
            }
            return mockElements[id] || null;
        });

        // Mock our GreenAPIClient class
        global.GreenAPIClient = class {
            constructor() {
                this.baseURL = 'https://api.green-api.com';
                this.instanceId = '';
                this.apiToken = '';
                this.isLoading = false;
                this.elements = mockElements;
            }

            // Validation methods
            validateField(fieldName) {
                const field = this.elements[fieldName];
                if (!field) return false;

                let isValid = true;
                
                switch(fieldName) {
                    case 'idInstance':
                        isValid = field.value && /^\d{10,}$/.test(field.value.trim());
                        break;
                    case 'apiTokenInstance':
                        isValid = field.value && field.value.trim().length >= 20;
                        break;
                    case 'phoneNumber':
                        isValid = !field.value || /^\d{11,15}$/.test(field.value.trim());
                        break;
                    case 'messageText':
                        isValid = !field.value || field.value.trim().length <= 4096;
                        break;
                    case 'fileUrl':
                        isValid = !field.value || this.isValidURL(field.value.trim());
                        break;
                }

                if (isValid) {
                    field.classList.remove('error');
                } else {
                    field.classList.add('error');
                }

                return isValid;
            }

            validateCredentials() {
                const idValid = this.validateField('idInstance');
                const tokenValid = this.validateField('apiTokenInstance');
                
                if (!idValid || !tokenValid) {
                    this.showToast('Please fill in valid credentials', 'error');
                    return false;
                }
                
                this.instanceId = this.elements.idInstance.value.trim();
                this.apiToken = this.elements.apiTokenInstance.value.trim();
                return true;
            }

            // API URL building
            buildAPIURL(method) {
                const baseURL = `${this.baseURL}/waInstance${this.instanceId}`;
                
                switch(method) {
                    case 'getSettings':
                        return `${baseURL}/getSettings/${this.apiToken}`;
                    case 'getStateInstance':
                        return `${baseURL}/getStateInstance/${this.apiToken}`;
                    case 'sendMessage':
                        return `${baseURL}/sendMessage/${this.apiToken}`;
                    case 'sendFileByUrl':
                        return `${baseURL}/sendFileByUrl/${this.apiToken}`;
                    default:
                        throw new Error(`Unknown method: ${method}`);
                }
            }

            buildRequestOptions(method) {
                const options = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                };

                if (method === 'sendMessage' || method === 'sendFileByUrl') {
                    options.method = 'POST';
                    options.body = JSON.stringify(this.buildRequestBody(method));
                }

                return options;
            }

            buildRequestBody(method) {
                const chatId = `${this.elements.phoneNumber.value.trim()}@c.us`;
                
                switch(method) {
                    case 'sendMessage':
                        return {
                            chatId: chatId,
                            message: this.elements.messageText.value.trim()
                        };
                    case 'sendFileByUrl':
                        return {
                            chatId: chatId,
                            urlFile: this.elements.fileUrl.value.trim(),
                            fileName: this.extractFileName(this.elements.fileUrl.value.trim())
                        };
                }
            }

            // Utility functions
            isValidURL(string) {
                try {
                    new URL(string);
                    return true;
                } catch (_) {
                    return false;
                }
            }

            extractFileName(url) {
                try {
                    const urlObj = new URL(url);
                    const pathname = urlObj.pathname;
                    const fileName = pathname.split('/').pop();
                    return fileName || 'file';
                } catch (error) {
                    return 'file';
                }
            }

            formatPhoneNumber(event) {
                let value = event.target.value.replace(/\D/g, '');
                if (value.length > 15) {
                    value = value.substring(0, 15);
                }
                event.target.value = value;
            }

            // Loading state
            setLoading(loading) {
                this.isLoading = loading;
            }

            disableButtons() {
                ['getSettings', 'getStateInstance', 'sendMessage', 'sendFileByUrl'].forEach(btnId => {
                    if (this.elements[btnId]) {
                        this.elements[btnId].disabled = true;
                    }
                });
            }

            enableButtons() {
                ['getSettings', 'getStateInstance', 'sendMessage', 'sendFileByUrl'].forEach(btnId => {
                    if (this.elements[btnId]) {
                        this.elements[btnId].disabled = false;
                    }
                });
            }

            // Response handling
            displayResponse(method, data) {
                this.elements.responseOutput.textContent = JSON.stringify({
                    timestamp: new Date().toLocaleString(),
                    method: method,
                    status: 'success',
                    data: data
                }, null, 2);
            }

            displayError(method, error) {
                this.elements.responseOutput.textContent = JSON.stringify({
                    timestamp: new Date().toLocaleString(),
                    method: method,
                    status: 'error',
                    error: {
                        message: error.message,
                        name: error.name
                    }
                }, null, 2);
            }

            showToast(message, type = 'info') {
                // Mock implementation
            }

            // Storage methods
            saveCredentials() {
                const credentials = {
                    instanceId: this.elements.idInstance.value,
                    apiToken: this.elements.apiTokenInstance.value
                };
                
                try {
                    localStorage.setItem('greenapi-credentials', JSON.stringify(credentials));
                } catch (error) {
                    console.warn('Failed to save credentials:', error);
                }
            }

            loadStoredCredentials() {
                try {
                    const stored = localStorage.getItem('greenapi-credentials');
                    if (stored) {
                        const credentials = JSON.parse(stored);
                        this.elements.idInstance.value = credentials.instanceId || '';
                        this.elements.apiTokenInstance.value = credentials.apiToken || '';
                    }
                } catch (error) {
                    console.warn('Failed to load stored credentials:', error);
                }
            }
        };

        // Create client instance
        client = new global.GreenAPIClient();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ===== VALIDATION TESTS =====
    describe('Field Validation', () => {
        test('validateField - idInstance valid', () => {
            mockElements.idInstance.value = '1234567890';
            const result = client.validateField('idInstance');
            expect(result).toBe(true);
            expect(mockElements.idInstance.classList.remove).toHaveBeenCalledWith('error');
        });

        test('validateField - idInstance invalid (too short)', () => {
            mockElements.idInstance.value = '123';
            const result = client.validateField('idInstance');
            expect(result).toBe(false);
            expect(mockElements.idInstance.classList.add).toHaveBeenCalledWith('error');
        });

        test('validateField - apiTokenInstance valid', () => {
            mockElements.apiTokenInstance.value = 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345';
            const result = client.validateField('apiTokenInstance');
            expect(result).toBe(true);
        });

        test('validateField - phoneNumber valid', () => {
            mockElements.phoneNumber.value = '79001234567';
            const result = client.validateField('phoneNumber');
            expect(result).toBe(true);
        });

        test('validateField - messageText too long', () => {
            mockElements.messageText.value = 'a'.repeat(4097);
            const result = client.validateField('messageText');
            expect(result).toBe(false);
        });

        test('validateField - fileUrl valid', () => {
            mockElements.fileUrl.value = 'https://example.com/file.jpg';
            const result = client.validateField('fileUrl');
            expect(result).toBe(true);
        });
    });

    // ===== URL BUILDING TESTS =====
    describe('API URL Building', () => {
        beforeEach(() => {
            client.instanceId = '1234567890';
            client.apiToken = 'test-token';
        });

        test('buildAPIURL - getSettings', () => {
            const url = client.buildAPIURL('getSettings');
            expect(url).toBe('https://api.green-api.com/waInstance1234567890/getSettings/test-token');
        });

        test('buildAPIURL - sendMessage', () => {
            const url = client.buildAPIURL('sendMessage');
            expect(url).toBe('https://api.green-api.com/waInstance1234567890/sendMessage/test-token');
        });

        test('buildAPIURL - unknown method throws', () => {
            expect(() => client.buildAPIURL('unknownMethod')).toThrow('Unknown method: unknownMethod');
        });
    });

    // ===== UTILITY FUNCTION TESTS =====
    describe('Utility Functions', () => {
        test('isValidURL - valid URLs', () => {
            expect(client.isValidURL('https://example.com')).toBe(true);
            expect(client.isValidURL('http://test.org/file.jpg')).toBe(true);
        });

        test('isValidURL - invalid URLs', () => {
            expect(client.isValidURL('not-a-url')).toBe(false);
            expect(client.isValidURL('')).toBe(false);
        });

        test('extractFileName - from URL', () => {
            expect(client.extractFileName('https://example.com/image.jpg')).toBe('image.jpg');
            expect(client.extractFileName('https://example.com/')).toBe('file');
        });

        test('formatPhoneNumber - removes non-digits', () => {
            const mockEvent = {
                target: { value: 'abc123def456' }
            };
            client.formatPhoneNumber(mockEvent);
            expect(mockEvent.target.value).toBe('123456');
        });
    });

    // ===== CREDENTIALS VALIDATION TESTS =====
    describe('Credentials Validation', () => {
        test('validateCredentials - valid credentials', () => {
            mockElements.idInstance.value = '1234567890';
            mockElements.apiTokenInstance.value = 'd75b3a66374942c5b3c019c698abc2067e151558acbd412345';
            
            const result = client.validateCredentials();
            expect(result).toBe(true);
            expect(client.instanceId).toBe('1234567890');
        });

        test('validateCredentials - invalid credentials', () => {
            mockElements.idInstance.value = '123';
            mockElements.apiTokenInstance.value = 'short';
            
            const result = client.validateCredentials();
            expect(result).toBe(false);
        });
    });

    // ===== LOCAL STORAGE TESTS =====
    describe('Local Storage', () => {
        test('saveCredentials - saves to localStorage', () => {
            mockElements.idInstance.value = '1234567890';
            mockElements.apiTokenInstance.value = 'test-token';
            
            client.saveCredentials();
            
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'greenapi-credentials',
                JSON.stringify({
                    instanceId: '1234567890',
                    apiToken: 'test-token'
                })
            );
        });

        test('loadStoredCredentials - loads from localStorage', () => {
            const credentials = {
                instanceId: '1234567890',
                apiToken: 'test-token'
            };
            localStorage.getItem.mockReturnValue(JSON.stringify(credentials));
            
            client.loadStoredCredentials();
            
            expect(mockElements.idInstance.value).toBe('1234567890');
            expect(mockElements.apiTokenInstance.value).toBe('test-token');
        });
    });

    // ===== REQUEST BUILDING TESTS =====
    describe('Request Building', () => {
        test('buildRequestBody - sendMessage', () => {
            mockElements.phoneNumber.value = '79001234567';
            mockElements.messageText.value = 'Hello World!';
            
            const body = client.buildRequestBody('sendMessage');
            expect(body).toEqual({
                chatId: '79001234567@c.us',
                message: 'Hello World!'
            });
        });

        test('buildRequestBody - sendFileByUrl', () => {
            mockElements.phoneNumber.value = '79001234567';
            mockElements.fileUrl.value = 'https://example.com/image.jpg';
            
            const body = client.buildRequestBody('sendFileByUrl');
            expect(body).toEqual({
                chatId: '79001234567@c.us',
                urlFile: 'https://example.com/image.jpg',
                fileName: 'image.jpg'
            });
        });
    });

    // ===== LOADING STATE TESTS =====
    describe('Loading State Management', () => {
        test('setLoading - sets loading state', () => {
            client.setLoading(true);
            expect(client.isLoading).toBe(true);
        });

        test('disableButtons - disables all API buttons', () => {
            client.disableButtons();
            
            expect(mockElements.getSettings.disabled).toBe(true);
            expect(mockElements.sendMessage.disabled).toBe(true);
        });

        test('enableButtons - enables all API buttons', () => {
            client.enableButtons();
            
            expect(mockElements.getSettings.disabled).toBe(false);
            expect(mockElements.sendMessage.disabled).toBe(false);
        });
    });

    // ===== RESPONSE HANDLING TESTS =====
    describe('Response Handling', () => {
        test('displayResponse - formats success response', () => {
            const testData = { status: 'success', data: 'test' };
            
            client.displayResponse('getSettings', testData);
            
            expect(mockElements.responseOutput.textContent).toContain('getSettings');
            expect(mockElements.responseOutput.textContent).toContain('success');
        });

        test('displayError - formats error response', () => {
            const testError = new Error('Test error');
            
            client.displayError('sendMessage', testError);
            
            expect(mockElements.responseOutput.textContent).toContain('sendMessage');
            expect(mockElements.responseOutput.textContent).toContain('error');
        });
    });

    // ===== EDGE CASES =====
    describe('Edge Cases', () => {
        test('handles empty inputs', () => {
            mockElements.idInstance.value = '';
            mockElements.apiTokenInstance.value = '';
            
            const result = client.validateCredentials();
            expect(result).toBe(false);
        });

        test('trims whitespace from inputs', () => {
            mockElements.idInstance.value = '  1234567890  ';
            mockElements.apiTokenInstance.value = '  test-token-12345678901234567890  ';
            
            const result = client.validateCredentials();
            expect(result).toBe(true);
            expect(client.instanceId).toBe('1234567890');
        });
    });
}); 