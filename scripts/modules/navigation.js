/**
 * Navigation Module
 * Handles page navigation and state persistence
 */
export class NavigationManager {
    constructor() {
        this.currentPage = 'home';
        this.pageHistory = [];
        this.init();
    }

    init() {
        // Load saved page state
        this.currentPage = this.loadPageState();
        this.addToHistory(this.currentPage);
        
        // Listen for page visibility changes (reload detection)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.handlePageReload();
            }
        });

        // Listen for beforeunload to save current state
        window.addEventListener('beforeunload', () => {
            this.saveCurrentState();
        });
    }

    savePageState(page) {
        localStorage.setItem('atlas-current-page', page);
        localStorage.setItem('atlas-page-timestamp', Date.now().toString());
        this.currentPage = page;
        this.addToHistory(page);
    }

    loadPageState() {
        return localStorage.getItem('atlas-current-page') || 'home';
    }

    getPageTimestamp() {
        return parseInt(localStorage.getItem('atlas-page-timestamp') || '0');
    }

    addToHistory(page) {
        if (this.pageHistory[this.pageHistory.length - 1] !== page) {
            this.pageHistory.push(page);
            // Keep only last 10 pages in history
            if (this.pageHistory.length > 10) {
                this.pageHistory.shift();
            }
        }
    }

    handlePageReload() {
        const savedPage = this.loadPageState();
        const timestamp = this.getPageTimestamp();
        const timeDiff = Date.now() - timestamp;
        
        // If the timestamp is recent (within last 5 minutes), restore the page
        if (timeDiff < 5 * 60 * 1000) {
            this.navigateToPage(savedPage);
        } else {
            // If too old, go to home
            this.navigateToPage('home');
        }
    }

    navigateToPage(page) {
        this.savePageState(page);
        
        // Emit custom event for other modules to listen
        window.dispatchEvent(new CustomEvent('atlas-navigate', {
            detail: { page, previousPage: this.currentPage }
        }));
    }

    saveCurrentState() {
        // Save any additional state information here
        localStorage.setItem('atlas-page-history', JSON.stringify(this.pageHistory));
    }

    getCurrentPage() {
        return this.currentPage;
    }

    goBack() {
        if (this.pageHistory.length > 1) {
            this.pageHistory.pop(); // Remove current page
            const previousPage = this.pageHistory[this.pageHistory.length - 1] || 'home';
            this.navigateToPage(previousPage);
        }
    }
}
