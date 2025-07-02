/**
 * Main Application Module
 * Initializes and coordinates all application components
 */
import { SettingsManager } from './modules/settings.js';
import { ModalManager } from './modules/modal.js';
import { NavigationManager } from './modules/navigation.js';

class AtlasApp {
    constructor() {
        this.settingsManager = null;
        this.modalManager = null;
        this.navigationManager = null;
        this.init();
    }

    async init() {
        try {
            await this.waitForDOM();
            this.initializeModules();
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
        // Initialize Settings Manager
        this.settingsManager = new SettingsManager();
        
        // Initialize Navigation Manager
        this.navigationManager = new NavigationManager();
        
        // Initialize Modal Manager
        this.modalManager = new ModalManager();
    }
}

// Initialize the application
new AtlasApp();

    setupNavigationHandling(); {
        // Listen for navigation events
        window.addEventListener('atlas-navigate', (event) => {
            const { page, previousPage } = event.detail;
            this.handleNavigation(page, previousPage);
        });
    }

    handleNavigation(page, previousPage); {
        console.log(`Navigating from ${previousPage} to ${page}`);
        
        switch (page) {
            case 'settings':
                if (!this.settingsManager.isSettingsOpen) {
                    this.settingsManager.openSettings();
                }
                break;
            case 'home':
                if (this.settingsManager.isSettingsOpen) {
                    this.settingsManager.closeSettings();
                }
                break;
            // Add more cases as you add more pages
        }
    }
