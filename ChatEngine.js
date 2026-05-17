const SUPABASE_URL = 'https://gkfifjfxwtlkoevhalzu.supabase.co';

const SUPABASE_KEY =
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZmlmamZ4d3Rsa29ldmhhbHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjgzNTksImV4cCI6MjA5NDUwNDM1OX0.H3iB6muN-Pa75nmFWusXSK_gfT5P0aunNQGHRoYwONw';

const TABLE_NAME = 'messages';

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

window.ChatEngine = {

    containerId: 'chat-container',
    _renderedIds: new Set(),

    onNewMessage(msg) {},
    onClearChat() {},

    _processAndEmit(rawMsg) {

        if (this._renderedIds.has(rawMsg.id)) return;
        this._renderedIds.add(rawMsg.id);

        const dateObj = new Date(rawMsg.created_at);

        const safeMessage = {
            id: rawMsg.id,
            username: rawMsg.username || 'User',
            text: DOMPurify.sanitize(rawMsg.content),
            date: dateObj.toLocaleDateString(),
            time: dateObj.toLocaleTimeString()
        };

        this.onNewMessage(safeMessage);
    },

    init: async function() {

        const { data } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .order('created_at', { ascending: true });

        if (data) {
            data.forEach(msg => this._processAndEmit(msg));
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

    send: async function(content) {

        const { data: { user } } =
            await supabaseClient.auth.getUser();

        if (!user) {
            alert("Login required");
            return;
        }

        await supabaseClient
            .from(TABLE_NAME)
            .insert([{
                user_id: user.id,
                content: content
            }]);
    }
};
