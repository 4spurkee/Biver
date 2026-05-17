const chatContainer = document.getElementById('chat-container');
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

    chatContainer.appendChild(div);

    window.scrollTo(0, document.body.scrollHeight);
};

form.addEventListener('submit', e => {
    e.preventDefault();

    const user = username.value || "Anonymous";
    const text = input.value;

    if (!text) return;

    ChatEngine.send(user, text);

    input.value = '';
});

ChatEngine.init();
