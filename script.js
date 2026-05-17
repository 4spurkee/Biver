const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message');
const usernameInput = document.getElementById('username');

// 1. Restore nickname from localStorage
const savedName = localStorage.getItem('chat_nickname');

if (savedName) {
    usernameInput.value = savedName;
}

usernameInput.addEventListener('input', () => {
    localStorage.setItem('chat_nickname', usernameInput.value);
});

// 2. Clear screen before rendering full history
ChatEngine.onClearChat = function() {
    chatContainer.innerHTML = '';
};

// 3. Display message
ChatEngine.onNewMessage = function(msg, prepend = false) {

    const p = document.createElement('p');

    p.innerHTML = `
        [<small>${msg.date} ${msg.time}</small>]
        <b>${msg.username}:</b>
        <span style="word-break: break-word;">
            ${msg.text}
        </span>
    `;

    if (prepend) {

        // If history is loading, the engine itself adds the banner,
        // so history elements are simply inserted at the beginning.
        chatContainer.prepend(p);

    } else {

        // New live messages are added to the bottom
        chatContainer.appendChild(p);

        window.scrollTo(0, document.body.scrollHeight);
    }
};

// 4. Handle submit event
chatForm.addEventListener('submit', function(event) {

    event.preventDefault();

    const user = usernameInput.value.trim() || 'Anonymous';
    const text = messageInput.value.trim();

    if (text !== '') {

        ChatEngine.send(user, text);

        messageInput.value = '';
    }
});

// Start system
ChatEngine.init();
