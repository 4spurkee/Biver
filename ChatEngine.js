const SUPABASE_URL = 'https://gkfifjfxwtlkoevhalzu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZmlmamZ4d3Rsa29ldmhhbHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjgzNTksImV4cCI6MjA5NDUwNDM1OX0.H3iB6muN-Pa75nmFWusXSK_gfT5P0aunNQGHRoYwONw';

const TABLE_NAME = 'messages';

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

window.ChatEngine = {

    containerId: 'chat-container',

    _renderedIds: new Set(),

    onNewMessage: () => {},
    onClearChat: () => {},

    async _getUsername(userId) {

        if (!userId) return 'User';

        const { data } = await supabaseClient
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .maybeSingle();

        return data?.username || 'User';
    },

    async _process(msg) {

        const id = String(msg.id);

        if (this._renderedIds.has(id)) return;
        this._renderedIds.add(id);

        const username = await this._getUsername(msg.user_id);

        const d = new Date(msg.created_at);

        this.onNewMessage({
            id,
            username,
            text: DOMPurify.sanitize(msg.content),
            date: d.toLocaleDateString('uk-UA'),
            time: d.toLocaleTimeString('uk-UA')
        });
    },

    async init() {

        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .order('created_at', { ascending: true });

        if (error) console.error(error);

        if (data) {
            for (const msg of data) {
                await this._process(msg);
            }
        }

        supabaseClient
            .channel('messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: TABLE_NAME
            }, payload => {
                this._process(payload.new);
            })
            .subscribe();
    },

    async send(content) {

        const { data: { user } } =
            await supabaseClient.auth.getUser();

        if (!user) return alert('Login required');

        const { error } = await supabaseClient
            .from(TABLE_NAME)
            .insert([{
                user_id: user.id,
                content
            }]);

        if (error) console.error(error);
    }
};
