
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Sparkles, Loader2, Bot, User, MessageSquareText, PlusCircle, ThumbsUp, ThumbsDown, CheckCircle2, Bug, WifiOff, ServerCrash, ShoppingBag, History, Clock, ChevronRight, Trash2, X, AlertTriangle } from 'lucide-react';
import * as aiFeatures from '../services/aiFeatures';
import * as backend from '../backend';
import { WarningCard, SuggestionCard, KnowledgeCard, ChatErrorCard, ProductRecommendCard, GenericCard } from './consultant/AIConsultantCards';
import { getErrorDetail } from '../constants/errorConfig';
import { View } from '../types';

interface Message {
  id: string;
  type: 'AI' | 'USER';
  text: string;
  time: string;
  cardData?: aiFeatures.AIConsultantCard;
  feedback?: 'HELPFUL' | 'NOT_HELPFUL';
  isStreaming?: boolean;
  isError?: boolean;
  errorCode?: number;
}

interface AIConsultantViewProps {
  onBack: () => void;
  onNavigate: (view: View, data?: any) => void;
  pets: backend.PetProfile[];
}

type ViewMode = 'CHAT' | 'HISTORY_LIST';

const AIConsultantView: React.FC<AIConsultantViewProps> = ({ onBack, onNavigate, pets }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('CHAT');
  const [historySessions, setHistorySessions] = useState<aiFeatures.AIHistorySession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isHistoryEditMode, setIsHistoryEditMode] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<aiFeatures.AIHistorySession | null>(null);

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
  const longPressTimer = useRef<number | null>(null);

  const activePetName = pets.length > 0 ? pets[0].name : '毛孩子';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (viewMode === 'CHAT') {
      scrollToBottom();
    }
  }, [messages, isThinking, viewMode]);

  const handleOpenHistory = async () => {
    setViewMode('HISTORY_LIST');
    setIsHistoryEditMode(false);
    setIsLoadingHistory(true);
    try {
      const data = await aiFeatures.fetchAIHistorySessions();
      setHistorySessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSelectHistory = async (sessionId: string) => {
    if (isHistoryEditMode) return;
    setIsThinking(true);
    setViewMode('CHAT');
    try {
      const historyMsgs = await aiFeatures.fetchAIHistoryMessages(sessionId);
      setMessages(historyMsgs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleLongPressStart = (session: aiFeatures.AIHistorySession) => {
    if (isHistoryEditMode) return;
    longPressTimer.current = window.setTimeout(() => {
      setIsHistoryEditMode(true);
      if (window.navigator.vibrate) window.navigator.vibrate([20, 50, 20]);
    }, 600);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await aiFeatures.deleteAIHistorySession(sessionToDelete.id);
      setHistorySessions(prev => prev.filter(s => s.id !== sessionToDelete.id));
      setSessionToDelete(null);
      if (historySessions.length <= 1) setIsHistoryEditMode(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFeedback = (msgId: string, type: 'HELPFUL' | 'NOT_HELPFUL') => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: type } : m));
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

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

    const aiMsgId = (Date.now() + 1).toString();

    try {
      // const history = messages
      //   .filter(m => m.id !== '1' && !m.isError)
      //   .map(m => ({
      //     role: m.type === 'AI' ? 'model' as const : 'user' as const,
      //     text: m.text
      //   }))
      //   .slice(-10);

      const filtered = messages
        .filter(m => m.id !== '1' && !m.isError);

      // 從後往前找，收集最新的一輪（user + model）
      const latestRound: { role: 'user' | 'model'; text: string }[] = [];

      for (let i = filtered.length - 1; i >= 0; i--) {
        const msg = filtered[i];
        const role = msg.type === 'AI' ? 'model' : 'user';
        
        latestRound.unshift({ role, text: msg.text }); // 從後往前插到前面，保持順序
        
        // 已經找到一對就停止（user 和 model 都出現過）
        if (latestRound.some(m => m.role === 'user') && 
            latestRound.some(m => m.role === 'model')) {
          break;
        }
        
        // 如果只剩 user（最後一條是用戶剛發的，還沒回覆），也保留
        if (latestRound.length >= 2) break;
      }

      const history = latestRound;

      const mockCard = await aiFeatures.getMockCardForMessage(text, activePetName);

      setIsThinking(false);
      setMessages(prev => [...prev, {
        id: aiMsgId,
        type: 'AI',
        text: '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cardData: mockCard || undefined,
        isStreaming: true
      }]);
      
      const stream = aiFeatures.chatWithAIStream(text, history, activePetName);
      let aiFullText = "";

      for await (const chunk of stream) {
        aiFullText += chunk;
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, text: aiFullText } : m
        ));
      }
      
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isStreaming: false } : m));

    } catch (err: any) {
      console.error("Chat Stream Error:", err.message || err);
      setIsThinking(false);
      
      setMessages(prev => prev.filter(m => m.id !== aiMsgId));

      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        type: 'AI',
        text: err.message || "抱歉，連線好像出了一點問題...", 
        isError: true,
        errorCode: err.code || 500,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const suggestions = [
    "推薦好用的貓砂？",
    "什麼時候該驅蟲？",
    "來個寵物冷知識 ✨",
    "如何挑選糧食？"
  ];

  const renderMessageText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return <div key={i} className="flex items-start space-x-2 my-1.5 pl-2 text-gray-700 dark:text-slate-200">
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 shrink-0 shadow-sm shadow-purple-200" />
          <span>{line.replace(/^[*|-]\s+/, '')}</span>
        </div>;
      }
      const parts = line.split(/(\*\*.*?\*\*)/);
      return <div key={i} className="mb-1.5 text-gray-700 dark:text-slate-200">
        {parts.map((part, pi) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pi} className="font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1 rounded-md">{part.slice(2, -2)}</strong>;
          }
          return <span key={pi}>{part}</span>;
        })}
      </div>;
    });
  };

  const renderCard = (card: Message['cardData']) => {
    if (!card) return null;

    if (card.type === 'PRODUCT') {
      return (
        <ProductRecommendCard 
          id={card.productId}
          name={card.title}
          price={card.price}
          imageUrl={card.imageUrl}
          products={card.products}
          onNavigate={(id) => onNavigate(View.PRODUCT_DETAIL, id)}
        />
      );
    }

    const props = {
      title: card.title,
      content: card.content,
      onAction: () => {
        if (card.actionLabel?.includes('查看醫院')) onNavigate(View.MAP);
        if (card.actionLabel?.includes('提醒')) onNavigate(View.MEDICATION);
      }
    };
    
    switch (card.type) {
      case 'WARNING': return <WarningCard {...props} />;
      case 'SUGGESTION': return <SuggestionCard {...props} />;
      case 'KNOWLEDGE': return <KnowledgeCard {...props} />;
      default: return <GenericCard {...props} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-slate-950">
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center space-x-4">
          <button 
            onClick={viewMode === 'HISTORY_LIST' ? () => setViewMode('CHAT') : onBack} 
            className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white shadow-sm active:scale-90 transition-transform"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">
              {viewMode === 'HISTORY_LIST' ? '對話歷史' : 'AI 萌寵顧問'}
            </h3>
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-green-600 font-black uppercase tracking-widest">在線實時諮詢</span>
            </div>
          </div>
        </div>
        
        {viewMode === 'CHAT' && (
          <button 
            onClick={handleOpenHistory}
            className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 active:scale-90 transition-all hover:bg-purple-500/20"
          >
             <History size={20} />
          </button>
        )}

        {viewMode === 'HISTORY_LIST' && isHistoryEditMode && (
          <button 
            onClick={() => setIsHistoryEditMode(false)}
            className="px-4 py-2 bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest animate-in zoom-in duration-300"
          >
            完成
          </button>
        )}
      </div>

      {viewMode === 'CHAT' ? (
        <>
          <div className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-hide">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.type === 'USER' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                <div className={`flex items-start max-w-[92%] space-x-3.5 ${msg.type === 'USER' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${msg.type === 'AI' ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-purple-500 border border-purple-50 dark:border-white/5'}`}>
                    {msg.type === 'AI' ? <Bot size={20} /> : <User size={20} />}
                  </div>
                  
                  <div className="flex-1 flex flex-col items-start space-y-3 w-full min-w-0">
                    {msg.isError ? (
                      (() => {
                        const detail = getErrorDetail(msg.errorCode);
                        return (
                          <div className="w-full">
                            <ChatErrorCard 
                              title={msg.errorCode === 400 ? "識別障礙" : "服務連線中斷"}
                              content={msg.text || detail.message}
                              onRetry={() => handleSend("請重新嘗試剛剛的操作")}
                            />
                          </div>
                        );
                      })()
                    ) : (
                      <>
                        {msg.type === 'AI' && msg.cardData && (
                          <div className="w-full">
                            {renderCard(msg.cardData)}
                          </div>
                        )}

                        {(msg.text || msg.isStreaming) && (
                          <div className={`px-5 py-4 rounded-[28px] text-sm font-bold shadow-sm border ${msg.type === 'USER' ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none self-end' : 'glass bg-white dark:bg-slate-900 dark:text-slate-100 border-white dark:border-white/5 rounded-tl-none self-start max-w-full'}`}>
                            <div className="leading-relaxed break-words">
                              {msg.text ? renderMessageText(msg.text) : (
                                <div className="flex items-center space-x-2 py-1.5">
                                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className={`flex items-center justify-between mt-1 px-1.5 w-full ${msg.type === 'USER' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        {msg.time}
                      </span>
                      
                      {msg.type === 'AI' && !msg.isError && (msg.text || msg.cardData) && !msg.isStreaming && (
                        <div className="flex items-center space-x-4 animate-in fade-in duration-700">
                          <button 
                            onClick={() => handleFeedback(msg.id, 'HELPFUL')}
                            className={`flex items-center space-x-1.5 transition-all active:scale-90 ${msg.feedback === 'HELPFUL' ? 'text-green-500 scale-110' : 'text-gray-300 hover:text-gray-500'}`}
                          >
                            <ThumbsUp size={14} fill={msg.feedback === 'HELPFUL' ? "currentColor" : "none"} />
                          </button>
                          <button 
                            onClick={() => handleFeedback(msg.id, 'NOT_HELPFUL')}
                            className={`flex items-center space-x-1.5 transition-all active:scale-90 ${msg.feedback === 'NOT_HELPFUL' ? 'text-rose-500 scale-110' : 'text-gray-300 hover:text-gray-500'}`}
                          >
                            <ThumbsDown size={14} fill={msg.feedback === 'NOT_HELPFUL' ? "currentColor" : "none"} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isThinking && (
              <div className="flex justify-start animate-in fade-in duration-300">
                 <div className="flex items-start space-x-3.5">
                    <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
                       <Bot size={20} />
                    </div>
                    <div className="glass bg-white dark:bg-slate-900 px-5 py-4 rounded-[28px] rounded-tl-none border border-white dark:border-white/5 flex items-center space-x-3">
                       <Loader2 className="animate-spin text-purple-500" size={16} />
                       <span className="text-xs font-black text-gray-400 tracking-tight">正在為你查閱寵物百科...</span>
                    </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 safe-bottom">
            <div className="flex space-x-2.5 overflow-x-auto pb-4 scrollbar-hide">
              <button 
                onClick={() => handleSend('推薦貓糧')}
                className="flex-shrink-0 px-4 py-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 text-[10px] font-black rounded-2xl border border-orange-100 dark:border-orange-500/20 active:scale-95 transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <ShoppingBag size={12} />
                <span>好物推薦</span>
              </button>
              <div className="w-[1px] bg-gray-100 mx-1" />
              {suggestions.map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSend(s)}
                  className="flex-shrink-0 px-5 py-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-[10px] font-black rounded-2xl border border-gray-100 dark:border-white/5 active:scale-95 transition-all shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-3.5">
               <button className="text-gray-400 hover:text-purple-500 transition-all active:scale-90">
                  <PlusCircle size={28} />
               </button>
               <div className="flex-1 relative">
                 <input 
                   type="text" 
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                   placeholder="問問主子的健康或飲食..."
                   className="w-full bg-[#F5F5F7] dark:bg-slate-800 border-none rounded-[24px] py-3.5 px-6 text-sm font-bold focus:ring-2 focus:ring-purple-500/30 transition-all dark:text-white placeholder-gray-400"
                 />
                 <button 
                   onClick={() => handleSend()}
                   disabled={!inputText.trim() || isThinking}
                   className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${inputText.trim() ? 'bg-purple-600 text-white shadow-lg active:scale-90' : 'text-gray-300'}`}
                 >
                    {isThinking ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                 </button>
               </div>
            </div>
            <p className="text-center text-[9px] text-gray-400 font-bold mt-4 uppercase tracking-[0.3em] opacity-40 italic">PawPal AI 顧問 · 專業賦能健康每一天</p>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide animate-in fade-in slide-in-from-right-4 relative">
           {isLoadingHistory ? (
             <div className="py-20 flex flex-col items-center justify-center opacity-40">
                <Loader2 className="animate-spin text-purple-500 mb-4" size={32} />
                <p className="text-xs font-black">正在翻閱諮詢檔案...</p>
             </div>
           ) : historySessions.length === 0 ? (
             <div className="py-20 text-center space-y-4 opacity-30">
                <MessageSquareText size={48} className="mx-auto" />
                <p className="font-black text-sm uppercase">目前尚無諮詢紀錄</p>
             </div>
           ) : (
             historySessions.map(session => (
               <div 
                 key={session.id}
                 onMouseDown={() => handleLongPressStart(session)}
                 onMouseUp={handleLongPressEnd}
                 onMouseLeave={handleLongPressEnd}
                 onTouchStart={() => handleLongPressStart(session)}
                 onTouchEnd={handleLongPressEnd}
                 onClick={() => handleSelectHistory(session.id)}
                 className={`glass bg-white dark:bg-slate-900 p-5 rounded-[32px] border shadow-sm space-y-3 transition-all cursor-pointer group relative overflow-hidden ${isHistoryEditMode ? 'scale-95 animate-wiggle' : 'active:scale-[0.98] border-white/60 dark:border-white/5'}`}
               >
                  <div className="flex justify-between items-start">
                     <div className="flex-1 min-w-0 pr-4">
                        <h4 className="text-sm font-black text-gray-800 dark:text-white line-clamp-1 group-hover:text-purple-600 transition-colors">
                          {session.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                           <Clock size={10} />
                           <span>{session.time}</span>
                        </div>
                     </div>
                     {!isHistoryEditMode ? (
                       <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                          <ChevronRight size={16} />
                       </div>
                     ) : (
                       <button 
                         onClick={(e) => { e.stopPropagation(); setSessionToDelete(session); }}
                         className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg animate-in zoom-in duration-200"
                       >
                         <X size={16} />
                       </button>
                     )}
                  </div>
               </div>
             ))
           )}

           {sessionToDelete && (
             <div className="fixed inset-0 z-[160] flex items-center justify-center px-6">
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in" onClick={() => setSessionToDelete(null)} />
                <div className="relative glass bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-white/60 dark:border-white/5 shadow-2xl max-w-sm w-full space-y-6 animate-in zoom-in-95 duration-300">
                   <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center">
                         <Trash2 size={32} />
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-gray-900 dark:text-white">刪除對話紀錄？</h4>
                         <p className="text-xs text-gray-400 font-bold leading-relaxed mt-1">此操作無法復原，對話中的所有建議將會永久移除喔。</p>
                      </div>
                   </div>
                   <div className="flex flex-col space-y-3 pt-2">
                      <button 
                        onClick={handleDeleteSession}
                        className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-rose-200 active:scale-95 transition-all"
                      >
                        確認刪除
                      </button>
                      <button 
                        onClick={() => setSessionToDelete(null)}
                        className="w-full py-4 bg-gray-50 dark:bg-slate-800 text-gray-400 rounded-2xl font-black text-sm active:scale-95 transition-all"
                      >
                        取消
                      </button>
                   </div>
                </div>
             </div>
           )}

           {isHistoryEditMode && (
             <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4">
               <div className="bg-slate-900 text-white px-6 py-3 rounded-full flex items-center space-x-3 shadow-2xl border border-white/10">
                  <AlertTriangle size={14} className="text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">長按已進入管理模式</span>
               </div>
             </div>
           )}
        </div>
      )}

      <style>{`
        @keyframes wiggle {
          0% { transform: rotate(-0.8deg); }
          50% { transform: rotate(0.8deg); }
          100% { transform: rotate(-0.8deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AIConsultantView;
