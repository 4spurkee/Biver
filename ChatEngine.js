const SUPABASE_URL = 'https://gkfifjfxwtlkoevhalzu.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY_HERE';

const TABLE_NAME = 'messages';

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

window.ChatEngine = {

    containerId: 'chat-container',

    _renderedIds: new Set(),

    onNewMessage(msg) {
        console.warn("Renderer not set");
    },

    onClearChat() {},

    _processAndEmit(rawMsg) {

        if (this._renderedIds.has(rawMsg.id)) return;
        this._renderedIds.add(rawMsg.id);

        const dateObj = new Date(rawMsg.created_at);

        const msg = {
            id: rawMsg.id,
            username: rawMsg.username || 'Unknown',
            text: DOMPurify.sanitize(rawMsg.content || ''),
            date: dateObj.toLocaleDateString(),
            time: dateObj.toLocaleTimeString()
        };

        this.onNewMessage(msg);
    },

    init: async function () {

        console.log("INIT START");

        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        console.log("INIT DATA:", data, error);

        if (data) {
            data.reverse().forEach(m => this._processAndEmit(m));
        }

        supabaseClient
            .channel('messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: TABLE_NAME
            }, payload => {

                console.log("REALTIME:", payload);

                this._processAndEmit(payload.new);
            })
            .subscribe();
    },

    send: async function (username, content) {

        const { error } = await supabaseClient
            .from(TABLE_NAME)
            .insert([{ username, content }]);

        if (error) console.error(error);
    }
};
