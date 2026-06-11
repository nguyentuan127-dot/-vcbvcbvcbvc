// chatbot.js
const API_KEY = "sk-fd671dc76a94414aa62442f35387514e";
const API_URL = "https://api.deepseek.com/chat/completions";

const KNOWLEDGE_BASE = `
[THÔNG TIN CHUNG]
Tên thương hiệu: Heirloom Coffee
Slogan: Tuyệt Tác Cà Phê, khơi nguồn cảm hứng
Định vị: Cà phê đặc sản (Specialty Coffee), rang xay thủ công độc bản.

[BỘ SƯU TẬP & SẢN PHẨM]
1. Heritage Blend (Espresso) - Giá: 250.000đ. Đậm đà, kết hợp Robusta & Arabica.
2. Single Origin Arabica (Pour Over) - Giá: 320.000đ. Hương hoa, chua thanh, ngọt lịm.
3. Gói Trải Nghiệm Thượng Lưu (Đăng ký định kỳ) - Giá: Từ 450.000đ/tháng.

[LIÊN HỆ & HỖ TRỢ]
Website: https://heirloomcoffee.com
Chỉ trả lời các thông tin nằm trong tài liệu này. Nếu khách hỏi ngoài lề (ví dụ: code, thời tiết, chính trị), hãy từ chối nhẹ nhàng, chuyên nghiệp và hướng dẫn họ liên hệ qua website.
`;

const systemPrompt = `Bạn là AI trợ lý độc quyền dành cho chuyên gia của Heirloom Coffee. 
Hãy trả lời dựa trên Knowledge Base. Trình bày Markdown đẹp mắt.
Luôn chào hỏi thân thiện ở đầu và kết thúc bằng một câu mời hỏi thêm.

KNOWLEDGE BASE:
${KNOWLEDGE_BASE}`;

let chatHistory = [];

async function callDeepSeekAPI(userMessage) {
    if (chatHistory.length === 0) {
        chatHistory.push({ role: 'system', content: systemPrompt });
    }
    chatHistory.push({ role: 'user', content: userMessage });

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat', // DeepSeek-V3/V4
                messages: chatHistory,
                temperature: 0.5,
                max_tokens: 1024
            })
        });

        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        const reply = data.choices[0].message.content;
        chatHistory.push({ role: 'assistant', content: reply });
        return reply;
    } catch (error) {
        chatHistory.pop(); // Xóa tin nhắn vừa rồi nếu lỗi
        throw error;
    }
}

function initChatbot() {
    // 1. Inject UI
    const chatbotHTML = `
        <div id="chatbot-container" class="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            <div id="chatbot-window" class="hidden flex-col w-[350px] sm:w-[420px] h-[550px] max-h-[80vh] rounded-3xl overflow-hidden chatbot-glass transition-all duration-300 mb-4 origin-bottom-right scale-95 opacity-0">
                <div class="flex justify-between items-center px-5 py-4 border-b border-gray-200/50 bg-white/40 shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            <div class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-white shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                        </div>
                        <span class="font-semibold text-gray-800 text-lg">Heirloom Bot</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="chatbot-refresh" class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Làm mới">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </button>
                        <button id="chatbot-close" class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Đóng">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>
                <div id="chatbot-messages" class="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-4 scroll-smooth"></div>
                <div class="p-4 bg-white/50 border-t border-gray-200/50 shrink-0">
                    <div class="relative flex items-center">
                        <input type="text" id="chatbot-input" placeholder="Hỏi Heirloom Bot..." class="w-full bg-white/70 border border-gray-300/50 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm">
                        <button id="chatbot-send" class="absolute right-1.5 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors flex items-center justify-center shadow-md disabled:opacity-50">
                            <svg class="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
            <button id="chatbot-toggle" class="bg-gradient-to-tr from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border-2 border-white/20">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const refreshBtn = document.getElementById('chatbot-refresh');
    const chatWindow = document.getElementById('chatbot-window');
    const messagesContainer = document.getElementById('chatbot-messages');
    const inputField = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');

    const welcomeMessage = "Chào bạn! Tôi là Heirloom Bot, chuyên gia về các dòng cà phê nghệ thuật. Tôi có thể hỗ trợ gì cho bạn hôm nay?";
    
    // Hàm phụ trợ
    function appendMessage(role, content, isError = false) {
        const div = document.createElement('div');
        const isUser = role === 'user';
        const userClasses = 'bg-blue-600 text-white rounded-2xl rounded-tr-sm self-end px-4 py-2.5 text-sm shadow-md';
        const assistantClasses = `bg-gray-100/90 ${isError ? 'text-red-600' : 'text-gray-800'} rounded-2xl rounded-tl-sm self-start px-4 py-3 text-sm shadow-sm border border-gray-200/50 chat-markdown`;
        
        div.className = `max-w-[85%] ${isUser ? userClasses : assistantClasses}`;
        
        // Parse Markdown nếu là bot (dùng window.marked tải từ CDN)
        div.innerHTML = isUser ? escapeHTML(content) : (window.marked ? window.marked.parse(content) : content);
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTyping() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'max-w-[85%] bg-gray-100/90 px-4 py-3.5 rounded-2xl rounded-tl-sm self-start w-fit shadow-sm border border-gray-200/50 flex items-center gap-1.5';
        div.innerHTML = '<div class="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot"></div><div class="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot"></div><div class="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot"></div>';
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return id;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));
    }

    // Init logic
    appendMessage('assistant', welcomeMessage);

    toggleBtn.addEventListener('click', () => {
        chatWindow.classList.remove('hidden');
        setTimeout(() => {
            chatWindow.classList.remove('scale-95', 'opacity-0');
            chatWindow.classList.add('scale-100', 'opacity-100');
        }, 10);
        toggleBtn.classList.add('hidden');
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('scale-100', 'opacity-100');
        chatWindow.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            chatWindow.classList.add('hidden');
            toggleBtn.classList.remove('hidden');
        }, 300);
    });

    refreshBtn.addEventListener('click', () => {
        const icon = refreshBtn.querySelector('svg');
        icon.classList.add('animate-spin');
        chatHistory = []; // clear history
        messagesContainer.innerHTML = '';
        setTimeout(() => {
            appendMessage('assistant', welcomeMessage);
            icon.classList.remove('animate-spin');
        }, 500);
    });

    const handleSend = async () => {
        const text = inputField.value.trim();
        if (!text) return;
        inputField.value = '';
        sendBtn.disabled = true;
        
        appendMessage('user', text);
        const typingId = showTyping();

        try {
            const response = await callDeepSeekAPI(text);
            document.getElementById(typingId)?.remove();
            appendMessage('assistant', response);
        } catch (error) {
            document.getElementById(typingId)?.remove();
            appendMessage('assistant', '⚠️ Hệ thống đang bận hoặc có lỗi kết nối. Vui lòng thử lại sau.', true);
        } finally {
            sendBtn.disabled = false;
            inputField.focus();
        }
    };

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    initChatbot();
}
