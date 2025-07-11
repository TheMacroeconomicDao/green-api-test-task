// ===== JEST SETUP FOR GREEN-API TESTS =====
// Setup global mocks and configurations

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock navigator.clipboard
const clipboardMock = {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
};
global.navigator = {
    ...global.navigator,
    clipboard: clipboardMock,
};

// Mock performance
global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
};

// Mock URL constructor
global.URL = URL;

// Mock console to track console calls in tests
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Setup DOM globals
Object.defineProperty(window, 'location', {
    value: {
        href: 'http://localhost:8000',
        origin: 'http://localhost:8000',
        protocol: 'http:',
        host: 'localhost:8000',
        pathname: '/',
        search: '',
        hash: ''
    },
    writable: true
});

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 0);
};

global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
};

// Clear all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
});

// Custom matchers
expect.extend({
    toBeValidPhoneNumber(received) {
        const pass = /^\d{11,15}$/.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid phone number`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid phone number (11-15 digits)`,
                pass: false,
            };
        }
    },
    
    toBeValidInstanceId(received) {
        const pass = /^\d{10,}$/.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid instance ID`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid instance ID (10+ digits)`,
                pass: false,
            };
        }
    },
    
    toBeValidApiToken(received) {
        const pass = received && received.length >= 20;
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid API token`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid API token (20+ characters)`,
                pass: false,
            };
        }
    }
});

// Test timeout configuration
jest.setTimeout(10000); // 10 seconds for all tests

// Add unhandled promise rejection logging
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('✅ Jest setup completed - Ready for testing GREEN-API interface!'); 