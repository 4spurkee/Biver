const SUPABASE_URL = 'https://gkfifjfxwtlkoevhalzu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZmlmamZ4d3Rsa29ldmhhbHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjgzNTksImV4cCI6MjA5NDUwNDM1OX0.H3iB6muN-Pa75nmFWusXSK_gfT5P0aunNQGHRoYwONw';

const TABLE_NAME = 'messages';

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

window.ChatEngine = {

    containerId: 'chat-container',

    _renderedIds: new Set(),

    onNewMessage: function () {},
    onClearChat: function () {},

    _bannerShown: false,

    _renderHistoryBanner() {

        const el = document.createElement('div');
        el.className = 'history-info';
        el.id = 'history-banner';
        el.innerText = 'Showing last 10 messages — click to load full history';

        el.onclick = () => this.loadFullHistory();

        document.getElementById(this.containerId).prepend(el);

        this._bannerShown = true;
    },

    _removeBanner() {
        const b = document.getElementById('history-banner');
        if (b) b.remove();
    },

    _process(msg) {

        if (this._renderedIds.has(msg.id)) return;
        this._renderedIds.add(msg.id);

        const d = new Date(msg.created_at);

        this.onNewMessage({
            id: msg.id,
            username: msg.username || "Unknown",
            text: DOMPurify.sanitize(msg.content || ''),
            date: d.toLocaleDateString(),
            time: d.toLocaleTimeString()
        });
    },

    async init() {

        console.log("ChatEngine INIT");

        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) console.error(error);

        if (data) {
            data.reverse().forEach(m => this._process(m));

            if (data.length >= 10) {
                this._renderHistoryBanner();
            }
        }

        supabaseClient
            .channel('chat')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: TABLE_NAME
            }, payload => {

                this._process(payload.new);
            })
            .subscribe();
    },

    async loadFullHistory() {

        const { data } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .order('created_at', { ascending: true });

        this._renderedIds.clear();

        this.onClearChat();

        this._removeBanner();

        data.forEach(m => this._process(m));
    },

    async send(username, content) {

        await supabaseClient
            .from(TABLE_NAME)
            .insert([{ username, content }]);
    }
};
