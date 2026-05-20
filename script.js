const start = () => {

    const chatContainer = document.getElementById('chat-container');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message');

    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const currentUser = document.getElementById('current-user');

    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsBackdrop = document.getElementById('settings-backdrop');

    const tabs = document.querySelectorAll('.settings-tab');
    const tabAccount = document.getElementById('tab-account');
    const tabThemes = document.getElementById('tab-themes');

    const themeButtons = document.querySelectorAll('.theme-btn');

    // ---------------- SETTINGS ----------------

    const openSettings = () => {
        settingsPanel.classList.add('open');
        settingsBackdrop.classList.add('open');
    };

    const closeSettings = () => {
        settingsPanel.classList.remove('open');
        settingsBackdrop.classList.remove('open');
    };

    settingsBtn.onclick = () => {
        settingsPanel.classList.contains('open')
            ? closeSettings()
            : openSettings();
    };

    settingsBackdrop.onclick = closeSettings;

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeSettings();
    });

    // ---------------- TABS ----------------

    tabs.forEach(tab => {
        tab.onclick = () => {

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            tabAccount.classList.add('hidden');
            tabThemes.classList.add('hidden');

            const target = document.getElementById(
                'tab-' + tab.dataset.tab
            );

            if (target) target.classList.remove('hidden');
        };
    });

    // ---------------- THEMES ----------------

    const applyTheme = (theme) => {
        document.body.classList.remove('theme-bloodbath', 'theme-goose');

        if (theme === 'bloodbath')
            document.body.classList.add('theme-bloodbath');

        if (theme === 'goose')
            document.body.classList.add('theme-goose');

        localStorage.setItem('theme', theme);
    };

    const saveTheme = async (theme) => {

        const { data: { user } } =
            await supabaseClient.auth.getUser();

        if (!user) return;

        const { error } = await supabaseClient
            .from('profiles')
            .update({ theme })
            .eq('id', user.id);

        if (error) console.error(error);

        applyTheme(theme);
    };

    const loadTheme = async () => {

        const { data: { user } } =
            await supabaseClient.auth.getUser();

        if (!user) {
            applyTheme('default');
            return;
        }

        const { data } = await supabaseClient
            .from('profiles')
            .select('theme')
            .eq('id', user.id)
            .maybeSingle();

        applyTheme(data?.theme || 'default');
    };

    themeButtons.forEach(btn => {
        btn.onclick = () => saveTheme(btn.dataset.theme);
    });

    // ---------------- USER ----------------

    async function updateUser() {

        const { data: { user } } =
            await supabaseClient.auth.getUser();

        if (!user) {
            currentUser.innerText = 'Not logged in';
            return;
        }

        const { data } = await supabaseClient
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .maybeSingle();

        currentUser.innerText = data?.username || 'User';
    }

    document.getElementById('login-btn').onclick = async () => {

        const { error } =
            await supabaseClient.auth.signInWithPassword({
                email: email.value,
                password: password.value
            });

        if (error) return alert(error.message);

        await updateUser();
        await loadTheme();
        closeSettings();
    };

    document.getElementById('signup-btn').onclick = async () => {

        const username = prompt('username');
        if (!username) return;

        const { data, error } =
            await supabaseClient.auth.signUp({
                email: email.value,
                password: password.value
            });

        if (error) return alert(error.message);

        if (data?.user) {
            await supabaseClient
                .from('profiles')
                .insert([{
                    id: data.user.id,
                    username,
                    theme: 'default'
                }]);
        }

        await updateUser();
        await loadTheme();
    };

    document.getElementById('logout-btn').onclick = async () => {
        await supabaseClient.auth.signOut();
        await updateUser();
        await loadTheme();
        closeSettings();
    };

    // ---------------- CHAT UI ----------------

    ChatEngine.onClearChat = () => {
        chatContainer.innerHTML = '';
    };

    ChatEngine.onNewMessage = (msg) => {

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

    // ---------------- INIT ----------------

    updateUser();
    loadTheme();
    ChatEngine.init();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
