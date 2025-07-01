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
        
        // Clear current messages with proper cleanup
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            // Remove all existing message elements
            while (chatMessages.firstChild) {
                chatMessages.removeChild(chatMessages.firstChild);
            }
        }
        
        // Load messages with proper async handling to prevent race conditions
        if (conversation.messages && conversation.messages.length > 0) {
            Promise.resolve().then(async () => {
                const { addMessage } = await import('./addMessage.js');
                
                // Add messages sequentially to prevent duplication
                for (const message of conversation.messages) {
                    // Create message element directly without saving to conversation again
                    addMessageToDOM(message.text, message.sender);
                }
            });
        }
        
        renderConversationHistory();
    }
}

/**
 * Helper function to add message to DOM only (without saving to conversation)
 */
function addMessageToDOM(text, sender = 'user') {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
        console.warn('chat-messages element not found');
        return;
    }

    const userAvatar = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><path fill="#ffffff" d="M858.5 763.6a374 374 0 0 0-80.6-119.5a375.63 375.63 0 0 0-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1c-.4.2-.8.3-1.2.5c-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 0 0-80.6 119.5A371.7 371.7 0 0 0 136 901.8a8 8 0 0 0 8 8.2h60c4.4 0 7.9-3.5 8-7.8c2-77.2 33-149.5 87.8-204.3c56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 0 0 8-8.2c-1-47.8-10.9-94.3-29.5-138.2M512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534"/></svg>`;
    const aiAvatar = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#ffffff" d="M18.36 2.64c1.64 0 3 1.36 3 3c0 1.65-1.36 3-3 3c-1.65 0-3-1.35-3-3c0-.3.05-.58.14-.84c-1.07-.51-2.25-.8-3.5-.8a8 8 0 0 0-8 8l.04.84l-1.99.21L2 12A10 10 0 0 1 12 2c1.69 0 3.28.42 4.67 1.16c.49-.33 1.07-.52 1.69-.52m0 2a1 1 0 0 0-1 1a1 1 0 0 0 1 1c.56 0 1-.45 1-1c0-.56-.44-1-1-1M5.64 15.36c1.65 0 3 1.35 3 3c0 .3-.05.58-.14.84c1.07.51 2.25.8 3.5.8a8 8 0 0 0 8-8l-.04-.84l1.99-.21L22 12a10 10 0 0 1-10 10c-1.69 0-3.28-.42-4.67-1.16c-.49.33-1.07.52-1.69.52c-1.64 0-3-1.36-3-3c0-1.65 1.36-3 3-3m0 2c-.56 0-1 .45-1 1c0 .56.44 1 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1M12 8a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4"/></svg>`;

    const messageHTML = `
        <div class="message ${sender}">
            <div class="avatar">${sender === 'user' ? userAvatar : aiAvatar}</div>
            <div class="bubble"></div>
        </div>`;
    
    const messageFragment = document.createRange().createContextualFragment(messageHTML);
    messageFragment.querySelector('.bubble').textContent = text;
    chatMessages.appendChild(messageFragment);

    chatMessages.scrollTop = chatMessages.scrollHeight;
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
