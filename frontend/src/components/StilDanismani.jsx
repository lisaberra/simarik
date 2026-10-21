import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Send, User, Bot, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BibbleCharacter from './BibbleCharacter';
import { chatBibble } from '../lib/bibbleEngine';

export default function StilDanismani({ onClose, wardrobe, API_URL }) {
  const { user, isLoggedIn } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  
  const CHAT_STORAGE_KEY = 'bibble_chat_history';

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMessages(parsed.filter(msg => msg && typeof msg === 'object'));
        } else {
          localStorage.removeItem(CHAT_STORAGE_KEY);
        }
      } catch (e) {
        console.error("Geçmiş sohbet yüklenemedi", e);
        localStorage.removeItem(CHAT_STORAGE_KEY);
      }
    }
  }, []);

  // Save to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Initial greeting if no messages
  useEffect(() => {
    if (isLoggedIn && messages.length === 0) {
      const bodyType = user?.bodyType && user.bodyType !== 'Belirtilmedi' 
        ? user.bodyType 
        : 'harika';
      
      setMessages([
        {
          role: 'assistant',
          text: `Yip yip! 💜 Merhaba ${user?.name || 'stil ikonu'}! Ben Bibble, senin kişisel ve biraz da sivri dilli yapay zeka stil danışmanınım. ${bodyType} vücut tipine göre dolabındaki o ${wardrobe?.length || 0} parçayı bir şahesere dönüştürmeye geldim. Bugün ne giymek istersin, söyle bakalım?`
        }
      ]);
    }
  }, [isLoggedIn, user, messages.length, wardrobe]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const reply = await chatBibble({
        API_URL,
        message: userMsg,
        history: messages,
        user,
        wardrobe: wardrobe || []
      });
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Yip yip! Küçük bir peri tozu karışıklığı oldu ama buradayım! 💜" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    const bodyType = user?.bodyType && user.bodyType !== 'Belirtilmedi' ? user.bodyType : 'harika';
    setMessages([{ role: 'assistant', text: `Yip yip! Hafızamı sildin. Neyse ki ${bodyType} tarzını unutmadım. Ne istiyorsun?` }]);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md h-full bg-white/95 backdrop-blur-xl shadow-2xl border-l border-white/60 flex flex-col animate-slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-kahve-100/50 shrink-0">
          <div className="flex items-center gap-3">
            <BibbleCharacter mood="idle" size="sm" flying={true} />
            <div>
              <h3 className="font-serif text-xl font-bold text-kahve-600 flex items-center gap-2">
                Bibble 💜
              </h3>
              <p className="text-[11px] text-kahve-400 mt-1">Sana özel sivri dilli stil danışmanın</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetChat} className="text-[10px] text-kahve-400 hover:text-kahve-600 font-semibold px-2">Temizle</button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-cream text-kahve-400 hover:text-kahve-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isLoggedIn ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <User className="w-12 h-12 text-kahve-300" />
            <p className="font-bold text-kahve-500">Giriş yapmanız gerekiyor</p>
            <p className="text-xs text-kahve-400">Kişiselleştirilmiş stil tavsiyeleri almak ve sohbet edebilmek için giriş yapın.</p>
          </div>
        ) : (
          <>
            {/* Chat Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 animate-float">
                       <BibbleCharacter mood="mutlu" size="sm" showReaction={false} />
                    </div>
                  )}
                  
                  <div className={`px-4 py-3 max-w-[80%] text-sm rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-tr-none shadow-soft' 
                      : 'bg-purple-50 border border-purple-200 text-kahve-600 rounded-tl-none shadow-sm font-medium'
                  }`}>
                    {msg.text}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-kahve-200 text-kahve-600 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="shrink-0 animate-float">
                     <BibbleCharacter mood="saskin" size="sm" showReaction={false} />
                  </div>
                  <div className="bg-purple-50 border border-purple-200 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/50 border-t border-kahve-100/50 shrink-0">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Bibble'a yaz... (Örn: Bugün ne giysem?)"
                  className="flex-1 input-field py-3 bg-white"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isTyping}
                  className="w-12 h-12 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-soft"
                >
                  <Send className="w-5 h-5 ml-1" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
