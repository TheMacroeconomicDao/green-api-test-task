// ===== GREEN API Test Interface - Modern Implementation =====
// TypeScript-like JavaScript with ES6+ features

class GreenAPIClient {
    constructor() {
        this.baseURL = 'https://api.green-api.com';
        this.instanceId = '';
        this.apiToken = '';
        this.isLoading = false;
        
        // DOM Elements
        this.elements = {};
        
        // Initialize the application
        this.init();
    }

    // ===== INITIALIZATION =====
    init() {
        this.bindElements();
        this.attachEventListeners();
        this.setupFormValidation();
        this.loadStoredCredentials();
        this.setupKeyboardShortcuts();
        
        console.log('✅ Green API Client initialized');
    }

    bindElements() {
        this.elements = {
            // Forms
            idInstance: document.getElementById('idInstance'),
            apiTokenInstance: document.getElementById('apiTokenInstance'),
            phoneNumber: document.getElementById('phoneNumber'),
            messageText: document.getElementById('messageText'),
            fileUrl: document.getElementById('fileUrl'),
            
            // Buttons
            getSettings: document.getElementById('getSettings'),
            getStateInstance: document.getElementById('getStateInstance'),
            sendMessage: document.getElementById('sendMessage'),
            sendFileByUrl: document.getElementById('sendFileByUrl'),
            clearResponse: document.getElementById('clearResponse'),
            copyResponse: document.getElementById('copyResponse'),
            
            // Response
            responseOutput: document.getElementById('responseOutput'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            toastContainer: document.getElementById('toastContainer')
        };
    }

    attachEventListeners() {
        // API Method buttons
        this.elements.getSettings.addEventListener('click', () => this.handleAPICall('getSettings'));
        this.elements.getStateInstance.addEventListener('click', () => this.handleAPICall('getStateInstance'));
        this.elements.sendMessage.addEventListener('click', () => this.handleAPICall('sendMessage'));
        this.elements.sendFileByUrl.addEventListener('click', () => this.handleAPICall('sendFileByUrl'));
        
        // Utility buttons
        this.elements.clearResponse.addEventListener('click', () => this.clearResponse());
        this.elements.copyResponse.addEventListener('click', () => this.copyResponse());
        
        // Form inputs - save credentials on change
        this.elements.idInstance.addEventListener('input', () => this.saveCredentials());
        this.elements.apiTokenInstance.addEventListener('input', () => this.saveCredentials());
        
        // Phone number formatting
        this.elements.phoneNumber.addEventListener('input', (e) => this.formatPhoneNumber(e));
        
        // Enter key handlers
        this.elements.messageText.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.handleAPICall('sendMessage');
            }
        });
    }

    setupFormValidation() {
        // Real-time validation
        this.elements.idInstance.addEventListener('blur', () => this.validateField('idInstance'));
        this.elements.apiTokenInstance.addEventListener('blur', () => this.validateField('apiTokenInstance'));
        this.elements.phoneNumber.addEventListener('blur', () => this.validateField('phoneNumber'));
        this.elements.messageText.addEventListener('blur', () => this.validateField('messageText'));
        this.elements.fileUrl.addEventListener('blur', () => this.validateField('fileUrl'));
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.handleAPICall('getSettings');
                        break;
                    case '2':
                        e.preventDefault();
                        this.handleAPICall('getStateInstance');
                        break;
                    case '3':
                        e.preventDefault();
                        this.handleAPICall('sendMessage');
                        break;
                    case '4':
                        e.preventDefault();
                        this.handleAPICall('sendFileByUrl');
                        break;
                    case 'k':
                        e.preventDefault();
                        this.clearResponse();
                        break;
                }
            }
        });
    }

    // ===== VALIDATION =====
    validateField(fieldName) {
        const field = this.elements[fieldName];
        const errorElement = document.getElementById(`${fieldName}-error`);
        let isValid = true;
        let errorMessage = '';

        switch(fieldName) {
            case 'idInstance':
                if (!field.value.trim()) {
                    isValid = false;
                    errorMessage = 'Instance ID is required';
                } else if (!/^\d{10,}$/.test(field.value.trim())) {
                    isValid = false;
                    errorMessage = 'Invalid instance ID format';
                }
                break;

            case 'apiTokenInstance':
                if (!field.value.trim()) {
                    isValid = false;
                    errorMessage = 'API Token is required';
                } else if (field.value.trim().length < 20) {
                    isValid = false;
                    errorMessage = 'API Token too short';
                }
                break;

            case 'phoneNumber':
                if (field.value.trim() && !/^\d{11,15}$/.test(field.value.trim())) {
                    isValid = false;
                    errorMessage = 'Phone number should be 11-15 digits';
                }
                break;

            case 'messageText':
                if (field.value.trim() && field.value.trim().length > 4096) {
                    isValid = false;
                    errorMessage = 'Message too long (max 4096 characters)';
                }
                break;

            case 'fileUrl':
                if (field.value.trim() && !this.isValidURL(field.value.trim())) {
                    isValid = false;
                    errorMessage = 'Invalid URL format';
                }
                break;
        }

        // Update UI
        if (isValid) {
            field.classList.remove('error');
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        } else {
            field.classList.add('error');
            errorElement.classList.add('show');
            errorElement.textContent = errorMessage;
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

    // ===== API METHODS =====
    async handleAPICall(method) {
        if (this.isLoading) {
            this.showToast('Please wait for the current request to complete', 'info');
            return;
        }

        if (!this.validateCredentials()) {
            return;
        }

        // Method-specific validation
        if (method === 'sendMessage') {
            if (!this.validateField('phoneNumber') || !this.validateField('messageText')) {
                this.showToast('Please fill in valid phone number and message', 'error');
                return;
            }
            if (!this.elements.phoneNumber.value.trim() || !this.elements.messageText.value.trim()) {
                this.showToast('Phone number and message are required', 'error');
                return;
            }
        }

        if (method === 'sendFileByUrl') {
            if (!this.validateField('phoneNumber') || !this.validateField('fileUrl')) {
                this.showToast('Please fill in valid phone number and file URL', 'error');
                return;
            }
            if (!this.elements.phoneNumber.value.trim() || !this.elements.fileUrl.value.trim()) {
                this.showToast('Phone number and file URL are required', 'error');
                return;
            }
        }

        try {
            this.setLoading(true);
            this.disableButtons();
            
            const result = await this.callAPI(method);
            this.displayResponse(method, result);
            this.showToast(`${method} completed successfully`, 'success');
            
        } catch (error) {
            console.error(`API call failed:`, error);
            this.displayError(method, error);
            this.showToast(`${method} failed: ${error.message}`, 'error');
        } finally {
            this.setLoading(false);
            this.enableButtons();
        }
    }

    async callAPI(method) {
        const url = this.buildAPIURL(method);
        const options = this.buildRequestOptions(method);
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    }

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

    // ===== UI HELPERS =====
    setLoading(loading) {
        this.isLoading = loading;
        const overlay = this.elements.loadingOverlay;
        
        if (loading) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    disableButtons() {
        const buttons = ['getSettings', 'getStateInstance', 'sendMessage', 'sendFileByUrl'];
        buttons.forEach(btnId => {
            this.elements[btnId].disabled = true;
        });
    }

    enableButtons() {
        const buttons = ['getSettings', 'getStateInstance', 'sendMessage', 'sendFileByUrl'];
        buttons.forEach(btnId => {
            this.elements[btnId].disabled = false;
        });
    }

    displayResponse(method, data) {
        const timestamp = new Date().toLocaleString();
        const formattedResponse = {
            timestamp: timestamp,
            method: method,
            status: 'success',
            data: data
        };

        this.elements.responseOutput.innerHTML = '';
        this.elements.responseOutput.textContent = JSON.stringify(formattedResponse, null, 2);
        this.elements.responseOutput.scrollTop = 0;
    }

    displayError(method, error) {
        const timestamp = new Date().toLocaleString();
        const errorResponse = {
            timestamp: timestamp,
            method: method,
            status: 'error',
            error: {
                message: error.message,
                name: error.name,
                stack: error.stack
            }
        };

        this.elements.responseOutput.innerHTML = '';
        this.elements.responseOutput.textContent = JSON.stringify(errorResponse, null, 2);
        this.elements.responseOutput.scrollTop = 0;
    }

    clearResponse() {
        this.elements.responseOutput.innerHTML = `
            <div class="response-placeholder">
                <div class="placeholder-icon">📡</div>
                <p>API responses will appear here...</p>
                <p class="placeholder-hint">Click on any method button to see the response</p>
            </div>
        `;
    }

    async copyResponse() {
        const text = this.elements.responseOutput.textContent;
        
        if (!text || text.includes('API responses will appear here')) {
            this.showToast('Nothing to copy', 'info');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Response copied to clipboard', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showToast('Failed to copy to clipboard', 'error');
        }
    }

    // ===== TOAST NOTIFICATIONS =====
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    getToastIcon(type) {
        switch(type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            default: return 'ℹ️';
        }
    }

    // ===== UTILITY FUNCTIONS =====
    formatPhoneNumber(event) {
        let value = event.target.value.replace(/\D/g, '');
        if (value.length > 15) {
            value = value.substring(0, 15);
        }
        event.target.value = value;
    }

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

    // ===== LOCAL STORAGE =====
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

    // ===== ERROR HANDLING =====
    handleGlobalError(error) {
        console.error('Global error:', error);
        this.showToast('An unexpected error occurred', 'error');
        this.setLoading(false);
        this.enableButtons();
    }
}

// ===== GLOBAL ERROR HANDLING =====
window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// ===== APPLICATION STARTUP =====
document.addEventListener('DOMContentLoaded', () => {
    const app = new GreenAPIClient();
    
    // Make app globally available for debugging
    window.greenAPI = app;
    
    // Add some developer tools
    if (window.location.search.includes('debug=true')) {
        console.log('🔧 Debug mode enabled');
        window.debugAPI = {
            app: app,
            testCredentials: () => {
                app.elements.idInstance.value = '1101000000';
                app.elements.apiTokenInstance.value = 'test-token-1234567890';
                app.elements.phoneNumber.value = '79001234567';
                app.elements.messageText.value = 'Hello from Green API Test!';
                app.elements.fileUrl.value = 'https://example.com/test.png';
            }
        };
    }
});

// ===== PERFORMANCE MONITORING =====
window.addEventListener('load', () => {
    if ('performance' in window) {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log(`Page loaded in ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
    }
});

// ===== ADDITIONAL CSS UTILITIES =====
const style = document.createElement('style');
style.textContent = `
    .error {
        border-color: var(--error-color) !important;
        box-shadow: 0 0 0 3px rgba(239, 83, 80, 0.1) !important;
    }
    
    .form-input.error:focus,
    .form-textarea.error:focus {
        border-color: var(--error-color) !important;
        box-shadow: 0 0 0 3px rgba(239, 83, 80, 0.2) !important;
    }
`;
document.head.appendChild(style); 