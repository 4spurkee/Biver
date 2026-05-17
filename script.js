const chatContainer =
    document.getElementById('chat-container');

const chatForm =
    document.getElementById('chat-form');

const messageInput =
    document.getElementById('message');

const emailInput =
    document.getElementById('email');

const passwordInput =
    document.getElementById('password');

const loginBtn =
    document.getElementById('login-btn');

const signupBtn =
    document.getElementById('signup-btn');

const logoutBtn =
    document.getElementById('logout-btn');

loginBtn.addEventListener('click', async () => {

    const { error } =
        await supabaseClient.auth
            .signInWithPassword({

                email: emailInput.value,

                password: passwordInput.value
            });

    if (error) {
        alert(error.message);
        return;
    }

    location.reload();
});

signupBtn.addEventListener('click', async () => {

    const username =
        prompt('Choose username:');

    if (!username) return;

    const { data, error } =
        await supabaseClient.auth
            .signUp({

                email: emailInput.value,

                password: passwordInput.value
            });

    if (error) {
        alert(error.message);
        return;
    }

    const user = data.user;

    if (user) {

        await supabaseClient
            .from('profiles')
            .insert([{

                id: user.id,

                username: username
            }]);
    }

    alert('Account created!');
});

logoutBtn.addEventListener('click', async () => {

    await supabaseClient.auth.signOut();

    location.reload();
});

ChatEngine.onClearChat = function() {

    chatContainer.innerHTML = '';
};

ChatEngine.onNewMessage = function(msg) {

    const p = document.createElement('div');

    p.className = 'message';

    p.innerHTML = `
        [<small>${msg.date} ${msg.time}</small>]
        <b>${msg.username}:</b>

        <span style="word-break: break-word;">
            ${msg.text}
        </span>
    `;

    chatContainer.appendChild(p);

    window.scrollTo(
        0,
        document.body.scrollHeight
    );
};

chatForm.addEventListener(
    'submit',

    async function(event) {

        event.preventDefault();

        const text =
            messageInput.value.trim();

        if (!text) return;

        await ChatEngine.send(text);

        messageInput.value = '';
    }
);

ChatEngine.init();
