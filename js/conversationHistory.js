const CONVERSATIONS_KEY = 'atlas_conversations';
const CURRENT_CONVERSATION_KEY = 'atlas_current_conversation';

/**
 * Gets all conversations from localStorage
 */
export function getConversations() {
    try {
        const conversations = localStorage.getItem(CONVERSATIONS_KEY);
        return conversations ? JSON.parse(conversations) : [];
    } catch (error) {
        console.error('Error getting conversations:', error);
        return [];
    }
}

/**
 * Saves conversations to localStorage
 */
function saveConversations(conversations) {
    try {
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (error) {
        console.error('Error saving conversations:', error);
    }
}

/**
 * Creates a new conversation
 */
export function createNewConversation() {
    const conversationId = 'conv_' + Date.now();
    const conversation = {
        id: conversationId,
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    const conversations = getConversations();
    conversations.unshift(conversation);
    saveConversations(conversations);
    setCurrentConversation(conversationId);
    
    return conversation;
}

/**
 * Updates a conversation with new message
 */
export function updateConversation(conversationId, message) {
    const conversations = getConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (conversation) {
        conversation.messages.push(message);
        conversation.updatedAt = Date.now();
        
        // Update title based on first user message
        if (conversation.title === 'New Chat' && message.sender === 'user') {
            conversation.title = message.text.substring(0, 50) + (message.text.length > 50 ? '...' : '');
        }
        
        saveConversations(conversations);
        renderConversationHistory();
    }
}

/**
 * Gets the current conversation ID
 */
export function getCurrentConversationId() {
    return sessionStorage.getItem(CURRENT_CONVERSATION_KEY);
}

/**
 * Sets the current conversation ID
 */
export function setCurrentConversation(conversationId) {
    sessionStorage.setItem(CURRENT_CONVERSATION_KEY, conversationId);
}

/**
 * Gets the current conversation
 */
export function getCurrentConversation() {
    const conversationId = getCurrentConversationId();
    if (!conversationId) return null;
    
    const conversations = getConversations();
    return conversations.find(c => c.id === conversationId) || null;
}

/**
 * Loads a conversation by ID
 */
export function loadConversation(conversationId) {
    const conversations = getConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (conversation) {
        setCurrentConversation(conversationId);
        
        // Clear current messages
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        
        // Load messages
        conversation.messages.forEach(message => {
            import('./addMessage.js').then(({ addMessage }) => {
                addMessage(message.text, message.sender);
            });
        });
        
        renderConversationHistory();
    }
}

/**
 * Renders the conversation history in the sidebar
 */
export function renderConversationHistory() {
    const conversationHistory = document.querySelector('.conversation-history');
    if (!conversationHistory) return;
    
    const conversations = getConversations();
    const currentConversationId = getCurrentConversationId();
    
    conversationHistory.innerHTML = conversations.map(conversation => `
        <a href="#" class="conversation-item ${conversation.id === currentConversationId ? 'active' : ''}" 
           data-conversation-id="${conversation.id}">
            ${conversation.title}
        </a>
    `).join('');
}

/**
 * Deletes a conversation
 */
export function deleteConversation(conversationId) {
    const conversations = getConversations();
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    saveConversations(updatedConversations);
    
    // If this was the current conversation, clear it
    if (getCurrentConversationId() === conversationId) {
        sessionStorage.removeItem(CURRENT_CONVERSATION_KEY);
    }
    
    renderConversationHistory();
}
