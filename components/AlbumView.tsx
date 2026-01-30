
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Image as ImageIcon, Upload, X, Camera, Image as GalleryIcon, Loader2, Trash2, Check } from 'lucide-react';
import * as backend from '../backend';

interface AlbumViewProps {
  onBack: () => void;
}

const AlbumView: React.FC<AlbumViewProps> = ({ onBack }) => {
  const [photos, setPhotos] = useState<backend.AlbumPhoto[]>([]);
  const [category, setCategory] = useState<'ALL' | 'DAILY' | 'HEALTH' | 'TRAVEL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    backend.fetchAlbumPhotos().then(data => {
      setPhotos(data);
      setIsLoading(false);
    });
  }, []);

  const handleAddPhoto = async (type: 'GALLERY' | 'CAMERA') => {
    setShowUploadMenu(false);
    if (type === 'GALLERY') {
      fileInputRef.current?.click();
    } else {
      cameraInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const activeCategory = category === 'ALL' ? 'DAILY' : category;
      // 修改：將文件對象傳遞給後端，而不是只傳類別
      const newPhoto = await backend.addAlbumPhoto(activeCategory, file);
      setPhotos([newPhoto, ...photos]);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await backend.deleteAlbumPhoto(id);
      setPhotos(prev => prev.filter(p => p.id !== id));
      if (window.navigator.vibrate) window.navigator.vibrate(40);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhotoPressStart = (id: string) => {
    if (isEditMode) return;
    longPressTimer.current = window.setTimeout(() => {
      setIsEditMode(true);
      if (window.navigator.vibrate) window.navigator.vibrate([10, 30, 10]);
    }, 600);
  };

  const handlePhotoPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePhotoClick = (photo: backend.AlbumPhoto) => {
    if (isEditMode) return;
    setViewingImage(photo.url);
  };

  const filteredPhotos = category === 'ALL' 
    ? photos 
    : photos.filter(p => p.category === category);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Hidden Inputs */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center space-x-4">
          <button onClick={isEditMode ? () => setIsEditMode(false) : onBack} className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white">
            {isEditMode ? <Check size={22} className="text-orange-500" /> : <ArrowLeft size={22} />}
          </button>
          <div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">
              {isEditMode ? '管理相冊' : '萌寵時光館'}
            </h3>
            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">
              {isEditMode ? '編輯模式' : `Archive · ${photos.length} Photos`}
            </p>
          </div>
        </div>
        {!isEditMode && (
          <button 
            onClick={() => setShowUploadMenu(true)}
            className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {/* 分類篩選 */}
        {!isEditMode && (
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'ALL', label: '全部' },
              { id: 'DAILY', label: '日常' },
              { id: 'HEALTH', label: '健康' },
              { id: 'TRAVEL', label: '戶外' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as any)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-[11px] font-black transition-all ${category === cat.id ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* 相片網格 */}
        <div className="grid grid-cols-2 gap-4">
          {!isEditMode && (
            <button 
              onClick={() => setShowUploadMenu(true)}
              className="aspect-square glass bg-gray-50 dark:bg-slate-800/50 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[32px] flex flex-col items-center justify-center space-y-2 text-gray-400 active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                <Upload size={24} />
              </div>
              <span className="text-[10px] font-black uppercase">Upload New</span>
            </button>
          )}

          {filteredPhotos.map((photo) => (
            <div 
              key={photo.id} 
              onMouseDown={() => handlePhotoPressStart(photo.id)}
              onMouseUp={handlePhotoPressEnd}
              onMouseLeave={handlePhotoPressEnd}
              onTouchStart={() => handlePhotoPressStart(photo.id)}
              onTouchEnd={handlePhotoPressEnd}
              onClick={() => handlePhotoClick(photo)}
              className={`aspect-square rounded-[32px] overflow-hidden glass border border-white/40 dark:border-white/10 relative group animate-in zoom-in-95 duration-500 cursor-pointer shadow-sm transition-all ${isEditMode ? 'animate-wiggle scale-95 ring-2 ring-orange-500/20' : ''}`}
            >
              <img src={photo.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Pet Memory" />
              
              {!isEditMode && (
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-white text-[9px] font-black bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 uppercase">
                    {photo.category}
                  </span>
                </div>
              )}

              {isEditMode && (
                <button 
                  onClick={(e) => handleDeletePhoto(photo.id, e)}
                  className="absolute top-3 right-3 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 z-20"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {(isLoading || isUploading) && (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Loader2 size={48} className="mb-4 animate-spin" />
            <p className="text-sm font-black uppercase tracking-widest">{isUploading ? 'Saving Moment...' : 'Loading Moments...'}</p>
          </div>
        )}
      </div>

      {/* Upload Options Menu */}
      {showUploadMenu && (
        <div className="fixed inset-0 z-[150] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowUploadMenu(false)} />
          <div className="relative w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-t-[40px] p-6 pb-12 space-y-4 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-2 px-2">
               <h4 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">選擇上傳方式</h4>
               <button onClick={() => setShowUploadMenu(false)} className="p-2 text-gray-400"><X size={24} /></button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => handleAddPhoto('CAMERA')} className="w-full flex items-center space-x-4 p-5 rounded-[28px] bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 active:scale-[0.98] transition-all">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><Camera size={24} /></div>
                <div className="text-left"><p className="font-black text-gray-800 dark:text-white">立即拍照</p><p className="text-xs text-gray-400 font-bold">開啟相機捕捉現時精彩</p></div>
              </button>
              <button onClick={() => handleAddPhoto('GALLERY')} className="w-full flex items-center space-x-4 p-5 rounded-[28px] bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 active:scale-[0.98] transition-all">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><GalleryIcon size={24} /></div>
                <div className="text-left"><p className="font-black text-gray-800 dark:text-white">本地相冊上傳</p><p className="text-xs text-gray-400 font-bold">從手機相冊中選取回憶</p></div>
              </button>
            </div>
            <button onClick={() => setShowUploadMenu(false)} className="w-full py-4 text-gray-400 font-black text-sm uppercase tracking-widest">取消操作</button>
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {viewingImage && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-fade-in" onClick={() => setViewingImage(null)}>
          <button className="absolute top-10 right-6 text-white w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 z-[210] active:scale-90 transition-transform">
            <X size={28} />
          </button>
          <img 
            src={viewingImage} 
            className="max-w-full max-h-full object-contain animate-zoom-in duration-300" 
            alt="Fullscreen View" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Edit Mode Hint */}
      {isEditMode && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-5">
           <button 
             onClick={() => setIsEditMode(false)}
             className="px-8 py-3 bg-orange-500 text-white rounded-full font-black text-sm shadow-2xl flex items-center space-x-2"
           >
             <Check size={18} />
             <span>完成管理</span>
           </button>
        </div>
      )}

      <style>{`
        @keyframes wiggle {
          0% { transform: rotate(-1deg); }
          50% { transform: rotate(1deg); }
          100% { transform: rotate(-1deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out infinite;
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-zoom-in {
          animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
};

export default AlbumView;
