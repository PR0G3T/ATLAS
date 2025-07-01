import { updateConversation, getCurrentConversationId } from './conversationHistory.js';

export function addMessage(text, sender = 'user', saveToHistory = true) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
        console.warn('chat-messages element not found');
        return;
    }

    // ADD: Input validation
    if (!text || typeof text !== 'string') {
        console.warn('Invalid message text');
        return;
    }

    const userAvatar = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><path fill="#ffffff" d="M858.5 763.6a374 374 0 0 0-80.6-119.5a375.63 375.63 0 0 0-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1c-.4.2-.8.3-1.2.5c-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 0 0-80.6 119.5A371.7 371.7 0 0 0 136 901.8a8 8 0 0 0 8 8.2h60c4.4 0 7.9-3.5 8-7.8c2-77.2 33-149.5 87.8-204.3c56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 0 0 8-8.2c-1-47.8-10.9-94.3-29.5-138.2M512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534"/></svg>`;
    const aiAvatar = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#ffffff" d="M18.36 2.64c1.64 0 3 1.36 3 3c0 1.65-1.36 3-3 3c-1.65 0-3-1.35-3-3c0-.3.05-.58.14-.84c-1.07-.51-2.25-.8-3.5-.8a8 8 0 0 0-8 8l.04.84l-1.99.21L2 12A10 10 0 0 1 12 2c1.69 0 3.28.42 4.67 1.16c.49-.33 1.07-.52 1.69-.52m0 2a1 1 0 0 0-1 1a1 1 0 0 0 1 1c.56 0 1-.45 1-1c0-.56-.44-1-1-1M5.64 15.36c1.65 0 3 1.35 3 3c0 .3-.05.58-.14.84c1.07.51 2.25.8 3.5.8a8 8 0 0 0 8-8l-.04-.84l1.99-.21L22 12a10 10 0 0 1-10 10c-1.69 0-3.28-.42-4.67-1.16c-.49.33-1.07.52-1.69.52c-1.64 0-3-1.36-3-3c0-1.65 1.36-3 3-3m0 2c-.56 0-1 .45-1 1c0 .56.44 1 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1M12 8a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4"/></svg>`;

    // FIX: Use more efficient DOM creation
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    
    const avatarElement = document.createElement('div');
    avatarElement.className = 'avatar';
    avatarElement.innerHTML = sender === 'user' ? userAvatar : aiAvatar;
    
    const bubbleElement = document.createElement('div');
    bubbleElement.className = 'bubble';
    bubbleElement.textContent = text;
    
    messageElement.appendChild(avatarElement);
    messageElement.appendChild(bubbleElement);
    
    chatMessages.appendChild(messageElement);

    // Smooth scroll to bottom
    requestAnimationFrame(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    // Save message to conversation history only when requested
    if (saveToHistory) {
        const conversationId = getCurrentConversationId();
        if (conversationId) {
            const message = {
                text,
                sender,
                timestamp: Date.now()
            };
            updateConversation(conversationId, message);
        }
    }
}