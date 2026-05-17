const SUPABASE_URL = 'https://gkfifjfxwtlkoevhalzu.supabase.co';

const SUPABASE_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZmlmamZ4d3Rsa29ldmhhbHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjgzNTksImV4cCI6MjA5NDUwNDM1OX0.H3iB6muN-Pa75nmFWusXSK_gfT5P0aunNQGHRoYwONw";

const TABLE_NAME = 'messages';

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

window.ChatEngine = {

    containerId: 'chat-container',

    _renderedIds: new Set(),
    _userCache: {},

    onNewMessage: function(msg) {},
    onClearChat: function() {},

    // -------------------------------
    // LOAD ALL PROFILES ONCE
    // -------------------------------
    async _loadProfiles() {

        const { data } = await supabaseClient
            .from('profiles')
            .select('id, username');

        if (!data) return;

        data.forEach(p => {
            this._userCache[p.id] = p.username;
        });
    },

    // -------------------------------
    // PROCESS MESSAGE
    // -------------------------------
    async _processAndEmit(rawMsg) {

        if (this._renderedIds.has(rawMsg.id)) return;
        this._renderedIds.add(rawMsg.id);

        const dateObj = new Date(rawMsg.created_at);

        const username =
            this._userCache[rawMsg.user_id] || 'User';

        const safeMessage = {
            id: rawMsg.id,
            username,
            text: DOMPurify.sanitize(rawMsg.content, {
                ALLOWED_TAGS: [
                    'b','i','u','strong','em','img','a','br','code'
                ],
                ALLOWED_ATTR: ['src','href','target','alt']
            }),
            date: dateObj.toLocaleDateString(),
            time: dateObj.toLocaleTimeString()
        };

        this.onNewMessage(safeMessage);
    },

    // -------------------------------
    // INIT SYSTEM
    // -------------------------------
    init: async function() {

        await this._loadProfiles();

        const { data } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .order('created_at', { ascending: true });

        if (data) {
            for (const msg of data) {
                await this._processAndEmit(msg);
            }
        }

        supabaseClient
            .channel('messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: TABLE_NAME
                },
                payload => {
                    this._processAndEmit(payload.new);
                }
            )
            .subscribe();
    },

    // -------------------------------
    // SEND MESSAGE
    // -------------------------------
    send: async function(content) {

        const { data: { user } } =
            await supabaseClient.auth.getUser();

        if (!user) {
            alert("You must be logged in");
            return;
        }

        const { error } = await supabaseClient
            .from(TABLE_NAME)
            .insert([{
                user_id: user.id,
                content: content
            }]);

        if (error) console.error(error);
    }
};
