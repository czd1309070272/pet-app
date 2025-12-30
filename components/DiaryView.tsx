
import React, { useState } from 'react';
import { Sparkles, Heart, MessageSquare, Send, Calendar, Camera, Image as ImageIcon, X, Trash2, Wand2, RefreshCw, AlertTriangle } from 'lucide-react';
import { View, DiaryEntry } from '../types';
import * as backend from '../backend';
import { ViewHeader } from './shared/CommonUI';

interface DiaryViewProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
  entries: DiaryEntry[];
  setEntries: React.Dispatch<React.SetStateAction<DiaryEntry[]>>;
  filterDate: string | null;
}

const DiaryView: React.FC<DiaryViewProps> = ({ onBack, onNavigate, entries, setEntries, filterDate }) => {
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBeautifying, setIsBeautifying] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const filteredEntries = filterDate 
    ? entries.filter(e => e.date === filterDate)
    : entries;

  const handleBeautify = async () => {
    if (!userInput) return;
    setIsBeautifying(true);
    try {
      const beautified = await backend.beautifyDiary(userInput);
      setUserInput(beautified);
    } catch (error) {
      console.error("AI Beautify Error:", error);
    } finally {
      setIsBeautifying(false);
    }
  };

  const handleGenerate = () => {
    if (!userInput && !selectedImage) return;
    setIsGenerating(true);
    
    setTimeout(() => {
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        content: userInput,
        style: '台式療癒風',
        imageUrl: selectedImage || undefined
      };
      setEntries([newEntry, ...entries]);
      setUserInput('');
      setSelectedImage(null);
      setIsGenerating(false);
    }, 1000);
  };

  const performDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      setEntries(prev => prev.filter(e => e.id !== id));
      setDeletingId(null);
      setConfirmDeleteId(null);
    }, 400);
  };

  const handleFileSelect = () => {
    const mockImages = [
      'https://picsum.photos/seed/pet1/600/400',
      'https://picsum.photos/seed/pet2/600/400'
    ];
    setSelectedImage(mockImages[Math.floor(Math.random() * mockImages.length)]);
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide pb-56 transition-all duration-500">
        <ViewHeader 
          title="情緒價值日記" 
          onBack={onBack} 
          rightElement={
            <button onClick={() => onNavigate(View.CALENDAR)} className="glass p-2.5 rounded-xl text-orange-500 clickable">
              <Calendar size={22}/>
            </button>
          } 
        />

        {filterDate && (
          <div className="bg-orange-50/50 dark:bg-orange-500/10 border border-orange-100 dark:border-white/5 px-4 py-2 rounded-2xl flex justify-between items-center animate-in fade-in slide-in-from-top-2">
             <span className="text-xs font-bold text-orange-600 dark:text-orange-300">正在查看: {filterDate}</span>
             <button onClick={() => onNavigate(View.CALENDAR)} className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">更換日期</button>
          </div>
        )}

        {filteredEntries.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-slate-600 font-bold space-y-2">
            <Heart size={48} className="mx-auto opacity-20" />
            <p>這天還沒有記錄喔，來寫一篇吧！</p>
          </div>
        ) : (
          filteredEntries.map(entry => (
            <div 
              key={entry.id} 
              className={`glass rounded-[40px] p-0 overflow-hidden border border-white/40 dark:border-white/5 shadow-xl shadow-orange-100/10 dark:shadow-none relative group mb-6 transition-all duration-300 ${deletingId === entry.id ? 'item-exit' : 'animate-in fade-in slide-in-from-bottom-4'}`}
            >
              {entry.imageUrl && <img src={entry.imageUrl} className="w-full aspect-video object-cover" alt="Diary" />}
              <div className="p-7 space-y-5">
                <div className="flex justify-between items-center text-xs text-gray-400 font-black tracking-widest uppercase">
                  <span>{entry.date}</span>
                  <div className="flex items-center space-x-3">
                    <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full">{entry.style}</span>
                    <div className="relative">
                      {confirmDeleteId === entry.id ? (
                        <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-right-2">
                          <button onClick={() => performDelete(entry.id)} className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center space-x-1 shadow-md active:scale-90">確定</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="bg-gray-100 dark:bg-slate-800 text-gray-500 px-3 py-1.5 rounded-lg text-[10px] font-black active:scale-90">取消</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(entry.id)} className="p-1.5 text-gray-300 hover:text-rose-500 transition-colors clickable active:scale-75"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-gray-800 dark:text-gray-100 leading-relaxed font-bold text-lg">{entry.content}</p>
                <div className="flex items-center space-x-6 pt-3 border-t border-white/20 dark:border-white/5">
                  <button className="flex items-center space-x-2 text-rose-500 font-bold active:scale-110"><Heart size={20} fill="currentColor" opacity={0.3} /> <span className="text-sm">收藏</span></button>
                  <button className="flex items-center space-x-2 text-blue-500 font-bold"><MessageSquare size={20} /> <span className="text-sm">分享</span></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-28 left-6 right-6 max-w-[calc(448px-3rem)] mx-auto space-y-3 z-40 transition-all duration-500 ease-in-out">
        {selectedImage && (
          <div className="relative inline-block animate-in zoom-in duration-300 transition-transform">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-orange-500 shadow-xl">
              <img src={selectedImage} className="w-full h-full object-cover" alt="Preview" />
            </div>
            <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md"><X size={14} /></button>
          </div>
        )}

        <div className={`glass rounded-[40px] p-3 safe-bottom border border-white/50 dark:border-white/10 shadow-2xl transition-all duration-500 ease-in-out ${isFocused ? 'bg-white/90 dark:bg-slate-900/90' : ''}`}>
          <div className="flex items-end space-x-2">
            <div className="flex flex-col space-y-2 pb-1 pl-1">
              <button 
                onClick={handleBeautify} 
                disabled={!userInput || isBeautifying}
                className="w-10 h-10 bg-indigo-500 dark:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-30 clickable"
              >
                {isBeautifying ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={18} />}
              </button>
              <button onClick={handleFileSelect} className="w-10 h-10 glass-dark text-orange-600 rounded-full flex items-center justify-center clickable"><Camera size={18} /></button>
              <button onClick={handleFileSelect} className="w-10 h-10 glass-dark text-blue-600 rounded-full flex items-center justify-center clickable"><ImageIcon size={18} /></button>
            </div>

            <div className="flex-1 relative overflow-hidden transition-all duration-500">
              <textarea 
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="分享今天的萌寵時光..."
                className={`w-full bg-white/30 dark:bg-slate-800/50 border border-white/40 dark:border-white/5 rounded-[28px] px-5 py-4 pr-12 text-base font-medium focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none transition-all duration-500 ease-in-out dark:text-white ${isFocused ? 'h-48' : 'h-16'}`}
                style={{ scrollbarWidth: 'none' }}
              />
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || (!userInput && !selectedImage)}
                className="absolute bottom-3 right-3 w-10 h-10 bg-orange-500 text-white rounded-full shadow-xl flex items-center justify-center disabled:opacity-30 clickable"
              >
                {isGenerating ? <Sparkles className="animate-spin" size={16} /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryView;
