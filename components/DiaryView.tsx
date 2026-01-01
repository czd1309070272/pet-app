
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Heart, MessageSquare, Send, Calendar, Camera, Image as ImageIcon, X, Trash2, Wand2, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { View, DiaryEntry, AlbumPhoto } from '../types';
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
  
  // 图片相关状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false); // 控制“选择方式”菜单
  const [showAlbumModal, setShowAlbumModal] = useState(false);   // 控制“萌宠时光馆”选择弹窗
  
  const [albumPhotos, setAlbumPhotos] = useState<AlbumPhoto[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredEntries = filterDate 
    ? entries.filter(e => e.date === filterDate)
    : entries;

  // Auto scroll to bottom when new entry added
  useEffect(() => {
    if (scrollRef.current && !filterDate) {
       scrollRef.current.scrollTop = 0;
    }
  }, [entries.length, filterDate]);

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

  const handleGenerate = async () => {
    if (!userInput && !selectedImagePreview) return;
    setIsGenerating(true);
    
    try {
      // 如果 selectedFile 存在，说明是新上传/拍摄的
      // 如果 selectedFile 不存在但 selectedImagePreview 存在，说明是从相册选的 URL
      const newEntry = await backend.createDiaryEntry(
        userInput, 
        selectedFile, 
        selectedFile ? null : selectedImagePreview
      );

      setEntries([newEntry, ...entries]);
      setUserInput('');
      setSelectedFile(null);
      setSelectedImagePreview(null);
    } catch (error) {
      console.error("Create entry failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const performDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      setEntries(prev => prev.filter(e => e.id !== id));
      setDeletingId(null);
      setConfirmDeleteId(null);
    }, 400);
  };

  // 处理文件上传 (拍照或本地文件)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // 创建本地预览 URL
      const previewUrl = URL.createObjectURL(file);
      setSelectedImagePreview(previewUrl);
      setShowImagePicker(false);
    }
  };

  // 打开萌宠时光馆选择器
  const openAlbumPicker = async () => {
    setShowImagePicker(false);
    const photos = await backend.fetchAlbumPhotos();
    setAlbumPhotos(photos);
    setShowAlbumModal(true);
  };

  // 从相册选中图片
  const selectFromAlbum = (photoUrl: string) => {
    setSelectedImagePreview(photoUrl);
    setSelectedFile(null); // 清除文件对象，因为这是已存在的 URL
    setShowAlbumModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Scrollable Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 pb-40 scrollbar-hide"
      >
        <ViewHeader 
          title="情緒價值日記" 
          onBack={onBack} 
          rightElement={
            <button onClick={() => onNavigate(View.CALENDAR)} className="glass p-2.5 rounded-xl text-orange-500 active:scale-90 transition-transform">
              <Calendar size={22}/>
            </button>
          } 
        />

        {filterDate && (
          <div className="bg-orange-50/50 dark:bg-orange-500/10 border border-orange-100 dark:border-white/5 px-4 py-3 rounded-2xl flex justify-between items-center mb-6 animate-in fade-in slide-in-from-top-2">
             <span className="text-xs font-bold text-orange-600 dark:text-orange-300">正在回味: {filterDate}</span>
             <button onClick={() => onNavigate(View.CALENDAR)} className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase hover:text-orange-500 transition-colors">更換日期</button>
          </div>
        )}

        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300 dark:text-slate-700 space-y-4">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
               <Heart size={32} className="opacity-20" fill="currentColor" />
            </div>
            <p className="text-sm font-black">這天還沒有記錄喔</p>
            <p className="text-xs font-medium opacity-50">試著寫下今天發生的趣事吧...</p>
          </div>
        ) : (
          filteredEntries.map(entry => (
            <div 
              key={entry.id} 
              className={`glass bg-white dark:bg-slate-900 rounded-[32px] p-0 overflow-hidden border border-white/60 dark:border-white/5 shadow-sm mb-6 transition-all duration-500 ${deletingId === entry.id ? 'opacity-0 scale-95 max-h-0 mb-0' : 'animate-in fade-in slide-in-from-bottom-8'}`}
            >
              {entry.imageUrl && (
                <div className="relative h-48 w-full">
                   <img src={entry.imageUrl} className="w-full h-full object-cover" alt="Diary" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              )}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                    {entry.date}
                  </span>
                  <div className="flex items-center space-x-3">
                    <span className="text-[9px] font-black text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-100 dark:border-orange-500/20">
                      {entry.style}
                    </span>
                    <div className="relative">
                      {confirmDeleteId === entry.id ? (
                        <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-right-2">
                          <button onClick={() => performDelete(entry.id)} className="bg-rose-500 text-white px-2 py-1 rounded text-[10px] font-black shadow-md active:scale-90">確認</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="bg-gray-100 dark:bg-slate-800 text-gray-500 px-2 py-1 rounded text-[10px] font-black active:scale-90">取消</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(entry.id)} className="p-1.5 text-gray-300 hover:text-rose-500 transition-colors active:scale-90">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-200 leading-relaxed font-bold text-[15px] whitespace-pre-wrap">
                  {entry.content}
                </p>
                
                <div className="flex items-center space-x-4 pt-2 border-t border-gray-50 dark:border-white/5">
                  <button className="flex items-center space-x-1.5 text-gray-400 hover:text-rose-500 transition-colors active:scale-110 group">
                    <Heart size={16} className="group-hover:fill-rose-500 transition-colors" />
                    <span className="text-[10px] font-bold">收藏</span>
                  </button>
                  <button className="flex items-center space-x-1.5 text-gray-400 hover:text-blue-500 transition-colors active:scale-110">
                    <MessageSquare size={16} />
                    <span className="text-[10px] font-bold">分享</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sticky Bottom Input Area */}
      <div className="absolute bottom-0 left-0 right-0 z-40">
        {/* Gradient Fade for scroll content */}
        <div className="h-12 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent pointer-events-none"></div>
        
        <div className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-white/60 dark:border-white/10 px-5 pt-4 pb-8 safe-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.03)] rounded-t-[32px] transition-all duration-300">
          
          {/* Image Source Picker Popup */}
          {showImagePicker && (
            <div className="absolute bottom-28 left-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 p-2 z-50 animate-in slide-in-from-bottom-2 zoom-in-95 origin-bottom-left">
               <button 
                 onClick={openAlbumPicker}
                 className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-left"
               >
                 <div className="p-2 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded-lg"><ImageIcon size={18} /></div>
                 <div>
                   <p className="text-xs font-black text-gray-800 dark:text-white">從萌寵時光館選擇</p>
                   <p className="text-[9px] text-gray-400">使用已歸檔的精彩瞬間</p>
                 </div>
               </button>
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-left"
               >
                 <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-lg"><Camera size={18} /></div>
                 <div>
                   <p className="text-xs font-black text-gray-800 dark:text-white">拍攝或上傳</p>
                   <p className="text-[9px] text-gray-400">使用新照片記錄當下</p>
                 </div>
               </button>
            </div>
          )}

          {/* Image Preview */}
          {selectedImagePreview && (
            <div className="mb-3 relative inline-block animate-in zoom-in-95 duration-300 origin-bottom-left">
              <img src={selectedImagePreview} className="h-20 w-20 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-md" alt="Selected" />
              <button 
                onClick={() => { setSelectedImagePreview(null); setSelectedFile(null); }}
                className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 shadow-md hover:bg-rose-500 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex items-end space-x-3">
             <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-[24px] p-1 flex items-end border border-transparent focus-within:border-orange-200 dark:focus-within:border-orange-500/30 transition-colors">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="記錄下此刻的萌寵時光..."
                  rows={1}
                  className="w-full bg-transparent border-none px-4 py-3.5 text-sm font-bold placeholder:text-gray-400 focus:ring-0 focus:outline-none resize-none max-h-32 min-h-[48px] dark:text-white"
                  style={{ height: 'auto', minHeight: '48px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                />
                <div className="flex pb-1.5 pr-1.5 space-x-1">
                   <button 
                     onClick={() => setShowImagePicker(!showImagePicker)}
                     className={`p-2 rounded-xl transition-all active:scale-90 ${showImagePicker ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-orange-500 hover:bg-white dark:hover:bg-slate-700'}`}
                     title="添加圖片"
                   >
                     <ImageIcon size={20} />
                   </button>
                   <button 
                     onClick={handleBeautify}
                     disabled={!userInput || isBeautifying}
                     className={`p-2 rounded-xl transition-all active:scale-90 flex items-center space-x-1 ${isBeautifying ? 'text-orange-500 bg-orange-100 dark:bg-orange-500/20' : 'text-gray-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-700'}`}
                     title="AI 潤色"
                   >
                     {isBeautifying ? <RefreshCw className="animate-spin" size={20} /> : <Wand2 size={20} />}
                   </button>
                </div>
             </div>

             <button 
               onClick={handleGenerate}
               disabled={(!userInput && !selectedImagePreview) || isGenerating}
               className={`h-[52px] w-[52px] rounded-[22px] flex items-center justify-center shadow-lg transition-all active:scale-90 ${(!userInput && !selectedImagePreview) ? 'bg-gray-200 dark:bg-slate-800 text-gray-400' : 'bg-orange-500 text-white shadow-orange-500/30'}`}
             >
               {isGenerating ? <RefreshCw className="animate-spin" size={24} /> : <Send size={24} className={(!userInput && !selectedImagePreview) ? "ml-0" : "ml-0.5"} />}
             </button>
          </div>
        </div>
      </div>

      {/* Album Selection Modal */}
      {showAlbumModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowAlbumModal(false)} />
           <div className="relative bg-white dark:bg-slate-900 rounded-t-[40px] max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10">
              <div className="p-6 pb-2 flex justify-between items-center border-b border-gray-100 dark:border-white/5">
                 <h3 className="text-lg font-black text-gray-800 dark:text-white">選擇時光館照片</h3>
                 <button onClick={() => setShowAlbumModal(false)} className="p-2 text-gray-400"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-3 scrollbar-hide">
                 {albumPhotos.length === 0 ? (
                   <div className="col-span-3 text-center py-20 opacity-40">
                      <p className="text-xs font-black">相冊暫無照片，快去拍照吧！</p>
                   </div>
                 ) : (
                   albumPhotos.map(photo => (
                     <div 
                       key={photo.id} 
                       onClick={() => selectFromAlbum(photo.url)}
                       className="aspect-square rounded-2xl overflow-hidden relative cursor-pointer active:scale-95 transition-transform"
                     >
                       <img src={photo.url} className="w-full h-full object-cover" alt="Album" />
                       <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors"></div>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DiaryView;
