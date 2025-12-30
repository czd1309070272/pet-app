
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Sparkles, Loader2, Bot, User, MessageSquareText, PlusCircle } from 'lucide-react';
import * as backend from '../backend';

interface Message {
  id: string;
  type: 'AI' | 'USER';
  text: string;
  time: string;
}

interface AIConsultantViewProps {
  onBack: () => void;
  pets: backend.PetProfile[];
}

const AIConsultantView: React.FC<AIConsultantViewProps> = ({ onBack, pets }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      type: 'AI', 
      text: '你好！我是你的 PawPal AI 顧問。無論是健康、飲食還是行為問題，我都在這裡為你解惑喔 ✨', 
      time: '現在' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activePetName = pets.length > 0 ? pets[0].name : '毛孩子';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || isThinking) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'USER',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      // Prepare history for backend (Gemini expects {role, text}[])
      // We take the last 10 messages to keep context without hitting token limits
      const history = messages
        .filter(m => m.id !== '1') // skip welcome message
        .map(m => ({
          role: m.type === 'AI' ? 'model' as const : 'user' as const,
          text: m.text
        }))
        .slice(-10);

      const aiResponseText = await backend.chatWithAI(text, history, activePetName);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'AI',
        text: aiResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'AI',
        text: '抱歉，我現在有點走神，請稍後再試。',
        time: '現在'
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const suggestions = [
    "貓咪吐毛球怎麼辦？",
    "如何幫幼犬挑選糧食？",
    "貓咪為什麼一直舔毛？",
    "出門旅行寵物要準備什麼？"
  ];

  // Helper function to render simple markdown-like content (bold and lists)
  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Check for bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return <div key={i} className="flex items-start space-x-2 my-1 pl-2">
          <div className="w-1.5 h-1.5 bg-current rounded-full mt-1.5 shrink-0" />
          <span>{line.replace(/^[*|-]\s+/, '')}</span>
        </div>;
      }
      // Check for bold text **text**
      const parts = line.split(/(\*\*.*?\*\*)/);
      return <div key={i} className="mb-1">
        {parts.map((part, pi) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pi} className="font-black underline decoration-purple-400/30">{part.slice(2, -2)}</strong>;
          }
          return <span key={pi}>{part}</span>;
        })}
      </div>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white">
            <ChevronLeft size={22} />
          </button>
          <div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">AI 萌寵顧問</h3>
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-green-600 font-black uppercase tracking-widest">在線實時諮詢</span>
            </div>
          </div>
        </div>
        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600">
           <MessageSquareText size={20} />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'USER' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`flex items-start max-w-[85%] space-x-3 ${msg.type === 'USER' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${msg.type === 'AI' ? 'bg-purple-500 text-white' : 'bg-white dark:bg-slate-800 text-purple-500 border border-purple-100'}`}>
                {msg.type === 'AI' ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className={`relative px-4 py-3 rounded-2xl text-sm font-medium shadow-sm border ${msg.type === 'USER' ? 'bg-purple-600 text-white border-purple-500 rounded-tr-none' : 'glass bg-white dark:bg-slate-900 dark:text-slate-100 border-white/60 dark:border-white/5 rounded-tl-none'}`}>
                <div className="leading-relaxed">
                  {renderMessageText(msg.text)}
                </div>
                <div className={`absolute bottom-[-18px] text-[8px] font-black text-gray-400 ${msg.type === 'USER' ? 'right-0' : 'left-0'}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isThinking && (
          <div className="flex justify-start animate-in fade-in">
             <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-lg flex items-center justify-center shadow-sm">
                   <Bot size={18} />
                </div>
                <div className="glass bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl rounded-tl-none border border-white/60 dark:border-white/5 flex items-center space-x-2">
                   <Loader2 className="animate-spin text-purple-500" size={14} />
                   <span className="text-xs font-black text-gray-400">正在思考建議...</span>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-100 dark:border-white/5 safe-bottom">
        {/* Quick Suggestions */}
        {messages.length < 5 && !isThinking && (
          <div className="flex space-x-2 overflow-x-auto pb-4 scrollbar-hide">
            {suggestions.map((s, i) => (
              <button 
                key={i} 
                onClick={() => handleSend(s)}
                className="flex-shrink-0 px-4 py-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 text-[10px] font-black rounded-full border border-purple-100 dark:border-purple-500/20 active:scale-95 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-3">
           <button className="text-gray-400 hover:text-purple-500 transition-colors">
              <PlusCircle size={24} />
           </button>
           <div className="flex-1 relative">
             <input 
               type="text" 
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && handleSend()}
               placeholder="描述寵物的症狀或問題..."
               className="w-full bg-gray-100 dark:bg-slate-800 border-none rounded-2xl py-3 px-5 text-sm font-bold focus:ring-2 focus:ring-purple-500 transition-all dark:text-white"
             />
             <button 
               onClick={() => handleSend()}
               disabled={!inputText.trim() || isThinking}
               className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${inputText.trim() ? 'bg-purple-500 text-white shadow-lg active:scale-90' : 'text-gray-300'}`}
             >
                {isThinking ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
             </button>
           </div>
        </div>
        <p className="text-center text-[8px] text-gray-400 font-bold mt-3 uppercase tracking-widest opacity-50">AI 建議僅供參考，重症請務必就醫</p>
      </div>
    </div>
  );
};

export default AIConsultantView;
