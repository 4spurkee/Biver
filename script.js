const start = () => {
    const chatContainer = document.getElementById('chat-container');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message');
    const imageBtn = document.getElementById('image-btn');

    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const currentUser = document.getElementById('current-user');

    const settingsBtn = document.getElementById('settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsBackdrop = document.getElementById('settings-backdrop');

    const tabs = document.querySelectorAll('.settings-tab');
    const tabAccount = document.getElementById('tab-account');
    const tabThemes = document.getElementById('tab-themes');

    const themeButtons = document.querySelectorAll('.theme-btn');

    const openSettings = () => {
        settingsPanel.classList.add('open');
        settingsBackdrop.classList.add('open');
    };

    const closeSettings = () => {
        settingsPanel.classList.remove('open');
        settingsBackdrop.classList.remove('open');
    };

    const applyTheme = (theme) => {
        document.body.classList.remove('theme-bloodbath', 'theme-goose');

        if (theme === 'bloodbath') {
            document.body.classList.add('theme-bloodbath');
        } else if (theme === 'goose') {
            document.body.classList.add('theme-goose');
        }
    };

    const loadTheme = async () => {
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            applyTheme('default');
            return;
        }

        const { data, error } = await supabaseClient
            .from('profiles')
            .select('theme')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.error('Theme load error:', error);
        }

        applyTheme(data?.theme || 'default');
    };

    const saveTheme = async (theme) => {
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            alert('You must be logged in');
            return;
        }

        const { error } = await supabaseClient
            .from('profiles')
            .update({ theme })
            .eq('id', user.id);

        if (error) {
            console.error('Theme save error:', error);
            return;
        }

        applyTheme(theme);
    };

    settingsBtn.addEventListener('click', () => {
        const isOpen = settingsPanel.classList.contains('open');
        if (isOpen) {
            closeSettings();
        } else {
            openSettings();
        }
    });

    closeSettingsBtn.addEventListener('click', closeSettings);
    settingsBackdrop.addEventListener('click', closeSettings);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSettings();
    });

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');

            tabAccount.classList.add('hidden');
            tabThemes.classList.add('hidden');

            const target = document.getElementById(`tab-${tab.dataset.tab}`);
            if (target) target.classList.remove('hidden');
        });
    });

    themeButtons.forEach((btn) => {
        btn.addEventListener('click', async () => {
            await saveTheme(btn.dataset.theme);
        });
    });

    async function updateCurrentUser() {
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            currentUser.innerText = 'Not logged in';
            return;
        }

        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.error('Current user load error:', error);
        }

        currentUser.innerText = profile?.username || 'User';
    }

    document.getElementById('login-btn').onclick = async () => {
        const { error } = await supabaseClient.auth.signInWithPassword({
            email: email.value,
            password: password.value
        });

        if (error) {
            alert(error.message);
            return;
        }

        await updateCurrentUser();
        await loadTheme();
        closeSettings();
    };

    document.getElementById('signup-btn').onclick = async () => {
        const username = prompt('username');
        if (!username) return;

        const { data, error } = await supabaseClient.auth.signUp({
            email: email.value,
            password: password.value
        });

        if (error) {
            alert(error.message);
            return;
        }

        if (data?.user) {
            const { error: profileError } = await supabaseClient
                .from('profiles')
                .insert([{
                    id: data.user.id,
                    username,
                    theme: 'default'
                }]);

            if (profileError) {
                console.error('Profile insert error:', profileError);
            }
        }

        alert('Account created');
        await updateCurrentUser();
        await loadTheme();
    };

    document.getElementById('logout-btn').onclick = async () => {
        await supabaseClient.auth.signOut();
        await updateCurrentUser();
        await loadTheme();
        closeSettings();
    };

    ChatEngine.onClearChat = function () {
        chatContainer.innerHTML = '';
    };

    ChatEngine.onNewMessage = function (msg) {
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

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const text = messageInput.value.trim();
        if (!text) return;

        await ChatEngine.send(text);
        messageInput.value = '';
    });

    updateCurrentUser();
    loadTheme();
    ChatEngine.init();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
