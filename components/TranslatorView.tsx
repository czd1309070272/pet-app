
import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  Languages, 
  ArrowDown, 
  HelpCircle, 
  Camera, 
  Image as ImageIcon, 
  History, 
  RefreshCw, 
  User, 
  Loader2, 
  ChevronDown, 
  Heart, 
  CheckCircle2, 
  AlertCircle,
  Bug
} from 'lucide-react';
import { View } from '../types';
import * as backend from '../backend';
import { ViewHeader, ActionButton, GlassCard, ErrorModal } from './shared/CommonUI';

interface TranslatorViewProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
  pets: backend.PetProfile[];
}

const TranslatorView: React.FC<TranslatorViewProps> = ({ onBack, onNavigate, pets }) => {
  const activePets = pets.filter(p => !p.isMemorial);

  const [step, setStep] = useState(1);
  const [selectedPetName, setSelectedPetName] = useState<string>(activePets.length > 0 ? activePets[0].name : '');
  const [showPetPicker, setShowPetPicker] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<backend.TranslatorResult | null>(null);
  const [errorResponse, setErrorResponse] = useState<{ code: number; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPet = activePets.find(p => p.name === selectedPetName) || activePets[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsAnalyzing(true);
    setStep(2);
    setErrorResponse(null);
    try {
      const response = await backend.performTranslatorAnalysis(selectedPetName, file);
      if (response.code === 200 && response.data) {
        setAnalysisResult(response.data);
      } else {
        setErrorResponse({ code: response.code, message: response.message });
      }
    } catch (err) {
      setErrorResponse({ code: 500, message: "翻譯助手暫時走神了" });
    } finally {
      setIsAnalyzing(false);
      e.target.value = '';
    }
  };

  const simulateError = (code: number) => {
    setIsAnalyzing(true);
    setStep(2);
    setTimeout(() => {
      setIsAnalyzing(false);
      setErrorResponse({ code, message: "測試模擬錯誤" });
    }, 1000);
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
          <button onClick={() => onNavigate(View.HISTORY_TRANSLATOR)} className="w-10 h-10 flex items-center justify-center glass rounded-xl text-emerald-500 active:scale-90">
            <History size={20} />
          </button>
        } 
      />

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      <ErrorModal 
        isOpen={!!errorResponse} 
        onClose={() => { setErrorResponse(null); setStep(1); }} 
        code={errorResponse?.code}
        onRetry={triggerUpload}
      />

      {step === 1 ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-3">
             <div className="relative">
                <div onClick={() => setShowPetPicker(!showPetPicker)} className="glass p-4 rounded-[32px] flex items-center space-x-4 border shadow-sm cursor-pointer">
                  <img src={currentPet?.avatar} className="w-16 h-16 rounded-2xl object-cover" alt={currentPet?.name} />
                  <div className="flex-1">
                    <h4 className="font-black text-lg text-gray-900 dark:text-white">{currentPet?.name}</h4>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-black rounded-lg">{currentPet?.breed}</span>
                  </div>
                  <ChevronDown size={20} className={showPetPicker ? 'rotate-180 text-emerald-500' : 'text-gray-400'} />
                </div>
                {showPetPicker && (
                  <div className="absolute top-full left-0 right-0 mt-3 z-50 animate-in zoom-in-95 duration-300">
                    <div className="glass bg-white/95 dark:bg-slate-900/95 rounded-[32px] border p-2 space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                      {activePets.map((pet) => (
                        <div key={pet.id} onClick={() => { setSelectedPetName(pet.name); setShowPetPicker(false); }} className={`p-3 rounded-2xl flex items-center space-x-3 cursor-pointer ${selectedPetName === pet.name ? 'bg-emerald-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'}`}>
                          <img src={pet.avatar} className="w-10 h-10 rounded-xl object-cover" alt={pet.name} />
                          <p className="text-xs font-black flex-1">{pet.name}</p>
                          {selectedPetName === pet.name && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
             </div>
          </div>

          <GlassCard className="bg-white/30 dark:bg-white/5 p-8 flex flex-col items-center space-y-4 border-2 border-dashed border-gray-200 dark:border-white/10">
            <FileUp size={32} className="text-emerald-500" />
            <p className="font-black text-gray-800 dark:text-white">準備好 {selectedPetName} 的化驗單了嗎？</p>
          </GlassCard>

          <div className="grid grid-cols-2 gap-4">
            <ActionButton onClick={triggerUpload} variant="glass" className="p-6 rounded-[28px] flex-col space-y-3">
              <Camera size={24} className="text-emerald-500" />
              <span className="text-sm font-black">拍照識別</span>
            </ActionButton>
            <ActionButton onClick={triggerUpload} variant="glass" className="p-6 rounded-[28px] flex-col space-y-3">
              <ImageIcon size={24} className="text-emerald-500" />
              <span className="text-sm font-black">選擇圖片</span>
            </ActionButton>
          </div>

          <div className="flex space-x-2 pt-6 opacity-30 justify-center">
             <button onClick={() => simulateError(400)} className="px-3 py-1.5 border border-dashed border-emerald-500 rounded-lg text-[9px] font-black text-emerald-600 flex items-center space-x-1"><Bug size={10}/><span>模擬圖片失敗</span></button>
             <button onClick={() => simulateError(500)} className="px-3 py-1.5 border border-dashed border-emerald-500 rounded-lg text-[9px] font-black text-emerald-600 flex items-center space-x-1"><Bug size={10}/><span>模擬服務失敗</span></button>
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
               {analysisResult && (
                 <>
                   <div className="flex items-center space-x-3 mb-2 px-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500">
                        <img src={currentPet?.avatar} alt="pet" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-gray-800 dark:text-white">{selectedPetName} 的診療報告</h4>
                        <p className="text-[10px] font-black text-emerald-600 uppercase">AI 分析完畢</p>
                      </div>
                   </div>

                   <GlassCard className="p-5">
                     <h4 className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-wider">原文術語片段</h4>
                     <p className="text-xs text-gray-700 dark:text-slate-300 font-mono italic">「{analysisResult.termExcerpts}」</p>
                   </GlassCard>
                   
                   <div className="flex justify-center text-emerald-500 animate-bounce">
                     <ArrowDown size={32} />
                   </div>

                   <GlassCard className="p-6 space-y-5 shadow-xl">
                      <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
                        <Languages size={20} />
                        <h4 className="font-black">大白話翻譯結果</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-white/40 dark:bg-white/5 p-5 rounded-[24px] border border-white/30">
                          <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 mb-2 uppercase">解釋</p>
                          <p className="text-sm font-medium leading-relaxed text-gray-700 dark:text-slate-200">{analysisResult.explanation}</p>
                        </div>
                        {analysisResult.suggestions.length > 0 && (
                          <div className="bg-white/40 dark:bg-white/5 p-5 rounded-[24px] border border-white/30">
                            <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 mb-2 uppercase">建議</p>
                            <ul className="text-xs space-y-2 list-disc list-inside font-bold text-gray-600 dark:text-slate-400">
                              {analysisResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                   </GlassCard>
                 </>
               )}
               <ActionButton onClick={() => { setStep(1); setErrorResponse(null); }} variant="glass" className="w-full">重新解讀</ActionButton>
             </>
           )}
        </div>
      )}
    </div>
  );
};

export default TranslatorView;
