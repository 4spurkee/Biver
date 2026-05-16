const SUPABASE_URL = 'https://gkfifjfxwtlkoevhalzu.supabase.co/rest/v1/';
const SUPABASE_KEY = 'sb_publishable_5_E6pdq5U5M_-ai_4DQ_3Q_TKnVYY-2';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * @typedef {Object} ChatMessage
 * @property {string} id - Унікальний ідентифікатор повідомлення.
 * @property {string} username - Нікнейм автора.
 * @property {string} text - Безпечний HTML-текст (очищений від XSS).
 * @property {string} date - Дата відправки (ДД.ММ.РР).
 * @property {string} time - Час відправки (ГГ:ХХ:СС).
 */

window.ChatEngine = {
    containerId: 'chat-container', // ID контейнера чату в HTML
    _renderedIds: new Set(),
    _optimisticEcho: new Set(), 

    /** @param {ChatMessage} msg @param {boolean} prepend */
    onNewMessage: function(msg, prepend = false) { console.warn("onNewMessage не налаштовано!"); },
    onClearChat: function() { console.warn("onClearChat не налаштовано!"); },
    
    // Внутрішній метод створення плашки історії
    _renderHistoryBanner: function() {
        const container = document.getElementById(this.containerId);
        if (!container || document.getElementById('engine-history-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'engine-history-banner';
        banner.className = 'history-info';
        banner.innerText = 'Показано останні 10 повідомлень. Клікніть сюди, щоб завантажити більше';
        
        banner.addEventListener('click', () => {
            this.loadFullHistory();
        });

        container.prepend(banner);
    },

    // Внутрішній метод видалення плашки
    _removeHistoryBanner: function() {
        const banner = document.getElementById('engine-history-banner');
        if (banner) banner.remove();
    },

    // Внутрішній парсер та валідатор повідомлень
    _processAndEmit: function(rawMsg, prepend = false) {
        if (!rawMsg.id.toString().startsWith('temp_')) {
            const echoKey = `${rawMsg.username}_${rawMsg.content}`;
            if (this._optimisticEcho.has(echoKey)) {
                this._optimisticEcho.delete(echoKey);
                this._renderedIds.add(rawMsg.id); 
                return; 
            }
        }

        if (this._renderedIds.has(rawMsg.id)) return;
        this._renderedIds.add(rawMsg.id);

        const dateObj = new Date(rawMsg.created_at);
        
        const safeMessage = {
            id: rawMsg.id,
            username: rawMsg.username,
            text: DOMPurify.sanitize(rawMsg.content, { ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'img', 'a', 'br', 'code'], ALLOWED_ATTR: ['src', 'href', 'target', 'alt'] }),
            date: dateObj.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' }),
            time: dateObj.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        this.onNewMessage(safeMessage, prepend);
    },

    init: async function() {
        const { data, error } = await supabaseClient.from('messages').select('*').order('created_at', { ascending: false }).limit(10);
        if (!error && data) {
            data.reverse().forEach(msg => this._processAndEmit(msg));
            if (data.length >= 10) {
                this._renderHistoryBanner();
            }
        }

        supabaseClient
            .channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
                this._processAndEmit(payload.new);
            }).subscribe();
    },

    loadFullHistory: async function() {
        const { data, error } = await supabaseClient.from('messages').select('*').order('created_at', { ascending: true });
        if (!error) {
            this._renderedIds.clear(); 
            this._optimisticEcho.clear();
            this.onClearChat();        
            this._removeHistoryBanner(); // Автоматично ховаємо плашку, бо завантажено ВСЕ
            data.forEach(msg => this._processAndEmit(msg));
        }
    },

    send: async function(username, content) {
        const tempId = 'temp_' + Date.now();
        const echoKey = `${username}_${content}`;
        this._optimisticEcho.add(echoKey);

        this._processAndEmit({
            id: tempId,
            username: username,
            content: content,
            created_at: new Date().toISOString()
        });

        const { error } = await supabaseClient.from('messages').insert([{ username, content }]);
        if (error) console.error('Помилка Supabase:', error);
    }
};