/**
 * API Manager
 * Handles all API calls and responses
 */
export class APIManager {
    constructor() {
        this.baseURL = 'https://rds.teamcardinalis.com/atlas';
    }

    async getAssistantResponse(messages) {
        try {
            const prompts = messages.map(msg => ({
                role: msg.sender,
                content: msg.content
            }));

            const response = await fetch(`${this.baseURL}/prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompts: prompts })
            });

            if (!response.ok) {
                let errorText = '';
                try {
                    errorText = await response.text();
                } catch (e) {
                    // Ignore if body is empty or already read
                }
                throw new Error(`API Error: ${response.status} - ${errorText || response.statusText || 'Failed to fetch response.'}`);
            }

            const data = await response.json();
            return data.response || "Sorry, I couldn't get a response.";

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error(`Network Error: ${error.message}`);
            }
            throw error;
        }
    }
}
