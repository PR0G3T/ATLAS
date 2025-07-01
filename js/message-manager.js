/**
 * ATLAS - Message Manager
 */

import { Utils } from './utils.js';

export class MessageManager {
    constructor(sessionManager, uiManager, apiClient) {
        this.sessionManager = sessionManager;
        this.uiManager = uiManager;
        this.apiClient = apiClient;
    }
    
    async sendMessage(content) {
        const validation = Utils.validateMessage(content);
        if (!validation.valid) {
            Utils.showToast(validation.error, 'error');
            return false;
        }
        
        if (this.uiManager.isLoading) return false;
        
        // Add user message
        this.uiManager.addMessageToUI(content, 'user');
        
        // Loading state
        this.uiManager.setLoading(true);
        const loadingMessage = this.uiManager.addLoadingMessage();
        
        try {
            const response = await this.apiClient.sendPrompt(content);
            
            // Remove loading message
            loadingMessage.remove();
            
            // Add AI response
            this.uiManager.addMessageToUI(response, 'ai');
            
            return true;
            
        } catch (error) {
            console.error('Error:', error);
            loadingMessage.remove();
            Utils.showToast(`Error: ${error.message}`, 'error');
            return false;
        } finally {
            this.uiManager.setLoading(false);
            Utils.focusInput();
        }
    }
}
