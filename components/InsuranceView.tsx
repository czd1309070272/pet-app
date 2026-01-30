
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  Calculator, 
  ShieldCheck, 
  Plus, 
  Camera, 
  Image as ImageIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Loader2,
  Sparkles,
  ChevronRight,
  HeartPulse
} from 'lucide-react';
import { InsurancePolicy } from '../types';
import * as backend from '../backend';

interface InsuranceViewProps {
  onBack: () => void;
}

const InsuranceView: React.FC<InsuranceViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'MY' | 'CALC'>('MY');
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [petType, setPetType] = useState('CAT');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadPolicies = async () => {
      setIsLoading(true);
      try {
        const data = await backend.fetchInsurancePolicies();
        setPolicies(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPolicies();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const newPolicy = await backend.saveInsurancePolicy('麻薯', file);
      setPolicies(prev => [newPolicy, ...prev]);
      setActiveTab('MY');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack} 
            className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white shadow-sm active:scale-90 transition-transform"
          >
            <ChevronLeft size={22} />
          </button>
          <h2 className="text-xl font-black text-gray-800 dark:text-white tracking-tight italic">
            寵物保險 <span className="text-indigo-500 text-sm not-italic">AI</span>
          </h2>
        </div>
        <button 
          onClick={triggerUpload}
          className="w-10 h-10 flex items-center justify-center bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none active:scale-90 transition-transform"
        >
          <Plus size={20} />
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Tab Switcher */}
        <div className="px-6 py-6">
          <div className="flex p-1 bg-gray-200 dark:bg-slate-800 rounded-[20px] border border-white/50 dark:border-white/5 shadow-inner">
            <button 
              onClick={() => setActiveTab('MY')}
              className={`flex-1 py-3 rounded-[16px] text-xs font-black transition-all ${activeTab === 'MY' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md scale-[1.02]' : 'text-gray-400'}`}
            >
              我的保單
            </button>
            <button 
              onClick={() => setActiveTab('CALC')}
              className={`flex-1 py-3 rounded-[16px] text-xs font-black transition-all ${activeTab === 'CALC' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md scale-[1.02]' : 'text-gray-400'}`}
            >
              保費測算
            </button>
          </div>
        </div>

        {activeTab === 'MY' ? (
          <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3 opacity-40">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
                <p className="text-xs font-black">正在讀取保障檔案...</p>
              </div>
            ) : policies.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-[32px] flex items-center justify-center text-indigo-300 mx-auto">
                  <ShieldCheck size={40} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-gray-500">尚無生效保單</p>
                  <p className="text-[10px] text-gray-400 font-bold">上傳保單照片，AI 將自動管理到期日</p>
                </div>
                <button 
                  onClick={triggerUpload}
                  className="px-8 py-3 bg-indigo-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-100"
                >
                  拍照上傳新保單
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {policies.map(policy => (
                  <div key={policy.id} className="glass rounded-[32px] p-5 border border-white/60 dark:border-white/5 shadow-sm space-y-4 relative overflow-hidden group active:scale-[0.98] transition-transform">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 -mr-8 -mt-8 rounded-full"></div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-100/50">
                          <FileText size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 dark:text-white text-sm">{policy.planName}</h4>
                          <p className="text-[10px] font-black text-indigo-500 tracking-widest uppercase">{policy.policyNumber}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full text-[9px] font-black flex items-center ${policy.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {policy.status === 'ACTIVE' ? <CheckCircle2 size={10} className="mr-1" /> : <AlertCircle size={10} className="mr-1" />}
                        {policy.status === 'ACTIVE' ? '保障中' : '已過期'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50 dark:border-white/5">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                          <Clock size={10} className="mr-1" /> 到期日
                        </p>
                        <p className="text-xs font-bold text-gray-700 dark:text-slate-200">{policy.expiryDate}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                          <HeartPulse size={10} className="mr-1" /> 被保寵物
                        </p>
                        <p className="text-xs font-bold text-gray-700 dark:text-slate-200">{policy.petName}</p>
                      </div>
                    </div>

                    <div className="pt-2">
                       <button className="w-full py-3 glass rounded-xl text-[10px] font-black text-gray-500 flex items-center justify-center space-x-2 border border-white/40 group-hover:bg-indigo-50 transition-colors">
                          <ImageIcon size={14} />
                          <span>查看保單原件</span>
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="glass bg-indigo-50/40 dark:bg-indigo-900/10 rounded-[40px] p-8 space-y-6 border border-white/60 dark:border-white/5 shadow-xl shadow-indigo-100/10 dark:shadow-none">
              <div className="flex p-1.5 glass bg-white/40 dark:bg-slate-800 rounded-2xl shadow-inner border border-white/20">
                <button 
                  onClick={() => setPetType('CAT')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${petType === 'CAT' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400'}`}
                >
                  貓咪
                </button>
                <button 
                  onClick={() => setPetType('DOG')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${petType === 'DOG' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400'}`}
                >
                  狗狗
                </button>
              </div>

              <div className="space-y-5">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-indigo-900 dark:text-indigo-400 opacity-60 tracking-widest uppercase">寵物年齡 (歲)</label>
                    <span className="text-xs font-black text-indigo-600">3 歲</span>
                  </div>
                  <input type="range" className="w-full accent-indigo-500 h-2 rounded-full" min="0" max="20" />
                  <div className="flex justify-between text-[10px] text-indigo-400 font-bold opacity-60">
                    <span>幼年</span>
                    <span>壯年</span>
                    <span>老年</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-[10px] font-black text-indigo-900 dark:text-indigo-400 opacity-60 tracking-widest uppercase px-1">品種遺傳病史</label>
                  <select className="bg-white/60 dark:bg-slate-800 border border-white dark:border-white/10 backdrop-blur-sm px-5 py-4 rounded-2xl text-sm font-bold focus:outline-none text-gray-700 dark:text-white appearance-none">
                    <option>折耳/短腿 (高風險)</option>
                    <option>田園犬/貓 (低風險)</option>
                    <option>純種賽級 (中風險)</option>
                  </select>
                </div>
              </div>

              <button className="w-full py-5 bg-indigo-500 text-white rounded-[28px] font-black shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center space-x-2 active:scale-[0.97] transition-transform">
                <Calculator size={20} />
                <span>開始 AI 智能測算</span>
              </button>
            </div>

            <div className="space-y-4 px-2">
              <h3 className="font-black text-gray-800 dark:text-white flex items-center text-base tracking-tight">
                <ShieldCheck size={20} className="mr-2 text-indigo-500" />
                為您推薦的保障
              </h3>
              
              <div className="glass rounded-[32px] p-6 shadow-sm relative overflow-hidden border border-white/60 dark:border-white/5 active:scale-95 transition-transform cursor-pointer group">
                <div className="absolute top-0 right-0 bg-rose-500 text-white px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-wider shadow-md">
                  熱門首選
                </div>
                <h4 className="font-black text-gray-900 dark:text-white text-md">全面醫療保障 A 款</h4>
                <p className="text-[10px] font-bold text-gray-400 mt-2">覆蓋骨折、手術、慢性病等 100+ 場景</p>
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">HK$ 19.9</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase">/月起</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Uploading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center space-y-6">
          <div className="relative">
             <div className="w-24 h-24 bg-indigo-500/10 rounded-[32px] flex items-center justify-center text-indigo-500 border border-indigo-100">
                <Loader2 className="animate-spin" size={40} />
             </div>
             <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center animate-bounce">
               <Sparkles size={16} />
             </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-black text-white">AI 正在識別保單內容...</p>
            <p className="text-xs text-white/50 font-bold uppercase tracking-widest italic">提取條款與到期提醒中</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceView;
