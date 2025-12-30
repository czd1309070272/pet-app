
import React, { useState, useRef } from 'react';
import { ChevronLeft, Zap, Info, ShieldAlert, CheckCircle, Camera, Image as ImageIcon, History, RefreshCw, Loader2 } from 'lucide-react';
import { View } from '../types';
import * as backend from '../backend';

interface ScannerViewProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
}

const ScannerView: React.FC<ScannerViewProps> = ({ onBack, onNavigate }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<backend.ScannerResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsAnalyzing(true);
    setResult(null);
    try {
      const data = await backend.performScannerAnalysis(file);
      setResult(data);
    } catch (err) {
      console.error("Scanner analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack} 
            className="w-10 h-10 flex items-center justify-center glass rounded-full text-gray-600 dark:text-gray-300 shadow-sm border border-white/60 dark:border-white/10 floating-btn active:scale-90"
          >
            <ChevronLeft size={22} />
          </button>
          <h2 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">成分分析管家</h2>
        </div>
        <button 
          onClick={() => onNavigate(View.HISTORY_SCANNER)}
          className="w-10 h-10 flex items-center justify-center glass rounded-full text-orange-500 dark:text-orange-400 shadow-sm border border-white/60 dark:border-white/10 floating-btn active:scale-90"
        >
          <History size={20} />
        </button>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {!result && !isAnalyzing ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="aspect-[4/3] glass rounded-[32px] border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-gray-400 p-8">
            <Zap size={48} className="mb-4 text-gray-200 dark:text-gray-700" />
            <p className="text-sm font-bold">請選擇分析方式</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={triggerUpload}
              className="glass p-6 rounded-[28px] flex flex-col items-center space-y-3 floating-btn border border-white/80 dark:border-white/5"
            >
              <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                <Camera size={24} />
              </div>
              <span className="text-sm font-black text-gray-700 dark:text-gray-200">相機拍攝</span>
            </button>
            <button 
              onClick={triggerUpload}
              className="glass p-6 rounded-[28px] flex flex-col items-center space-y-3 floating-btn border border-white/80 dark:border-white/5"
            >
              <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <ImageIcon size={24} />
              </div>
              <span className="text-sm font-black text-gray-700 dark:text-gray-200">相簿上傳</span>
            </button>
          </div>
        </div>
      ) : isAnalyzing ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-orange-500" size={48} />
          <p className="text-sm font-black text-gray-500">AI 正在識別成分內容...</p>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="relative rounded-[32px] overflow-hidden aspect-[4/3] glass shadow-xl border border-white/40 dark:border-white/10">
            <img src={result!.resultUrl} className="w-full h-full object-cover" alt="Label Scan" />
            <div className="absolute inset-0 border-4 border-orange-500/30 animate-pulse"></div>
          </div>

          {result!.hasRisk && (
            <div className="bg-rose-50/80 dark:bg-rose-500/10 backdrop-blur-sm border border-rose-100 dark:border-rose-500/20 rounded-[28px] p-5 flex items-start space-x-3 shadow-sm">
               <ShieldAlert className="text-rose-500 shrink-0" size={24} />
               <div>
                 <h4 className="font-black text-rose-900 dark:text-rose-100">發現潛在風險成分</h4>
                 <p className="text-xs text-rose-700 dark:text-rose-200 mt-1 font-medium">
                   {result!.summary}
                 </p>
               </div>
             </div>
          )}

           <div className="glass border border-emerald-100 dark:border-emerald-500/20 rounded-[28px] p-5 space-y-3">
             <h4 className="font-black text-emerald-900 dark:text-emerald-100 flex items-center text-sm">
               <CheckCircle size={18} className="mr-2 text-emerald-500" />
               安全成分
             </h4>
             <div className="flex flex-wrap gap-2">
               {result!.safeIngredients.map(item => (
                 <span key={item} className="px-3 py-1 bg-white/60 dark:bg-white/10 rounded-lg text-[10px] font-black text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-50 dark:border-white/5">
                   {item}
                 </span>
               ))}
             </div>
           </div>

           <button onClick={() => setResult(null)} className="w-full py-4 glass text-gray-500 dark:text-gray-400 rounded-2xl font-black text-sm floating-btn border border-white/40 dark:border-white/5">
              重新掃描
           </button>
        </div>
      )}
    </div>
  );
};

export default ScannerView;
