
import React, { useState, useRef } from 'react';
import { FileUp, Languages, ArrowDown, HelpCircle, Camera, Image as ImageIcon, History, RefreshCw, User, Loader2, ChevronDown, Heart, CheckCircle2 } from 'lucide-react';
import { View } from '../types';
import * as backend from '../backend';
import { ViewHeader, ActionButton, GlassCard } from './shared/CommonUI';

interface TranslatorViewProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
  pets: backend.PetProfile[];
}

const TranslatorView: React.FC<TranslatorViewProps> = ({ onBack, onNavigate, pets }) => {
  // 過濾星空寵物
  const activePets = pets.filter(p => !p.isMemorial);

  const [step, setStep] = useState(1);
  const [selectedPetName, setSelectedPetName] = useState<string>(activePets.length > 0 ? activePets[0].name : '');
  const [showPetPicker, setShowPetPicker] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<backend.TranslatorResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPet = activePets.find(p => p.name === selectedPetName) || activePets[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsAnalyzing(true);
    setStep(2);
    try {
      const data = await backend.performTranslatorAnalysis(selectedPetName, file);
      setAnalysisResult(data);
    } catch (err) {
      console.error("Translation failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 space-y-8 h-full overflow-y-auto pb-24 scrollbar-hide">
      <ViewHeader 
        title="診療報告翻譯官" 
        onBack={onBack} 
        rightElement={
          <button onClick={() => onNavigate(View.HISTORY_TRANSLATOR)} className="w-10 h-10 flex items-center justify-center glass rounded-full text-emerald-500 floating-btn">
            <History size={20} />
          </button>
        } 
      />

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {step === 1 ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 高級感寵物選擇器 */}
          <div className="space-y-3">
             <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase">選擇受檢寵物</h4>
                <span className="text-[9px] font-black text-emerald-600 uppercase">健康追蹤</span>
             </div>
             
             <div className="relative">
                {/* 當前選中項卡片 */}
                <div 
                  onClick={() => setShowPetPicker(!showPetPicker)}
                  className={`glass p-4 rounded-[32px] flex items-center space-x-4 border shadow-sm transition-all duration-300 cursor-pointer active:scale-[0.98] ${showPetPicker ? 'ring-2 ring-emerald-500/20 border-emerald-200' : 'border-white/60 dark:border-white/5'}`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={currentPet?.avatar} className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white dark:border-slate-800" alt={currentPet?.name} />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md">
                      <Heart size={10} fill="currentColor" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-lg text-gray-900 dark:text-white truncate">{currentPet?.name}</h4>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black rounded-lg">{currentPet?.breed}</span>
                      <span className="text-[9px] text-gray-400 font-bold">{currentPet?.gender}</span>
                    </div>
                  </div>
                  <div className={`text-gray-300 transition-transform duration-300 ${showPetPicker ? 'rotate-180 text-emerald-500' : ''}`}>
                    <ChevronDown size={20} />
                  </div>
                </div>

                {/* 展開的萌寶列表 - 僅限活躍寵物 */}
                {showPetPicker && (
                  <div className="absolute top-full left-0 right-0 mt-3 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300">
                    <div className="glass bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] border border-white/60 dark:border-white/10 shadow-2xl p-2 space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                      {activePets.map((pet) => (
                        <div 
                          key={pet.id}
                          onClick={() => { setSelectedPetName(pet.name); setShowPetPicker(false); }}
                          className={`p-3 rounded-2xl flex items-center space-x-3 transition-all cursor-pointer ${selectedPetName === pet.name ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        >
                          <img src={pet.avatar} className="w-10 h-10 rounded-xl object-cover border border-white/20" alt={pet.name} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-black truncate ${selectedPetName === pet.name ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{pet.name}</p>
                            <p className={`text-[9px] font-bold opacity-70 truncate ${selectedPetName === pet.name ? 'text-emerald-50' : 'text-gray-400'}`}>{pet.breed}</p>
                          </div>
                          {selectedPetName === pet.name && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                      ))}
                      {activePets.length === 0 && (
                        <div className="p-6 text-center text-gray-400 text-xs font-bold italic">尚無相伴中的寵物</div>
                      )}
                    </div>
                  </div>
                )}
             </div>
          </div>

          <GlassCard className="bg-white/30 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 p-8 flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-100">
              <FileUp size={32} />
            </div>
            <div className="text-center">
              <p className="font-black text-gray-800 dark:text-white">準備好 {selectedPetName} 的化驗單了嗎？</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold">AI 將為您解讀每一項關鍵指標</p>
            </div>
          </GlassCard>

          <div className="grid grid-cols-2 gap-4">
            <ActionButton onClick={triggerUpload} variant="glass" className="p-6 rounded-[28px] flex-col space-y-3">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><Camera size={24} /></div>
              <span className="text-sm font-black text-gray-700 dark:text-gray-200">拍照識別</span>
            </ActionButton>
            <ActionButton onClick={triggerUpload} variant="glass" className="p-6 rounded-[28px] flex-col space-y-3">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 text-emerald-500 border border-emerald-100 rounded-2xl flex items-center justify-center"><ImageIcon size={24} /></div>
              <span className="text-sm font-black text-gray-700 dark:text-gray-200">選擇圖片</span>
            </ActionButton>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
           {isAnalyzing ? (
             <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <RefreshCw className="animate-spin text-emerald-500" size={48} />
                <p className="text-sm font-black text-gray-500">AI 正在深度解讀 {selectedPetName} 的報告...</p>
             </div>
           ) : (
             <>
               <div className="flex items-center space-x-3 mb-2 px-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500">
                    <img src={currentPet?.avatar || 'https://picsum.photos/seed/default/100'} alt="pet" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-800 dark:text-white">{selectedPetName} 的診療報告</h4>
                    <p className="text-[10px] font-black text-emerald-600 uppercase">AI 分析完畢</p>
                  </div>
               </div>

               <GlassCard className="p-5">
                 <h4 className="text-[10px] font-black text-gray-400 mb-2 tracking-wider uppercase">原文術語片段</h4>
                 <p className="text-xs text-gray-700 dark:text-gray-300 font-mono italic">「{analysisResult?.termExcerpts}」</p>
               </GlassCard>
               
               <div className="flex justify-center text-emerald-500 drop-shadow-xl animate-bounce">
                 <ArrowDown size={32} />
               </div>

               <GlassCard className="p-6 space-y-5 shadow-xl shadow-emerald-100/10">
                  <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
                    <div className="p-2 bg-emerald-500/10 rounded-xl"><Languages size={20} /></div>
                    <h4 className="font-black">大白話翻譯結果</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/40 dark:bg-white/5 backdrop-blur-sm p-5 rounded-[24px] border border-white/30">
                      <p className="text-[10px] font-black text-emerald-800 dark:text-amber-300 mb-2 tracking-widest uppercase">是什麼意思？</p>
                      <p className="text-sm text-emerald-900 dark:text-emerald-100 leading-relaxed font-medium">
                        {analysisResult?.explanation}
                      </p>
                    </div>
                    {analysisResult?.suggestions && (
                      <div className="bg-white/40 dark:bg-white/5 backdrop-blur-sm p-5 rounded-[24px] border border-white/30">
                        <p className="text-[10px] font-black text-emerald-800 dark:text-amber-300 mb-2 tracking-widest uppercase">接下萊怎麼辦？</p>
                        <ul className="text-xs text-emerald-900 dark:text-emerald-100 space-y-2 list-disc list-inside font-bold">
                          {analysisResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
               </GlassCard>

               <ActionButton onClick={() => setStep(1)} variant="glass" className="w-full">
                  重新解讀
               </ActionButton>
             </>
           )}
        </div>
      )}
    </div>
  );
};

export default TranslatorView;
