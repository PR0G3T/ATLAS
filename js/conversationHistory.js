const CONVERSATIONS_KEY = 'atlas_conversations';
const CURRENT_CONVERSATION_KEY = 'atlas_current_conversation';

const MAX_CONVERSATIONS = 100; // Limit to prevent storage bloat
const MAX_MESSAGES_PER_CONVERSATION = 1000;

/**
 * Gets all conversations from localStorage
 */
export function getConversations() {
    try {
        const conversations = localStorage.getItem(CONVERSATIONS_KEY);
        const parsed = conversations ? JSON.parse(conversations) : [];
        
        // Validate conversation structure
        return parsed.filter(conv => 
            conv && 
            typeof conv === 'object' && 
            conv.id && 
            Array.isArray(conv.messages)
        );
    } catch (error) {
        console.error('Error getting conversations:', error);
        // Recovery mechanism
        try {
            localStorage.removeItem(CONVERSATIONS_KEY);
            console.log('Cleared corrupted conversation data');
        } catch (e) {
            console.error('Failed to clear corrupted data:', e);
        }
        return [];
    }
}

/**
 * Saves conversations to localStorage
 */
function saveConversations(conversations) {
    try {
        // Validate and limit conversations
        const validConversations = conversations
            .filter(conv => conv && typeof conv === 'object' && conv.id)
            .slice(0, MAX_CONVERSATIONS);
            
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(validConversations));
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            // Handle storage quota exceeded
            console.warn('Storage quota exceeded, removing old conversations');
            try {
                const reducedConversations = conversations.slice(0, Math.floor(MAX_CONVERSATIONS / 2));
                localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(reducedConversations));
            } catch (e) {
                console.error('Failed to save even reduced conversations:', e);
            }
        } else {
            console.error('Error saving conversations:', error);
        }
    }
}

/**
 * Creates a new conversation
 */
export function createNewConversation() {
    const conversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
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
    
    // Force immediate render with a small delay to ensure DOM is ready
    setTimeout(() => {
        renderConversationHistory();
    }, 50);
    
    return conversation;
}

/**
 * Updates a conversation with new message
 */
export function updateConversation(conversationId, message) {
    // Input validation
    if (!conversationId || !message || typeof message !== 'object') {
        console.error('Invalid conversation update parameters');
        return;
    }
    
    const conversations = getConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (conversation) {
        // Limit messages per conversation
        if (conversation.messages.length >= MAX_MESSAGES_PER_CONVERSATION) {
            conversation.messages = conversation.messages.slice(-MAX_MESSAGES_PER_CONVERSATION + 1);
        }
        
        conversation.messages.push({
            ...message,
            id: Date.now() + Math.random(), // Unique message ID
            timestamp: message.timestamp || Date.now()
        });
        
        conversation.updatedAt = Date.now();
        
        if (conversation.title === 'New Chat' && message.sender === 'user') {
            // Better title generation
            const cleanText = message.text.replace(/[^\w\s]/gi, '').trim();
            conversation.title = cleanText.substring(0, 50) + (cleanText.length > 50 ? '...' : '');
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
    if (!conversationHistory) {
        console.warn('Conversation history element not found');
        return;
    }
    
    const conversations = getConversations();
    const currentConversationId = getCurrentConversationId();
    
    if (conversations.length === 0) {
        conversationHistory.innerHTML = '<div class="no-conversations">No conversations yet</div>';
        return;
    }
    
    const conversationHTML = conversations.map(conversation => {
        const isActive = conversation.id === currentConversationId;
        
        return `
            <a href="#" class="conversation-item ${isActive ? 'active' : ''}" 
               data-conversation-id="${conversation.id}"
               title="${conversation.title}">
                ${conversation.title}
            </a>
        `;
    }).join('');
    
    conversationHistory.innerHTML = conversationHTML;
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
