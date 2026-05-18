const SUPABASE_URL = 'https://gkfifjfxwtlkoevhalzu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZmlmamZ4d3Rsa29ldmhhbHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjgzNTksImV4cCI6MjA5NDUwNDM1OX0.H3iB6muN-Pa75nmFWusXSK_gfT5P0aunNQGHRoYwONw';
const TABLE_NAME = 'messages';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.ChatEngine = {
    containerId: 'chat-container',
    _renderedIds: new Set(),
    _userCache: {},

    onNewMessage: function (msg) {
        console.warn('onNewMessage not configured');
    },

    onClearChat: function () {
        console.warn('onClearChat not configured');
    },

    async _loadProfiles() {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('id, username');

        if (error) {
            console.error('Profile load error:', error);
            return;
        }

        if (data) {
            data.forEach((p) => {
                this._userCache[p.id] = p.username;
            });
        }
    },

    async _resolveUsername(userId) {
        if (!userId) return 'User';

        if (this._userCache[userId]) {
            return this._userCache[userId];
        }

        const { data, error } = await supabaseClient
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error('Username lookup error:', error);
        }

        const username = data?.username || 'User';
        this._userCache[userId] = username;
        return username;
    },

    async _processAndEmit(rawMsg) {
        const idKey = String(rawMsg.id);

        if (this._renderedIds.has(idKey)) return;
        this._renderedIds.add(idKey);

        const username = await this._resolveUsername(rawMsg.user_id);
        const dateObj = new Date(rawMsg.created_at);

        const safeMessage = {
            id: rawMsg.id,
            username,
            text: DOMPurify.sanitize(rawMsg.content, {
                ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'img', 'a', 'br', 'code'],
                ALLOWED_ATTR: ['src', 'href', 'target', 'alt']
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

    init: async function () {
        await this._loadProfiles();

        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Message load error:', error);
        }

        if (data) {
            for (const msg of data) {
                await this._processAndEmit(msg);
            }
        }

        supabaseClient
            .channel('messages-live')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: TABLE_NAME
                },
                (payload) => {
                    this._processAndEmit(payload.new);
                }
            )
            .subscribe((status) => {
                console.log('REALTIME STATUS:', status);
            });
    },

    send: async function (content) {
        const {
            data: { user }
        } = await supabaseClient.auth.getUser();

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
            console.error('Supabase error:', error);
        }
    }
};
