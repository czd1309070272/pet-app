
import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  Zap, 
  Info, 
  ShieldAlert, 
  CheckCircle, 
  Camera, 
  Image as ImageIcon, 
  History, 
  RefreshCw, 
  Loader2, 
  AlertCircle,
  Bug,
  ChevronDown,
  User,
  XCircle
} from 'lucide-react';
import { View, PetProfile } from '../types';
import * as backend from '../backend';
import { ErrorModal } from './shared/CommonUI';

interface ScannerViewProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
}

const ScannerView: React.FC<ScannerViewProps> = ({ onBack, onNavigate }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<backend.ScannerResult | null>(null);
  const [errorResponse, setErrorResponse] = useState<{ code: number; message: string } | null>(null);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [showPetPicker, setShowPetPicker] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    backend.fetchPets().then(data => {
      const active = data.filter(p => !p.isMemorial);
      setPets(active);
      if (active.length > 0) setSelectedPetId(active[0].id);
    });
  }, []);

  const selectedPet = pets.find(p => p.id === selectedPetId);

  const calculateAge = (birthday: string) => {
    const birth = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return Math.max(0, age);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPet) return;
    
    setIsAnalyzing(true);
    setResult(null);
    setErrorResponse(null);

    const petContext = {
      breed: selectedPet.breed,
      age: calculateAge(selectedPet.birthday),
      gender: selectedPet.gender
    };

    try {
      const response = await backend.performScannerAnalysis(file, petContext);
      if (response.code === 200 && response.data) {
        setResult(response.data);
      } else {
        setErrorResponse({ code: response.code, message: response.message });
      }
    } catch (err) {
      setErrorResponse({ code: 500, message: "分析超時，請重試" });
    } finally {
      setIsAnalyzing(false);
      if (e.target) e.target.value = '';
    }
  };

  const simulateError = (code: number) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setErrorResponse({ code, message: "測試模擬錯誤" });
    }, 800);
  };

  const triggerUpload = () => {
    if (!selectedPetId) {
      alert('請先選擇寵物喔！');
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto pb-24 scrollbar-hide bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white shadow-sm active:scale-90 transition-transform">
            <ChevronLeft size={22} />
          </button>
          <h2 className="text-xl font-black tracking-tight text-gray-800 dark:text-white">成分分析管家</h2>
        </div>
        <button onClick={() => onNavigate(View.HISTORY_SCANNER)} className="w-10 h-10 flex items-center justify-center glass rounded-full text-orange-500 shadow-sm active:scale-90">
          <History size={20} />
        </button>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      <ErrorModal 
        isOpen={!!errorResponse} 
        onClose={() => setErrorResponse(null)} 
        code={errorResponse?.code}
        onRetry={triggerUpload}
      />

      {!result && !isAnalyzing ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Pet Picker Dropdown */}
          <div className="space-y-3">
             <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase">選擇受檢寵物</h4>
             </div>
             <div className="relative">
                <div 
                  onClick={() => setShowPetPicker(!showPetPicker)}
                  className={`glass p-4 rounded-[32px] flex items-center space-x-4 border shadow-sm transition-all cursor-pointer active:scale-[0.98] ${showPetPicker ? 'ring-2 ring-orange-500/20' : 'border-white/60'}`}
                >
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                    {selectedPet ? <img src={selectedPet.avatar} className="w-full h-full object-cover" alt="pet" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400"><User size={20}/></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-gray-900 dark:text-white truncate">{selectedPet?.name || '請選擇寵物'}</h4>
                    {selectedPet && <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{selectedPet.breed} · {calculateAge(selectedPet.birthday)}歲</p>}
                  </div>
                  <ChevronDown size={20} className={`text-gray-300 transition-transform ${showPetPicker ? 'rotate-180 text-orange-500' : ''}`} />
                </div>

                {showPetPicker && (
                  <div className="absolute top-full left-0 right-0 mt-3 z-50 animate-in fade-in zoom-in-95 duration-300">
                    <div className="glass bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] border p-2 space-y-1 shadow-2xl max-h-60 overflow-y-auto scrollbar-hide">
                      {pets.map((pet) => (
                        <div 
                          key={pet.id}
                          onClick={() => { setSelectedPetId(pet.id); setShowPetPicker(false); }}
                          className={`p-3 rounded-2xl flex items-center space-x-3 transition-all cursor-pointer ${selectedPetId === pet.id ? 'bg-orange-500 text-white shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        >
                          <img src={pet.avatar} className="w-10 h-10 rounded-xl object-cover" alt={pet.name} />
                          <div className="flex-1">
                            <p className="text-xs font-black truncate">{pet.name}</p>
                            <p className={`text-[8px] font-bold ${selectedPetId === pet.id ? 'text-white/70' : 'text-gray-400'}`}>{pet.breed}</p>
                          </div>
                          {selectedPetId === pet.id && <CheckCircle size={14} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
             </div>
          </div>

          <div className="aspect-[4/3] glass rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-8">
            <Zap size={48} className="mb-4 text-gray-200" />
            <p className="text-sm font-bold">請拍攝食品配料表照片</p>
            <p className="text-[10px] mt-2 opacity-60">AI 將結合 {selectedPet?.name} 的生理特徵進行分析</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button onClick={triggerUpload} className="glass p-6 rounded-[28px] flex flex-col items-center space-y-3 active:scale-95 transition-all">
              <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><Camera size={24} /></div>
              <span className="text-sm font-black text-gray-800 dark:text-white">相機拍攝</span>
            </button>
            <button onClick={triggerUpload} className="glass p-6 rounded-[28px] flex flex-col items-center space-y-3 active:scale-95 transition-all">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><ImageIcon size={24} /></div>
              <span className="text-sm font-black text-gray-800 dark:text-white">相簿上傳</span>
            </button>
          </div>

          <div className="flex space-x-2 pt-4 opacity-50 justify-center">
            <button onClick={() => simulateError(400)} className="px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center space-x-2 text-[10px] font-black"><Bug size={12}/> <span>模擬 400</span></button>
            <button onClick={() => simulateError(500)} className="px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center space-x-2 text-[10px] font-black"><Bug size={12}/> <span>模擬 500</span></button>
          </div>
        </div>
      ) : isAnalyzing ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            <Loader2 className="animate-spin text-orange-500" size={64} />
            <div className="absolute inset-0 flex items-center justify-center">
               <Zap size={24} className="text-orange-500 animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-black text-gray-800 dark:text-white">正在為 {selectedPet?.name} 分析成分...</p>
            <p className="text-xs font-bold text-gray-400">對應品種特點與生長階段中</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 pb-10">
          <div className="relative rounded-[32px] overflow-hidden aspect-[16/9] glass shadow-xl border border-white/40">
            <img src={result!.resultUrl} className="w-full h-full object-cover opacity-80" alt="Label Scan" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute bottom-4 left-6">
               <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                    <img src={selectedPet?.avatar} className="w-full h-full object-cover" alt="pet" />
                  </div>
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">{selectedPet?.name} 的專屬報告</span>
               </div>
            </div>
          </div>

          <div className="space-y-5">
            {/* Summary Block */}
            <div className="glass p-6 rounded-[32px] border border-white/60">
               <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">AI 專家評測結論</h4>
               <p className="text-sm font-bold text-gray-700 dark:text-slate-200 leading-relaxed italic">「{result!.summary}」</p>
            </div>

            {/* Risk Ingredients (Red List) */}
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-500/20 rounded-[32px] p-6 space-y-4">
               <div className="flex items-center justify-between">
                 <h4 className="font-black text-rose-700 dark:text-rose-400 flex items-center text-sm">
                   <XCircle size={18} className="mr-2" />
                   成分紅榜（不建議/有風險）
                 </h4>
                 <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-md">{result!.riskIngredients.length} 項</span>
               </div>
               {result!.riskIngredients.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                    {result!.riskIngredients.map(item => (
                      <span key={item} className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl text-[10px] font-black text-rose-600 shadow-sm border border-rose-100 dark:border-rose-900/30">
                        {item}
                      </span>
                    ))}
                 </div>
               ) : (
                 <p className="text-[10px] font-bold text-rose-400">目前暫未發現顯著風險成分 ✨</p>
               )}
            </div>

            {/* Safe Ingredients (Green List) */}
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-[32px] p-6 space-y-4">
               <div className="flex items-center justify-between">
                 <h4 className="font-black text-emerald-700 dark:text-emerald-400 flex items-center text-sm">
                   <CheckCircle size={18} className="mr-2" />
                   成分綠榜（健康/優質）
                 </h4>
                 <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-md">{result!.safeIngredients.length} 項</span>
               </div>
               <div className="flex flex-wrap gap-2">
                 {result!.safeIngredients.map(item => (
                   <span key={item} className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl text-[10px] font-black text-emerald-600 shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                     {item}
                   </span>
                 ))}
               </div>
            </div>

            <button onClick={() => setResult(null)} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm active:scale-[0.98] shadow-xl">
               重新掃描
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerView;
