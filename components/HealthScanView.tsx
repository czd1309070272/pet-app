
import React, { useState, useRef } from 'react';
import { 
  Camera, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Image as ImageIcon, 
  History, 
  User,
  Scan,
  Sparkles,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Heart
} from 'lucide-react';
import { View } from '../types';
import * as backend from '../backend';
import { ViewHeader, ActionButton, GlassCard } from './shared/CommonUI';

interface HealthScanViewProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
  pets: backend.PetProfile[];
}

const HealthScanView: React.FC<HealthScanViewProps> = ({ onBack, onNavigate, pets }) => {
  // 過濾掉星空寵物，AI檢測僅限相伴中的寵物
  const activePets = pets.filter(p => !p.isMemorial);
  
  const [mode, setMode] = useState<'STOOL' | 'SKIN'>('STOOL');
  const [selectedPetName, setSelectedPetName] = useState<string>(activePets.length > 0 ? activePets[0].name : '');
  const [showPetPicker, setShowPetPicker] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<backend.HealthScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPet = activePets.find(p => p.name === selectedPetName) || activePets[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsScanning(true);
    setResult(null);
    try {
      const scanResult = await backend.performAIHealthScan(mode, selectedPetName, file);
      setResult(scanResult);
    } catch (err) {
      console.error("Health Scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 space-y-8 h-full overflow-y-auto pb-24 scrollbar-hide">
      <ViewHeader 
        title="AI 健康檢測" 
        onBack={onBack} 
        rightElement={
          <button 
            onClick={() => onNavigate(View.HISTORY_HEALTH)}
            className="w-10 h-10 flex items-center justify-center glass rounded-full text-blue-500 floating-btn"
          >
            <History size={20} />
          </button>
        } 
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {!result && !isScanning && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 高級感寵物選擇器 */}
          <div className="space-y-3">
             <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase">選擇受檢寵物</h4>
                <span className="text-[9px] font-black text-blue-500 uppercase">檔案庫聯動</span>
             </div>
             
             <div className="relative">
                {/* 當前選中項卡片 */}
                <div 
                  onClick={() => setShowPetPicker(!showPetPicker)}
                  className={`glass p-4 rounded-[32px] flex items-center space-x-4 border shadow-sm transition-all duration-300 cursor-pointer active:scale-[0.98] ${showPetPicker ? 'ring-2 ring-blue-500/20 border-blue-200' : 'border-white/60 dark:border-white/5'}`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={currentPet?.avatar} className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white dark:border-slate-800" alt={currentPet?.name} />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md">
                      <Heart size={10} fill="currentColor" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-lg text-gray-900 dark:text-white truncate">{currentPet?.name}</h4>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[9px] font-black rounded-lg">{currentPet?.breed}</span>
                      <span className="text-[9px] text-gray-400 font-bold">{currentPet?.gender}</span>
                    </div>
                  </div>
                  <div className={`text-gray-300 transition-transform duration-300 ${showPetPicker ? 'rotate-180 text-blue-500' : ''}`}>
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
                          className={`p-3 rounded-2xl flex items-center space-x-3 transition-all cursor-pointer ${selectedPetName === pet.name ? 'bg-blue-500 text-white shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        >
                          <img src={pet.avatar} className="w-10 h-10 rounded-xl object-cover border border-white/20" alt={pet.name} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-black truncate ${selectedPetName === pet.name ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{pet.name}</p>
                            <p className={`text-[9px] font-bold opacity-70 truncate ${selectedPetName === pet.name ? 'text-blue-50' : 'text-gray-400'}`}>{pet.breed}</p>
                          </div>
                          {selectedPetName === pet.name && <CheckCircle2 size={14} />}
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

          <div className="space-y-3">
             <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase px-1">檢測模式</h4>
             <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/5">
                <button 
                  onClick={() => setMode('STOOL')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${mode === 'STOOL' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}
                >
                  糞便檢測
                </button>
                <button 
                  onClick={() => setMode('SKIN')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${mode === 'SKIN' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}
                >
                  皮膚掃描
                </button>
             </div>
          </div>

          <GlassCard className="bg-white/30 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 p-10 flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-100 dark:border-blue-500/20">
              <Scan size={32} />
            </div>
            <div className="text-center">
              <p className="font-black text-gray-800 dark:text-white">準備好進行{mode === 'STOOL' ? '糞便' : '皮膚'}拍攝了嗎？</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold">請確保環境光線充足</p>
            </div>
          </GlassCard>

          <div className="grid grid-cols-2 gap-4">
            <ActionButton onClick={triggerUpload} variant="glass" className="p-6 rounded-[28px] flex-col space-y-3">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200"><Camera size={24} /></div>
              <span className="text-sm font-black text-gray-700 dark:text-gray-200">拍照檢測</span>
            </ActionButton>
            <ActionButton onClick={triggerUpload} variant="glass" className="p-6 rounded-[28px] flex-col space-y-3">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 text-blue-500 border border-blue-100 dark:border-blue-500/20 rounded-2xl flex items-center justify-center"><ImageIcon size={24} /></div>
              <span className="text-sm font-black text-gray-700 dark:text-gray-200">相簿選擇</span>
            </ActionButton>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
          <div className="relative">
            <div className="w-24 h-24 bg-blue-500/10 rounded-[32px] flex items-center justify-center text-blue-500 border border-blue-100">
               <RefreshCw className="animate-spin" size={40} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center animate-bounce">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="text-center space-y-1">
             <p className="text-lg font-black text-gray-800 dark:text-white">AI 正在深度掃描...</p>
             <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">正在比對 {selectedPetName} 的健康特徵庫</p>
          </div>
        </div>
      )}

      {result && !isScanning && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
           <div className="flex items-center space-x-3 px-2">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500">
                <img src={currentPet?.avatar || 'https://picsum.photos/seed/default/100'} alt="pet" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-gray-800 dark:text-white">{selectedPetName} 的{mode === 'STOOL' ? '糞便' : '皮膚'}檢測報告</h4>
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">檢測完成</span>
                   <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                   <span className="text-[10px] font-bold text-gray-400">剛剛</span>
                </div>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black flex items-center ${result.status === 'Healthy' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-orange-500 text-white shadow-lg shadow-orange-100'}`}>
                {result.status === 'Healthy' ? <CheckCircle2 size={12} className="mr-1.5" /> : <AlertCircle size={12} className="mr-1.5" />}
                {result.status === 'Healthy' ? '健康' : '需觀察'}
              </div>
           </div>

           <GlassCard className="p-0 overflow-hidden relative group border-white/40 dark:border-white/5">
             <img src={result.resultUrl} className="w-full h-48 object-cover opacity-80" alt="Result" />
             <div className="absolute inset-0 border-2 border-blue-500/30 animate-pulse pointer-events-none"></div>
             <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-lg border border-white/20">
               RAW_SCAN_IMG_01
             </div>
           </GlassCard>
           
           <div className="flex justify-center text-blue-500 drop-shadow-xl animate-bounce">
             <ArrowDown size={32} />
           </div>

           <GlassCard className="p-6 space-y-5 shadow-xl shadow-blue-100/10">
              <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
                <div className="p-2 bg-blue-500/10 rounded-xl"><Sparkles size={20} /></div>
                <h4 className="font-black">AI 智能診斷建議</h4>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-sm p-5 rounded-[24px] border border-white/30">
                  <p className="text-[10px] font-black text-blue-800 dark:text-blue-300 mb-2 tracking-widest uppercase">狀況分析</p>
                  <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed font-medium">
                    {result.desc}
                  </p>
                </div>

                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-sm p-5 rounded-[24px] border border-white/30">
                  <p className="text-[10px] font-black text-blue-800 dark:text-blue-300 mb-2 tracking-widest uppercase">接下萊怎麼辦？</p>
                  <ul className="text-xs text-blue-900 dark:text-blue-100 space-y-2.5 list-none font-bold">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 mt-0.5 text-[8px]">{i+1}</div>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
           </GlassCard>

           <div className="flex space-x-3">
              <ActionButton onClick={() => setResult(null)} variant="glass" className="flex-1">
                 <RefreshCw size={18} />
                 <span>重新檢測</span>
              </ActionButton>
              <ActionButton onClick={() => {}} className="flex-1 bg-blue-600">
                 存入健康檔案
              </ActionButton>
           </div>
        </div>
      )}
    </div>
  );
};

export default HealthScanView;
