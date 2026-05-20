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

const openSettings = () => {
settingsPanel.classList.add('open');
settingsBackdrop.classList.add('open');
};

const closeSettings = () => {
settingsPanel.classList.remove('open');
settingsBackdrop.classList.remove('open');
};

settingsBtn.onclick = () =>
settingsPanel.classList.contains('open') ? closeSettings() : openSettings();

settingsBackdrop.onclick = closeSettings;

tabs.forEach(tab => {
tab.onclick = () => {

tabs.forEach(t => t.classList.remove('active'));
tab.classList.add('active');

document.getElementById('tab-account').classList.add('hidden');
document.getElementById('tab-themes').classList.add('hidden');

document
.getElementById(`tab-${tab.dataset.tab}`)
.classList.remove('hidden');

};
});

/* USER */
async function updateUser() {
const { data: { user } } = await supabaseClient.auth.getUser();

if (!user) {
currentUser.innerText = "Not logged in";
return;
}

const { data } = await supabaseClient
.from('profiles')
.select('username')
.eq('id', user.id)
.maybeSingle();

currentUser.innerText = data?.username || "User";
}

/* AUTH */
login-btn.onclick = async () => {
const { error } = await supabaseClient.auth.signInWithPassword({
email: email.value,
password: password.value
});

if (error) return alert(error.message);

await updateUser();
loadTheme();
closeSettings();
};

signup-btn.onclick = async () => {
const username = prompt("username");
if (!username) return;

const { data, error } = await supabaseClient.auth.signUp({
email: email.value,
password: password.value
});

if (error) return alert(error.message);

if (data?.user) {
await supabaseClient.from('profiles')
.insert([{ id: data.user.id, username, theme: 'default' }]);
}

await updateUser();
loadTheme();
};

logout-btn.onclick = async () => {
await supabaseClient.auth.signOut();
await updateUser();
loadTheme();
closeSettings();
};

/* THEMES */
const applyTheme = (theme) => {
document.body.classList.remove('theme-bloodbath', 'theme-goose');

if (theme === 'bloodbath') document.body.classList.add('theme-bloodbath');
if (theme === 'goose') document.body.classList.add('theme-goose');

localStorage.setItem('theme', theme);
};

const loadTheme = () => {
applyTheme(localStorage.getItem('theme') || 'default');
};

document.querySelectorAll('.theme-btn').forEach(btn => {
btn.onclick = () => applyTheme(btn.dataset.theme);
});

/* CHAT */
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

updateUser();
loadTheme();
ChatEngine.init();

};

document.addEventListener('DOMContentLoaded', start);
