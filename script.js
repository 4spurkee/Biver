const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message');
const usernameInput = document.getElementById('username');

// 1. Відновлення ніку з localStorage
const savedName = localStorage.getItem('chat_nickname');
if (savedName) usernameInput.value = savedName;
usernameInput.addEventListener('input', () => localStorage.setItem('chat_nickname', usernameInput.value));

// 2. Очищення екрану перед рендером повної історії
ChatEngine.onClearChat = function() {
    chatContainer.innerHTML = '';
};

// 3. Відображення повідомлення
ChatEngine.onNewMessage = function(msg, prepend = false) {
    const p = document.createElement('p');
    p.innerHTML = `[<small>${msg.date} ${msg.time}</small>] <b>${msg.username}:</b> <span style="word-break: break-word;">${msg.text}</span>`;
    
    if (prepend) {
        // Якщо завантажується історія, двіжок сам додає плашку,
        // тому нові елементи історії просто вставляємо на початок контейнера.
        chatContainer.prepend(p);
    } else {
        // Нові живі повідомлення додаємо вниз
        chatContainer.appendChild(p);
        window.scrollTo(0, document.body.scrollHeight);
    }
};

// 4. Обробка події відправки
chatForm.addEventListener('submit', function(event) {
    event.preventDefault(); 
    
    const user = usernameInput.value.trim() || 'Анонім';
    const text = messageInput.value.trim();

    if (text !== '') {
        ChatEngine.send(user, text);
        messageInput.value = '';
    }
});

// Старт системи
ChatEngine.init();