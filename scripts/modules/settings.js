/**
 * Settings Module
 * Handles all settings-related functionality
 */
import { ModalManager } from './modal.js';

export class SettingsManager {
    constructor() {
        this.isSettingsOpen = false;
        this.settingsContainer = null;
        this.homeContainer = null;
        this.mainContent = null;
        this.currentUsername = this.loadUsername();
        this.currentProfilePicture = this.loadProfilePicture();
        this.modalManager = new ModalManager();
        this.handleEscapeKey = this.handleEscapeKey.bind(this);
        this.init();
    }

    init() {
        this.mainContent = document.querySelector('.main-content');
        this.homeContainer = document.querySelector('.home-container');
        
        if (!this.homeContainer || !this.mainContent) {
            console.error('Required containers not found');
            return;
        }
        
        // Add loading class immediately
        if (this.mainContent) {
            this.mainContent.classList.add('loading');
        }
        
        // Create settings container if it doesn't exist
        this.createSettingsContainer();
        
        // Restore state immediately without delay
        this.restorePageState();
        
        // Remove loading state and show content
        setTimeout(() => {
            this.showMainContent();
        }, 10);
        
        this.updateUsernameDisplay();
        this.updateProfilePictureDisplay();
        this.bindEvents();
    }

    createSettingsContainer() {
        // Check if settings container already exists
        this.settingsContainer = this.mainContent.querySelector('.settings-container');
        
        if (!this.settingsContainer) {
            this.settingsContainer = document.createElement('div');
            this.settingsContainer.className = 'settings-container';
            this.mainContent.appendChild(this.settingsContainer);
        }
    }

    restorePageState() {
        const currentPage = this.loadPageState();
        if (currentPage === 'settings' && !this.isSettingsOpen) {
            this.openSettings();
        }
    }

    showMainContent() {
        const mainContentElement = document.querySelector('.main-content');
        if (mainContentElement) {
            mainContentElement.classList.remove('loading');
        }
    }

    bindEvents() {
        const settingsButton = document.querySelector('.settings-button');
        if (settingsButton) {
            // Remove any existing listeners
            settingsButton.removeEventListener('click', this.handleSettingsClick);
            this.handleSettingsClick = () => this.toggleSettings();
            settingsButton.addEventListener('click', this.handleSettingsClick);
        }

        const logoElement = document.querySelector('.sidebar-logo');
        if (logoElement) {
            logoElement.removeEventListener('click', this.handleLogoClick);
            this.handleLogoClick = () => this.goToHomepage();
            logoElement.addEventListener('click', this.handleLogoClick);
        }
    }

    toggleSettings() {
        if (this.isSettingsOpen) {
            // Do nothing if settings are already open
            return;
        } else {
            this.openSettings();
        }
    }

    loadUsername() {
        return localStorage.getItem('atlas-username') || 'User';
    }

    saveUsername(username) {
        localStorage.setItem('atlas-username', username);
        this.currentUsername = username;
        this.updateUsernameDisplay();
    }

    loadProfilePicture() {
        return localStorage.getItem('atlas-profile-picture') || 'https://api.dicebear.com/7.x/shapes/svg?seed=atlas-user';
    }

    saveProfilePicture(imageData) {
        localStorage.setItem('atlas-profile-picture', imageData);
        this.currentProfilePicture = imageData;
        this.updateProfilePictureDisplay();
    }

    resetProfilePicture() {
        const defaultPicture = 'https://api.dicebear.com/7.x/shapes/svg?seed=atlas-user';
        this.saveProfilePicture(defaultPicture);
    }

    updateUsernameDisplay() {
        const usernameElement = document.querySelector('.username');
        if (usernameElement) {
            usernameElement.textContent = this.currentUsername;
        }
    }

    updateProfilePictureDisplay() {
        const profileImages = document.querySelectorAll('.profile-image');
        profileImages.forEach(img => {
            img.src = this.currentProfilePicture;
        });
    }

    savePageState(page = 'home') {
        localStorage.setItem('atlas-current-page', page);
    }

    loadPageState() {
        return localStorage.getItem('atlas-current-page') || 'home';
    }

    openSettings() {
        if (this.isSettingsOpen) return;
        
        this.isSettingsOpen = true;
        this.savePageState('settings');
        
        // Hide home container and show settings container
        if (this.homeContainer) {
            this.homeContainer.classList.add('hidden');
        }
        
        if (this.settingsContainer) {
            this.settingsContainer.classList.add('active');
            this.createSettingsContent();
            this.bindSettingsEvents();
        }
    }

    createSettingsContent() {
        const settingsHTML = `
            <div class="settings-content-area open">
                <div class="settings-header">
                    <h1 class="settings-title">Settings</h1>
                </div>
                <div class="settings-content">
                    <div class="settings-section">
                        <div class="section-content">
                            <h3 class="section-title">Public profile</h3>
                            <p class="settings-description">This will be displayed on your profile.</p>
                        </div>
                        <div class="section-input">
                            <div class="form-group">
                                <input 
                                    type="text" 
                                    id="username-input" 
                                    class="form-input" 
                                    value="${this.currentUsername}"
                                    placeholder="Enter your name"
                                    maxlength="30"
                                >
                            </div>
                        </div>
                    </div>
                    <div class="settings-section">
                        <div class="section-content">
                            <h3 class="section-title">Profile picture</h3>
                            <p class="settings-description">This will be displayed on your profile.</p>
                        </div>
                        <div class="section-input">
                            <div class="profile-picture-container">
                                <img class="profile-preview" src="${this.currentProfilePicture}" alt="Profile preview">
                                <div class="upload-area">
                                    <div class="file-input-wrapper">
                                        <input type="file" id="profile-picture-input" class="file-input" accept="image/*">
                                        <label for="profile-picture-input" class="file-input-label">
                                            <span class="upload-text">Choose new picture</span>
                                            <span class="upload-hint">PNG, JPG, GIF up to 5MB</span>
                                        </label>
                                    </div>
                                    <div class="picture-actions">
                                        <button class="btn btn-secondary btn-small" data-action="reset-picture">Reset to default</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="settings-section">
                        <div class="section-content">
                            <h3 class="section-title">Your Data</h3>
                            <p class="settings-description">User data may be transmitted but is never stored on our servers; all information resides exclusively in your browser's local cache, ensuring you maintain full control and privacy.</p>
                        </div>
                        <div class="section-input">
                            <div class="data-actions">
                                <button class="btn btn-danger btn-small btn-icon" data-action="clear-cache" title="Clear Cache">
                                    <img src="resources/icons/trash.svg" alt="Clear Cache" width="16" height="16">
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="button-group">
                        <button class="btn btn-primary" data-action="save">Save changes</button>
                        <button class="btn btn-secondary" data-action="cancel">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        this.settingsContainer.innerHTML = settingsHTML;
    }

    bindSettingsEvents() {
        if (!this.settingsContainer) return;

        // Remove existing event listeners
        document.removeEventListener('keydown', this.handleEscapeKey);

        // Handle button clicks
        this.settingsContainer.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            
            switch (action) {
                case 'cancel':
                    this.closeSettings();
                    break;
                case 'save':
                    this.saveSettingsOnly();
                    this.showSaveConfirmation();
                    break;
                case 'reset-picture':
                    this.resetProfilePicture();
                    this.updatePreviewImage();
                    break;
                case 'clear-cache':
                    this.clearCache();
                    break;
            }
        });

        // Handle file input change
        const fileInput = this.settingsContainer.querySelector('#profile-picture-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Handle Enter key in username input
        const usernameInput = this.settingsContainer.querySelector('#username-input');
        if (usernameInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveSettingsOnly();
                }
            });
        }

        // Handle Escape key
        document.addEventListener('keydown', this.handleEscapeKey);
    }

    handleEscapeKey = (e) => {
        if (e.key === 'Escape' && this.isSettingsOpen) {
            this.closeSettings();
        }
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB.');
            return;
        }

        // Read and convert to base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            this.currentProfilePicture = imageData;
            this.updatePreviewImage();
        };
        reader.readAsDataURL(file);
    }

    updatePreviewImage() {
        const previewImage = this.settingsContainer?.querySelector('.profile-preview');
        if (previewImage) {
            previewImage.src = this.currentProfilePicture;
        }
    }

    saveSettingsOnly() {
        const usernameInput = this.settingsContainer?.querySelector('#username-input');
        if (!usernameInput) return;
        
        const newUsername = usernameInput.value.trim();
        
        if (newUsername && newUsername !== this.currentUsername) {
            this.saveUsername(newUsername);
        }

        // Save profile picture if it has changed
        const storedPicture = this.loadProfilePicture();
        if (this.currentProfilePicture !== storedPicture) {
            this.saveProfilePicture(this.currentProfilePicture);
        }
    }

    showSaveConfirmation() {
        const saveButton = this.settingsContainer?.querySelector('[data-action="save"]');
        if (!saveButton) return;

        const originalText = saveButton.textContent;
        saveButton.textContent = 'Saved';
        saveButton.style.background = '#22c55e';
        
        setTimeout(() => {
            saveButton.textContent = originalText;
            saveButton.style.background = '';
        }, 2000);
    }

    saveSettingsAndClose() {
        const usernameInput = this.settingsContainer?.querySelector('#username-input');
        if (!usernameInput) return;
        
        const newUsername = usernameInput.value.trim();
        
        if (newUsername && newUsername !== this.currentUsername) {
            this.saveUsername(newUsername);
        }

        // Save profile picture if it has changed
        const storedPicture = this.loadProfilePicture();
        if (this.currentProfilePicture !== storedPicture) {
            this.saveProfilePicture(this.currentProfilePicture);
        }
        
        this.closeSettings();
    }

    // Rename original saveSettings to avoid confusion
    saveSettings() {
        this.saveSettingsAndClose();
    }

    closeSettings() {
        if (!this.isSettingsOpen) return;
        
        this.isSettingsOpen = false;
        this.savePageState('home');
        
        // Remove event listener
        document.removeEventListener('keydown', this.handleEscapeKey);
        
        // Hide settings container and show home container
        if (this.settingsContainer) {
            this.settingsContainer.classList.remove('active');
            this.settingsContainer.innerHTML = '';
        }
        
        if (this.homeContainer) {
            this.homeContainer.classList.remove('hidden');
        }
    }

    exportData() {
        const userData = {
            username: this.currentUsername,
            profilePicture: this.currentProfilePicture,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(userData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `atlas-data-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        this.showActionConfirmation('export-data', 'Data exported!');
    }

    clearData() {
        if (confirm('Are you sure you want to clear all your data? This action cannot be undone.')) {
            // Clear localStorage
            localStorage.removeItem('atlas-username');
            localStorage.removeItem('atlas-profile-picture');

            // Reset to defaults
            this.currentUsername = 'User';
            this.currentProfilePicture = 'https://api.dicebear.com/7.x/shapes/svg?seed=atlas-user';

            // Update displays
            this.updateUsernameDisplay();
            this.updateProfilePictureDisplay();

            // Update settings form
            const usernameInput = this.settingsContainer?.querySelector('#username-input');
            const previewImage = this.settingsContainer?.querySelector('.profile-preview');
            
            if (usernameInput) usernameInput.value = this.currentUsername;
            if (previewImage) previewImage.src = this.currentProfilePicture;

            this.showActionConfirmation('clear-data', 'Data cleared!');
        }
    }

    async clearCache() {
        const confirmed = await this.modalManager.show({
            title: 'Clear All Cache Data',
            message: 'You are about to permanently delete all your local data from this browser.',
            details: {
                title: 'This action will remove:',
                items: [
                    'Your username and profile settings',
                    'Your custom profile picture',
                    'All application preferences',
                    'Any cached data and session information'
                ]
            },
            highlight: '<strong>Privacy First:</strong> ATLAS stores absolutely nothing on our servers. All your data exists only in your browser\'s local storage, giving you complete control over your information.',
            type: 'danger',
            confirmText: 'Clear All Data',
            cancelText: 'Keep My Data'
        });

        if (confirmed) {
            // Clear localStorage
            localStorage.clear();

            // Reset to defaults
            this.currentUsername = 'User';
            this.currentProfilePicture = 'https://api.dicebear.com/7.x/shapes/svg?seed=atlas-user';

            // Update displays
            this.updateUsernameDisplay();
            this.updateProfilePictureDisplay();

            // Update settings form
            const usernameInput = this.settingsContainer?.querySelector('#username-input');
            const previewImage = this.settingsContainer?.querySelector('.profile-preview');
            
            if (usernameInput) usernameInput.value = this.currentUsername;
            if (previewImage) previewImage.src = this.currentProfilePicture;

            this.showActionConfirmation('clear-cache', 'All data cleared!');
        }
    }

    goToHomepage() {
        if (this.isSettingsOpen) {
            this.closeSettings();
        }
    }
}