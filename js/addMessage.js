export function addMessage(text, sender = 'user') {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
        console.warn('chat-messages element not found');
        return;
    }
    console.log('addMessage called', { text, sender }); // Debug
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = sender === 'user' ? 'You' : 'AI';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);
    chatMessages.appendChild(messageDiv);
    // Scroll to bottom after adding message
    chatMessages.scrollTop = chatMessages.scrollHeight;
}