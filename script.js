const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message');

const email = document.getElementById('email');
const password = document.getElementById('password');

document.getElementById('login-btn').onclick = async () => {

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: email.value,
        password: password.value
    });

    if (error) alert(error.message);
    else location.reload();
};

document.getElementById('signup-btn').onclick = async () => {

    const username = prompt("username");
    if (!username) return;

    const { data, error } = await supabaseClient.auth.signUp({
        email: email.value,
        password: password.value
    });

    if (error) return alert(error.message);

    await supabaseClient
        .from('profiles')
        .insert([{
            id: data.user.id,
            username
        }]);

    alert("Account created");
};

document.getElementById('logout-btn').onclick = async () => {
    await supabaseClient.auth.signOut();
    location.reload();
};

ChatEngine.onClearChat = function() {
    chatContainer.innerHTML = '';
};

ChatEngine.onNewMessage = function(msg) {

    const div = document.createElement('div');
    div.className = 'message';

    div.innerHTML = `
        [<small>${msg.date} ${msg.time}</small>]
        <b>${msg.username}:</b>
        <span>${msg.text}</span>
    `;

    chatContainer.appendChild(div);
    window.scrollTo(0, document.body.scrollHeight);
};

chatForm.onsubmit = async (e) => {
    e.preventDefault();

    const text = messageInput.value.trim();
    if (!text) return;

    await ChatEngine.send(text);
    messageInput.value = '';
};

ChatEngine.init();
