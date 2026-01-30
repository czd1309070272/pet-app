
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Stars, Moon, MessageSquare, Send, Sparkles, Coffee, Utensils, Zap, Heart } from 'lucide-react';
import * as backend from '../backend';

interface StarryMemorialViewProps {
  onBack: () => void;
  pet: backend.PetProfile | null;
}

// 定义宠物状态类型
type PetState = 'IDLE' | 'WALKING' | 'EATING' | 'DRINKING' | 'PLAYING';

const StarryMemorialView: React.FC<StarryMemorialViewProps> = ({ onBack, pet }) => {
  const [inputText, setInputText] = useState('');
  const [petState, setPetState] = useState<PetState>('IDLE');
  const [isTyping, setIsTyping] = useState(false);

  if (!pet) return null;

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-slate-950">
      {/* 1. 沉浸式星空背景层 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-950 to-purple-950"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        
        {/* 动态星光 */}
        <div className="stars-container absolute inset-0">
            {Array.from({ length: 40 }).map((_, i) => (
                <div 
                    key={i} 
                    className="absolute bg-white rounded-full animate-twinkle" 
                    style={{
                        width: Math.random() * 2 + 'px',
                        height: Math.random() * 2 + 'px',
                        top: Math.random() * 100 + '%',
                        left: Math.random() * 100 + '%',
                        animationDelay: Math.random() * 5 + 's',
                        opacity: Math.random() * 0.7
                    }}
                />
            ))}
        </div>
      </div>

      {/* 2. 顶部导航与状态指示器 */}
      <div className="relative z-30 flex items-center justify-between px-6 py-8">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center glass rounded-2xl text-white/50 border-white/10 active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center">
            <h2 className="text-sm font-black text-amber-100 tracking-[0.3em] uppercase flex items-center space-x-2">
                <Stars size={14} className="text-amber-500 animate-pulse" />
                <span>{pet.name} 的数字空间</span>
            </h2>
            <div className="flex space-x-3 mt-2">
                {/* 灵魂状态光点 */}
                <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></div>
                    <span className="text-[7px] font-black text-white/30 uppercase tracking-tighter">Energy</span>
                </div>
                <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                    <span className="text-[7px] font-black text-white/30 uppercase tracking-tighter">Mood</span>
                </div>
                <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
                    <span className="text-[7px] font-black text-white/30 uppercase tracking-tighter">Memory</span>
                </div>
            </div>
        </div>
        
        <div className="w-10 h-10 flex items-center justify-center glass rounded-2xl text-amber-500/50">
            <Zap size={18} />
        </div>
      </div>

      {/* 3. 核心交互舞台 (Stage) */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-end pb-32">
         
         {/* 悬浮互动道具 - 左侧 */}
         <div className="absolute left-8 top-1/4 flex flex-col space-y-6">
            <button className="w-12 h-12 glass rounded-full flex items-center justify-center text-amber-200 border-white/10 floating-btn group">
                <Utensils size={20} className="group-hover:scale-110 transition-transform" />
                <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[8px] font-black text-amber-500/60 uppercase tracking-widest">星尘粮</div>
            </button>
            <button className="w-12 h-12 glass rounded-full flex items-center justify-center text-blue-200 border-white/10 floating-btn group" style={{ animationDelay: '1s' }}>
                <Coffee size={20} className="group-hover:scale-110 transition-transform" />
                <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[8px] font-black text-blue-500/60 uppercase tracking-widest">月亮水</div>
            </button>
         </div>

         {/* 悬浮互动道具 - 右侧 */}
         <div className="absolute right-8 top-1/3 flex flex-col space-y-6">
            <button className="w-12 h-12 glass rounded-full flex items-center justify-center text-rose-200 border-white/10 floating-btn group" style={{ animationDelay: '0.5s' }}>
                <Heart size={20} className="group-hover:scale-110 transition-transform" />
                <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[8px] font-black text-rose-500/60 uppercase tracking-widest">抚摸</div>
            </button>
         </div>

         {/* 透视星軌平面 (Perspective Path) */}
         <div className="absolute bottom-0 w-full h-64 overflow-hidden pointer-events-none">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-full bg-gradient-to-t from-amber-500/10 via-transparent to-transparent opacity-40" style={{ transform: 'translateX(-50%) perspective(500px) rotateX(60deg)' }}>
                {/* 这里的网格线增加空间感 */}
                <div className="w-full h-full border-t border-white/5 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            </div>
         </div>

         {/* 宠物 Sprite 动画容器 */}
         <div 
            className={`relative transition-all duration-1000 ease-in-out ${petState === 'WALKING' ? 'translate-y-4 scale-110' : ''}`}
            style={{ marginBottom: '20px' }}
         >
             {/* 呼吸底座光圈 */}
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-10 bg-amber-500/10 blur-2xl rounded-full animate-pulse"></div>
             
             {/* 宠物形象 - 这里未来渲染 Sprite Sheet */}
             <div className="relative w-48 h-48 flex items-center justify-center group">
                 {/* 模拟 AI 生成的卡通形象发光效果 */}
                 <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <img 
                    src={pet.avatar} 
                    className={`w-32 h-32 rounded-[40px] object-cover border-4 border-amber-500/20 shadow-2xl transition-all duration-700
                        ${petState === 'IDLE' ? 'animate-float' : ''} 
                        ${petState === 'EATING' ? 'scale-95' : ''}
                        brightness-110
                    `} 
                    alt="Digital Soul"
                    style={{ filter: 'drop-shadow(0 0 15px rgba(251, 191, 36, 0.3))' }}
                 />
                 
                 {/* 状态气泡消息 */}
                 <div className="absolute -top-12 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-2xl border-white/20 whitespace-nowrap animate-in fade-in zoom-in duration-500">
                    <p className="text-[10px] font-black text-amber-100 tracking-tight flex items-center space-x-1">
                        <Sparkles size={10} className="text-amber-500" />
                        <span>我在听哦... ✨</span>
                    </p>
                 </div>
             </div>
         </div>
      </div>

      {/* 4. 灵魂对话框 (The Spirit Box) */}
      <div className="relative z-30 px-6 pb-10 safe-bottom">
         <div className={`glass bg-slate-900/40 backdrop-blur-3xl border-amber-500/10 rounded-[40px] p-2 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500 ${isTyping ? 'scale-[1.02] border-amber-500/30 ring-1 ring-amber-500/10' : ''}`}>
            <div className="flex items-center space-x-2">
                <div className="flex-1 relative pl-4">
                    <input 
                        type="text"
                        value={inputText}
                        onFocus={() => setIsTyping(true)}
                        onBlur={() => setIsTyping(false)}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="轻声说些什么..."
                        className="w-full bg-transparent border-none py-4 text-sm font-bold text-amber-50 placeholder-white/20 focus:outline-none"
                    />
                    {/* 输入框下方的极光线条 */}
                    <div className={`absolute bottom-2 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent transition-all duration-700 ${isTyping ? 'opacity-100' : 'opacity-0'}`}></div>
                </div>
                
                <button 
                    className={`w-12 h-12 rounded-[24px] flex items-center justify-center transition-all ${inputText.trim() ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-90' : 'text-white/20'}`}
                >
                    <Send size={20} fill={inputText.trim() ? "currentColor" : "none"} />
                </button>
            </div>
         </div>
         <p className="text-center mt-4 text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">Linking to Eternal Frequency</p>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        .animate-twinkle {
          animation: twinkle 4s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .stars-container {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default StarryMemorialView;
