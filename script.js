const chat = document.getElementById('chat-container');
const form = document.getElementById('chat-form');
const input = document.getElementById('message');
const username = document.getElementById('username');

ChatEngine.onNewMessage = function (msg) {

    const div = document.createElement('div');
    div.className = 'message';

    div.innerHTML = `
        <small>${msg.date} ${msg.time}</small><br>
        <b>${msg.username}:</b>
        <div>${msg.text}</div>
    `;

    chat.appendChild(div);

    window.scrollTo(0, document.body.scrollHeight);
};

ChatEngine.onClearChat = function () {
    chat.innerHTML = '';
};

form.addEventListener('submit', e => {

    e.preventDefault();

    const user = username.value.trim() || "Anonymous";
    const text = input.value.trim();

    if (!text) return;

    ChatEngine.send(user, text);

    input.value = '';
});

ChatEngine.init();
