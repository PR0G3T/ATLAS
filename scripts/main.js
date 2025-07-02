/**
 * Main Application Module
 * Initializes and coordinates all application components
 */
import { SettingsManager } from './modules/settings.js';
import { ModalManager } from './modules/modal.js';
import { NavigationManager } from './modules/navigation.js';
import { SessionManager } from './modules/session.js';

class AtlasApp {
    constructor() {
        this.settingsManager = null;
        this.modalManager = null;
        this.navigationManager = null;
        this.sessionManager = null;
        this.init();
    }

    async init() {
        try {
            await this.waitForDOM();
            this.initializeModules();
            this.setupNavigationHandling();
            console.log('ATLAS application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ATLAS application:', error);
        }
    }

    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    initializeModules() {
        // Initialize Navigation Manager first as SettingsManager depends on it
        this.navigationManager = new NavigationManager();
        
        // Initialize Settings Manager
        this.settingsManager = new SettingsManager(this.navigationManager);
        
        // Initialize Modal Manager
        this.modalManager = new ModalManager();
        
        // Initialize Session Manager
        this.sessionManager = new SessionManager();

        // Make app globally available for code copy functionality
        window.atlasApp = this;
    }

    // Add copy code functionality
    async copyCode(codeId, buttonElement) {
        try {
            const codeElement = document.getElementById(codeId);
            if (!codeElement) return;

            const text = codeElement.textContent;
            await navigator.clipboard.writeText(text);

            // Update button state
            const originalText = buttonElement.innerHTML;
            buttonElement.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Copied!
            `;
            buttonElement.classList.add('copied');

            // Reset after 2 seconds
            setTimeout(() => {
                buttonElement.innerHTML = originalText;
                buttonElement.classList.remove('copied');
            }, 2000);

        } catch (err) {
            console.error('Failed to copy code:', err);
            
            // Fallback for older browsers
            const codeElement = document.getElementById(codeId);
            if (codeElement) {
                const range = document.createRange();
                range.selectNode(codeElement);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                document.execCommand('copy');
                window.getSelection().removeAllRanges();
            }
        }
    }

    setupNavigationHandling() {
        // Listen for navigation events
        window.addEventListener('atlas-navigate', (event) => {
            const { page, previousPage } = event.detail;
            this.handleNavigation(page, previousPage);
        });

        // Listen for new session creation events
        window.addEventListener('atlas-create-new-session', (event) => {
            console.log('Main app: Creating new session from', event.detail?.source);
            if (this.sessionManager) {
                // Small delay to ensure settings are closed first if needed
                setTimeout(() => {
                    this.sessionManager.createNewSession();
                }, 50);
            }
        });

        // Keep legacy event for backward compatibility
        window.addEventListener('atlas-create-session', () => {
            console.log('Main app: Creating session (legacy event)');
            if (this.sessionManager) {
                this.sessionManager.createNewSession();
            }
        });
    }

    handleNavigation(page, previousPage) {
        console.log(`Navigating from ${previousPage} to ${page}`);
        
        switch (page) {
            case 'settings':
                if (!this.settingsManager.isSettingsOpen) {
                    this.settingsManager.openSettings();
                }
                break;
            case 'session':
                if (this.settingsManager.isSettingsOpen) {
                    this.settingsManager.closeSettings();
                }
                break;
        }
    }
}

// Initialize the application
new AtlasApp();