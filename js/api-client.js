/**
 * ATLAS - API Client
 */

export class ApiClient {
    constructor() {
        this.apiUrl = 'https://rds.teamcardinalis.com/atlas/prompt';
    }
    
    async sendPrompt(prompt) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.response) {
            throw new Error('Invalid server response');
        }
        
        return data.response;
    }
}
