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

    onNewMessage: function(msg) {
        console.warn("onNewMessage not configured");
    },

    onClearChat: function() {
        console.warn("onClearChat not configured");
    },

    _renderHistoryBanner: function() {

        const container = document.getElementById(this.containerId);

        if (!container) return;

        if (document.getElementById('engine-history-banner')) return;

        const banner = document.createElement('div');

        banner.id = 'engine-history-banner';
        banner.className = 'history-info';

        banner.innerText =
            'Showing last 10 messages — click to load more';

        banner.addEventListener('click', () => {
            this.loadFullHistory();
        });

        container.prepend(banner);
    },

    _removeHistoryBanner: function() {

        const banner = document.getElementById('engine-history-banner');

        if (banner) banner.remove();
    },

    _processAndEmit: function(rawMsg) {

        if (this._renderedIds.has(rawMsg.id)) return;

        this._renderedIds.add(rawMsg.id);

        const dateObj = new Date(rawMsg.created_at);

        const safeMessage = {

            id: rawMsg.id,

            username: rawMsg.username || 'Unknown',

            text: DOMPurify.sanitize(rawMsg.content, {
                ALLOWED_TAGS: [
                    'b','i','u','strong','em','img','a','br','code'
                ],
                ALLOWED_ATTR: ['src','href','target','alt']
            }),

            date: dateObj.toLocaleDateString('uk-UA', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            }),

            time: dateObj.toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        };

        this.onNewMessage(safeMessage);
    },

    init: async function() {

        const { data } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) {

            data.reverse().forEach(msg => {
                this._processAndEmit(msg);
            });

            if (data.length >= 10) {
                this._renderHistoryBanner();
            }
        }

        supabaseClient
            .channel('messages-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: TABLE_NAME
                },
                async payload => {

                    const msg = payload.new;

                    const { data: profile } =
                        await supabaseClient
                            .from('profiles')
                            .select('username')
                            .eq('id', msg.user_id)
                            .single();

                    this._processAndEmit({
                        ...msg,
                        profiles: {
                            username: profile?.username || 'Unknown'
                        }
                    });
                }
            )
            .subscribe();
    },

    loadFullHistory: async function() {

const { data, error } = await supabaseClient
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

console.log('INIT DATA:', data);
console.log('INIT ERROR:', error);

        this._renderedIds.clear();

        this.onClearChat();

        this._removeHistoryBanner();

        data.forEach(msg => {
            this._processAndEmit(msg);
        });
    },

    send: async function(content) {

        const { data: { user } } =
            await supabaseClient.auth.getUser();

        if (!user) {
            alert('You must be logged in');
            return;
        }

        const { error } = await supabaseClient
            .from(TABLE_NAME)
            .insert([{
                user_id: user.id,
                content: content
            }]);

        if (error) {
            console.error(error);
        }
    }
};
