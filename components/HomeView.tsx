
import React, { useState, useEffect } from 'react';
// Added Stars to lucide-react imports
import { Scan, Search, FileText, Heart, MapPin, ShieldCheck, ChevronRight, Activity, Sparkles, Calendar as CalendarIcon, Pill, Wallet, User, Languages, Crown, Image as ImageIcon, LayoutGrid, MessageSquareText, Stars } from 'lucide-react';
import { View, DiaryEntry, Medication } from '../types';
import * as backend from '../backend';

interface HomeViewProps {
  onNavigate: (view: View, pet?: backend.PetProfile) => void;
  entries: DiaryEntry[];
  medications: Medication[];
  pets: backend.PetProfile[];
  user: backend.UserInfo | null;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate, entries, medications, pets, user }) => {
  const [medIndex, setMedIndex] = useState(0);
  const [albumPreview, setAlbumPreview] = useState<backend.AlbumPhoto | null>(null);
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today.toISOString().split('T')[0];
  
  // 優先選擇非星空的寵物作為展示
  const activePetList = pets.filter(p => !p.isMemorial);
  // Fix: Provided a fully typed fallback object as backend.PetProfile to avoid union type errors with isMemorial property.
  const activePet = activePetList.length > 0 
    ? activePetList[0] 
    : (pets[0] || { 
        id: 'default', 
        name: '寶貝', 
        breed: '萌寵', 
        avatar: 'https://picsum.photos/seed/cat1/200', 
        isMemorial: false,
        gender: '',
        birthday: '',
        hobbies: ''
      } as backend.PetProfile);

  useEffect(() => {
    backend.fetchAlbumPhotos().then(photos => {
      if (photos.length > 0) setAlbumPreview(photos[0]);
    });
  }, []);

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasEntry = entries.some(e => e.date === dateStr);
    const hasMed = medications.some(m => m.date === dateStr);
    return { day, dateStr, hasEntry, hasMed };
  });

  // 過濾今日任務：排除星空寵物的任務
  const todayMeds = medications.filter(m => {
    const isTodayUnfinished = m.date === todayStr && !m.isTaken;
    const petOfMed = pets.find(p => p.name === m.petName);
    return isTodayUnfinished && petOfMed && !petOfMed.isMemorial;
  });

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const warmPhrases = [
    "今日無需用藥，帶毛孩去踏青吧 🐾",
    "寶貝今天表現優異，值得獎勵肉條 🍖",
    "藥箱空空心情鬆鬆，又是元氣的一天 ✨"
  ];

  const totalRotationItems = todayMeds.length > 0 ? todayMeds.length : warmPhrases.length;

  useEffect(() => {
    if (totalRotationItems <= 1) {
      setMedIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setMedIndex(prev => (prev + 1) % totalRotationItems);
    }, 3000);
    return () => clearInterval(timer);
  }, [totalRotationItems]);

  return (
    <div className="p-6 space-y-8 pb-10">
      {/* Pet Profile Card */}
      <div 
        onClick={() => onNavigate(View.PET_PROFILE, activePet as backend.PetProfile)}
        className={`bg-gradient-to-br rounded-[40px] p-6 text-white shadow-2xl relative overflow-hidden clickable
          ${activePet.isMemorial ? 'from-slate-800 to-indigo-950 border border-amber-500/20' : 'from-orange-400 via-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-800 shadow-orange-200'}
        `}
      >
        <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-10">
          <Activity size={140} />
        </div>
        
        {activePet.isMemorial && (
           <div className="absolute top-4 right-6 bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center space-x-1 border border-amber-500/30">
             <Stars size={12} fill="currentColor" className="text-amber-400" />
             <span className="text-[10px] font-black uppercase tracking-tight text-amber-200">Eternal Star</span>
           </div>
        )}

        {!activePet.isMemorial && user?.isVIP && (
           <div className="absolute top-4 right-6 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center space-x-1 border border-white/20 animate-pulse">
             <Crown size={12} fill="currentColor" className="text-amber-200" />
             <span className="text-[10px] font-black uppercase tracking-tight">{user.vipLevel} OWNER</span>
           </div>
        )}

        <div className="flex items-center space-x-5">
          <div className="relative">
            <img src={activePet.avatar} alt="Pet Avatar" className={`w-20 h-20 rounded-3xl border-4 object-cover shadow-xl ${activePet.isMemorial ? 'border-amber-500/30 grayscale' : 'border-white/30'}`} />
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 ${activePet.isMemorial ? 'bg-amber-500 border-slate-900' : 'bg-green-500 border-white'}`}></div>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">{activePet.name}{activePet.isMemorial ? '·星空' : ''}</h2>
            <div className="flex items-center mt-2 space-x-3">
               <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-lg">{activePet.breed}</span>
               <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-lg">{activePet.isMemorial ? '永遠的守護' : '健康 98'}</span>
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-between items-end">
          <div className="space-y-1.5">
            <p className="text-xs text-white/70 font-bold uppercase tracking-widest">{activePet.isMemorial ? '來自星空的守護' : `今日待辦: ${todayMeds.length} 項`}</p>
            <p className="text-lg font-black text-white flex items-center">
              {activePet.isMemorial ? '它在那邊也很快樂喔 ✨' : '一切正常，繼續保持喔！'} <Sparkles size={20} className="ml-2 text-yellow-200" />
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-xl text-white p-3 rounded-2xl border border-white/20">
            <ChevronRight size={24} />
          </div>
        </div>
      </div>

      {/* Quick Modules */}
      <div className="grid grid-cols-2 gap-4">
         <button onClick={() => onNavigate(View.MEDICATION)} className="glass p-5 rounded-[32px] flex items-center space-x-4 border border-white/60 shadow-sm clickable overflow-hidden">
            <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shrink-0 z-10"><Pill size={20} /></div>
            <div className="text-left flex-1 flex flex-col min-w-0 relative">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase leading-none mb-1 shrink-0 z-20 bg-transparent">用藥提醒</p>
              
              <div className="h-6 overflow-hidden relative z-10">
                <div 
                  className="transition-transform duration-700 ease-in-out absolute top-0 left-0 right-0 w-full"
                  style={{ transform: `translateY(-${medIndex * 24}px)` }}
                >
                  {todayMeds.length > 0 ? (
                    todayMeds.map((med) => (
                      <div key={med.id} className="h-6 flex items-center space-x-1 w-full min-w-0">
                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-md truncate shrink-0 max-w-[40px]">{med.petName}</span>
                        <p className="text-xs font-black text-gray-800 dark:text-white truncate flex-1">{med.name}</p>
                      </div>
                    ))
                  ) : (
                    warmPhrases.map((phrase, i) => (
                      <div key={i} className="h-6 flex items-center w-full min-w-0">
                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 leading-tight truncate w-full">{phrase}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
         </button>
         <button onClick={() => onNavigate(View.WALLET)} className="glass p-5 rounded-[32px] flex items-center space-x-4 border border-white/60 shadow-sm clickable">
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg"><Wallet size={20} /></div>
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase">寵物錢包</p>
              <p className="text-sm font-black text-gray-800 dark:text-white">收支統計</p>
            </div>
         </button>
      </div>

      {/* Main AI Grid (2x2 Matrix) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Row 1: Health Scan & AI Consultant */}
        <button onClick={() => onNavigate(View.HEALTH_SCAN)} className="glass p-6 text-left flex flex-col justify-between min-h-[160px] rounded-[36px] shadow-glass border-white/60 clickable bg-blue-50/10">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600"><Scan size={28} /></div>
          <div>
            <h3 className="font-black text-gray-800 dark:text-slate-100 text-xl leading-tight">健康檢測</h3>
            <p className="text-[10px] font-black text-blue-600/70 mt-1 uppercase tracking-widest">糞便 & 皮膚掃描</p>
          </div>
        </button>

        <button onClick={() => onNavigate(View.AI_CONSULTANT)} className="glass p-6 text-left flex flex-col justify-between min-h-[160px] rounded-[36px] shadow-glass border-white/60 clickable bg-purple-50/10">
          <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600"><MessageSquareText size={28} /></div>
          <div>
            <h3 className="font-black text-gray-800 dark:text-slate-100 text-xl leading-tight">AI 萌寵顧問</h3>
            <p className="text-[10px] font-black text-purple-600/70 mt-1 uppercase tracking-widest">24/7 在線諮詢</p>
          </div>
        </button>

        {/* Row 2: Ingredient Scanner & Report Translator */}
        <button onClick={() => onNavigate(View.SCANNER)} className="glass p-6 text-left flex flex-col justify-between min-h-[160px] rounded-[36px] shadow-glass border-white/60 clickable bg-rose-50/10">
          <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600"><Search size={28} /></div>
          <div>
            <h3 className="font-black text-gray-800 dark:text-slate-100 text-xl leading-tight">成分分析</h3>
            <p className="text-[10px] font-black text-rose-600/70 mt-1 uppercase tracking-widest">避開過敏風險</p>
          </div>
        </button>
        
        <button onClick={() => onNavigate(View.TRANSLATOR)} className="glass p-6 text-left flex flex-col justify-between min-h-[160px] rounded-[36px] shadow-glass border-white/60 clickable bg-emerald-50/10">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600"><Languages size={28} /></div>
          <div>
            <h3 className="font-black text-gray-800 dark:text-slate-100 text-xl leading-tight">報告翻譯</h3>
            <p className="text-[10px] font-black text-emerald-600/70 mt-1 uppercase tracking-widest">大白話解讀</p>
          </div>
        </button>
      </div>

      {/* Time Highlight Card */}
      <div 
        onClick={() => onNavigate(View.ALBUM)}
        className="relative group cursor-pointer overflow-hidden rounded-[40px] aspect-[16/7] shadow-xl border border-white/40 dark:border-white/5 transition-all duration-500 active:scale-95"
      >
        <div className="absolute inset-0 bg-slate-900">
           {albumPreview && (
             <img 
               src={albumPreview.url} 
               className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-1000" 
               alt="Highlight" 
             />
           )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"></div>
        <div className="absolute inset-y-0 left-6 flex flex-col justify-center max-w-[60%] space-y-1">
           <div className="flex items-center space-x-2 mb-1">
             <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
             <span className="text-[9px] font-black text-orange-400 uppercase tracking-[0.2em]">Memories capsule</span>
           </div>
           <h3 className="text-white font-black text-lg leading-tight tracking-tight">回味 {activePet.name} 的精彩瞬間</h3>
           <p className="text-white/60 text-[10px] font-bold">查看 3 天前的午後時光...</p>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 group-hover:bg-orange-500 transition-colors">
          <LayoutGrid size={20} />
        </div>
      </div>

      {/* Calendar Card */}
      <div 
        onClick={() => onNavigate(View.CALENDAR)}
        className="glass rounded-[40px] p-7 border shadow-glass space-y-6 clickable"
      >
        <div className="flex justify-between items-center">
          <h3 className="font-black text-gray-800 dark:text-slate-50 flex items-center text-lg">
            <CalendarIcon size={20} className="mr-3 text-orange-500" />
            成長日曆
          </h3>
          <div className="text-xs font-black text-orange-600 bg-orange-50 px-4 py-2 rounded-full">查看全部</div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarDays.slice(Math.max(0, today.getDate() - 4), today.getDate() + 3).map(item => {
            const isToday = item.day === today.getDate();
            const dayOfWeek = weekDays[new Date(item.dateStr).getDay()];
            
            return (
              <div key={item.day} className="flex flex-col items-center py-2 relative">
                <span className={`text-[10px] font-black mb-1.5 transition-colors ${isToday ? 'text-orange-500' : 'text-gray-400'}`}>
                  {dayOfWeek}
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${isToday ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-200' : 'bg-white/40 border-gray-100 dark:bg-slate-800 dark:border-white/5'}`}>
                  <span className="text-sm font-bold">{item.day}</span>
                </div>
                <div className="flex space-x-0.5 mt-1.5 min-h-[4px]">
                  {item.hasEntry && <div className="w-1 h-1 bg-orange-500 rounded-full"></div>}
                  {item.hasMed && <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Diary Teaser */}
      <div onClick={() => onNavigate(View.DIARY)} className="glass rounded-[40px] p-7 border shadow-glass clickable">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-black text-gray-800 dark:text-slate-100 flex items-center text-lg">
            <Heart size={20} className="mr-3 text-rose-500" fill="currentColor" />
            AI 萌寵日記
          </h3>
          <span className="text-[10px] bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full font-black tracking-widest uppercase">台式療癒</span>
        </div>
        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl p-5 rounded-3xl border border-white/20">
          <p className="text-base text-gray-700 dark:text-slate-200 leading-relaxed font-medium italic">
            「{entries[0]?.content || "今天陪麻薯玩了一整天，它真的好可愛嗚嗚... ✨"}」
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
