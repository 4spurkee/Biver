const start = () => {

    const chatContainer =
        document.getElementById('chat-container');

    const chatForm =
        document.getElementById('chat-form');

    const messageInput =
        document.getElementById('message');

    const email =
        document.getElementById('email');

    const password =
        document.getElementById('password');

    const currentUser =
        document.getElementById('current-user');

    const settingsBtn =
        document.getElementById('settings-btn');

    const settingsPanel =
        document.getElementById('settings-panel');

    const settingsBackdrop =
        document.getElementById('settings-backdrop');

    const tabs =
        document.querySelectorAll('.settings-tab');

    const tabAccount =
        document.getElementById('tab-account');

    const tabThemes =
        document.getElementById('tab-themes');

    const themeButtons =
        document.querySelectorAll('.theme-btn');

    // SETTINGS PANEL

    function openSettings(){

        settingsPanel.classList.add('open');
        settingsBackdrop.classList.add('open');

    }

    function closeSettings(){

        settingsPanel.classList.remove('open');
        settingsBackdrop.classList.remove('open');

    }

    settingsBtn.onclick = () => {

        settingsPanel.classList.contains('open')
            ? closeSettings()
            : openSettings();

    };

    settingsBackdrop.onclick =
        closeSettings;

    document.addEventListener(
        'keydown',
        (e)=>{

            if(e.key==="Escape"){
                closeSettings();
            }

        }
    );

    // TABS

    tabs.forEach(tab=>{

        tab.onclick=()=>{

            tabs.forEach(
                t=>t.classList.remove('active')
            );

            tab.classList.add('active');

            tabAccount.classList.add('hidden');
            tabThemes.classList.add('hidden');

            document
                .getElementById(
                    `tab-${tab.dataset.tab}`
                )
                .classList.remove('hidden');

        };

    });

    // THEMES

    function applyTheme(theme){

        document.body.classList.remove(
            'theme-bloodbath',
            'theme-goose'
        );

        if(
            theme==="bloodbath"
        ){

            document.body.classList.add(
                'theme-bloodbath'
            );

        }

        if(
            theme==="goose"
        ){

            document.body.classList.add(
                'theme-goose'
            );

        }

    }

    async function loadTheme(){

        const {
            data:{user}
        }=
        await supabaseClient
        .auth
        .getUser();

        if(!user){

            applyTheme(
                'default'
            );

            return;

        }

        const {
            data
        }=
        await supabaseClient
        .from('profiles')
        .select('theme')
        .eq(
            'id',
            user.id
        )
        .maybeSingle();

        applyTheme(
            data?.theme
            ||
            'default'
        );

    }

    async function saveTheme(theme){

        const {
            data:{user}
        }=
        await supabaseClient
        .auth
        .getUser();

        if(!user){

            alert(
                "Login first"
            );

            return;

        }

        await supabaseClient
        .from('profiles')
        .update({
            theme
        })
        .eq(
            'id',
            user.id
        );

        applyTheme(theme);

    }

    themeButtons.forEach(btn=>{

        btn.onclick=()=>{

            saveTheme(
                btn.dataset.theme
            );

        };

    });

    // USER DISPLAY

    async function updateCurrentUser(){

        const {
            data:{user}
        }=
        await supabaseClient
        .auth
        .getUser();

        if(!user){

            currentUser.innerText=
            "Not logged in";

            return;

        }

        const {
            data
        }=
        await supabaseClient
        .from('profiles')
        .select('username')
        .eq(
            'id',
            user.id
        )
        .maybeSingle();

        currentUser.innerText=

            data?.username
            ||
            "User";

    }

    // LOGIN

    document
    .getElementById(
        'login-btn'
    )
    .onclick=async()=>{

        const {
            error
        }=
        await supabaseClient
        .auth
        .signInWithPassword({

            email:
            email.value,

            password:
            password.value

        });

        if(error){

            alert(
                error.message
            );

            return;

        }

        await updateCurrentUser();
        await loadTheme();

        closeSettings();

    };

    // SIGNUP

    document
    .getElementById(
        'signup-btn'
    )
    .onclick=async()=>{

        const username=
        prompt(
            "username"
        );

        if(!username)
        return;

        const {
            data,
            error
        }=
        await supabaseClient
        .auth
        .signUp({

            email:
            email.value,

            password:
            password.value

        });

        if(error){

            alert(
                error.message
            );

            return;

        }

        await supabaseClient
        .from('profiles')
        .insert([{

            id:
            data.user.id,

            username,

            theme:
            'default'

        }]);

        alert(
            "Account created"
        );

        await updateCurrentUser();

    };

    // LOGOUT

    document
    .getElementById(
        'logout-btn'
    )
    .onclick=async()=>{

        await supabaseClient
        .auth
        .signOut();

        await updateCurrentUser();
        await loadTheme();

        closeSettings();

    };

    // CHAT

    ChatEngine.onClearChat=()=>{

        chatContainer.innerHTML='';

    };

    ChatEngine.onNewMessage=
    (msg)=>{

        const div=
        document
        .createElement('div');

        div.className=
        'message';

        div.innerHTML=`

[<small>
${msg.date}
${msg.time}
</small>]

<b>
${msg.username}:
</b>

<span>
${msg.text}
</span>

`;

        chatContainer
        .appendChild(div);

        window.scrollTo(

            0,

            document.body
            .scrollHeight

        );

    };

    chatForm.onsubmit=
    async(e)=>{

        e.preventDefault();

        const text=
        messageInput
        .value
        .trim();

        if(!text)
        return;

        await ChatEngine
        .send(text);

        messageInput.value='';

    };

    updateCurrentUser();
    loadTheme();
    ChatEngine.init();

};

if(
    document.readyState
    ===
    'loading'
){

document.addEventListener(
'DOMContentLoaded',
start
);

}else{

start();

}
