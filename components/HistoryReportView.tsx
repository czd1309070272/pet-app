
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Activity, Search, FileText, Calendar, Filter, Trash2, Maximize2, CheckCircle2, AlertCircle, Heart, User, Stars } from 'lucide-react';
import * as backend from '../backend';

type ReportType = 'HEALTH' | 'SCANNER' | 'TRANSLATOR';

interface ReportItem {
  id: string;
  date: string;
  thumbnail: string;
  title: string;
  summary: string;
  fullReport: string;
  petName: string; 
  status?: 'HEALTHY' | 'WARNING' | 'DANGER' | 'NORMAL';
}

interface HistoryReportViewProps {
  type: ReportType;
  onBack: () => void;
  pets: backend.PetProfile[];
}

const HistoryReportView: React.FC<HistoryReportViewProps> = ({ type, onBack, pets }) => {
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [filterPetName, setFilterPetName] = useState<string>('ALL');

  const getTitle = () => {
    switch(type) {
      case 'HEALTH': return '歷史健康檢測';
      case 'SCANNER': return '歷史成分分析';
      case 'TRANSLATOR': return '歷史報告翻譯官';
    }
  };

  const getIcon = (color: string) => {
    switch(type) {
      case 'HEALTH': return <Activity size={20} className={color} />;
      case 'SCANNER': return <Search size={20} className={color} />;
      case 'TRANSLATOR': return <FileText size={20} className={color} />;
    }
  };

  const mockData: ReportItem[] = [
    {
      id: '1',
      date: '2025-03-20 14:30',
      thumbnail: `https://picsum.photos/seed/${type}1/300/300`,
      petName: '麻薯',
      title: type === 'HEALTH' ? '糞便常規檢測' : type === 'SCANNER' ? '貓糧成分掃描' : '肝功能化驗單解讀',
      summary: type === 'HEALTH' ? '一切指標正常，繼續保持。' : type === 'SCANNER' ? '含肉量高，無有害添加。' : 'ALT 指標略高，建議清淡飲食。',
      status: type === 'HEALTH' ? 'HEALTHY' : 'NORMAL',
      fullReport: '根據 AI 深度分析：\n\n1. 視覺特徵：形態飽滿，顏色正常。\n2. 潛在風險：未發現明顯異常。\n3. 專家建議：最近氣候乾燥，可以適當增加飲水量，觀察 48 小時。'
    },
    {
      id: '2',
      date: '2025-03-15 09:15',
      thumbnail: `https://picsum.photos/seed/${type}2/300/300`,
      petName: '豆腐',
      title: type === 'HEALTH' ? '皮膚局部掃描' : type === 'SCANNER' ? '進口凍乾零食' : '血常規報告翻譯',
      summary: type === 'HEALTH' ? '發現真菌感染跡象，請及時處理。' : type === 'SCANNER' ? '發現潛在致敏原：大豆。' : '白血球升高，疑似炎症感染。',
      status: 'WARNING',
      fullReport: '詳細解讀結果：\n\n- 指標分析：數據顯示異常偏移，可能存在初期病理變化。\n- 健康警示：請密切注意寵物是否有瘙癢或精神不振等情況。\n- 醫囑翻譯：建議帶到線下診所進行更深入的臨床檢查，避免延誤病情。'
    },
    {
      id: '3',
      date: '2024-01-10 11:20',
      thumbnail: `https://picsum.photos/seed/${type}3/300/300`,
      petName: '糯米',
      title: type === 'HEALTH' ? '常規糞便檢查' : type === 'SCANNER' ? '老齡犬糧掃描' : '關節報告解讀',
      summary: '記錄已存入星空檔案。',
      status: 'NORMAL',
      fullReport: '這是糯米在去往星空前的健康記錄。所有數據已永久保存。'
    }
  ];

  const filteredData = filterPetName === 'ALL' 
    ? mockData 
    : mockData.filter(item => item.petName === filterPetName);

  const StatusBadge = ({ status }: { status?: string }) => {
    if (!status) return null;
    switch(status) {
      case 'HEALTHY': return <span className="flex items-center space-x-1 text-[9px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /><span>健康</span></span>;
      case 'WARNING': return <span className="flex items-center space-x-1 text-[9px] font-black text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full"><AlertCircle size={10} /><span>注意</span></span>;
      default: return <span className="flex items-center space-x-1 text-[9px] font-black text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full"><span>常規</span></span>;
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
        <button 
          onClick={selectedReport ? () => setSelectedReport(null) : onBack}
          className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white"
        >
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-lg font-black tracking-tight">{selectedReport ? '報告詳情' : getTitle()}</h2>
        <div className="w-10"></div>
      </div>

      {!selectedReport && (
        <div className="px-5 pt-4">
           <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setFilterPetName('ALL')}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${filterPetName === 'ALL' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}
              >
                全部
              </button>
              {pets.map(pet => (
                <button
                  key={pet.id}
                  onClick={() => setFilterPetName(pet.name)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center space-x-1.5 ${filterPetName === pet.name ? (pet.isMemorial ? 'bg-slate-800 text-amber-400 border border-amber-500/30 shadow-lg' : 'bg-orange-500 text-white shadow-md') : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}
                >
                  {pet.isMemorial && <Stars size={10} className="text-amber-500" />}
                  <span>{pet.name}{pet.isMemorial ? '·星空' : ''}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-10 scrollbar-hide">
        {!selectedReport ? (
          <div className="p-5 space-y-4">
            {filteredData.length === 0 ? (
               <div className="text-center py-20 opacity-30 font-black">
                 <p>尚無相關報告</p>
               </div>
            ) : (
              filteredData.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedReport(item)}
                  className="glass p-4 rounded-[32px] flex space-x-4 floating-btn border border-white/50 dark:border-white/5 shadow-sm active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl border-l border-b border-white/20 ${pets.find(p => p.name === item.petName)?.isMemorial ? 'bg-slate-800 text-amber-500' : 'bg-gray-50 dark:bg-slate-800 text-gray-500'}`}>
                     <span className="text-[9px] font-black">{item.petName}</span>
                  </div>
                  <div className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden shadow-inner bg-gray-100 dark:bg-slate-800 border border-gray-100 dark:border-white/5">
                    <img src={item.thumbnail} className={`w-full h-full object-cover ${pets.find(p => p.name === item.petName)?.isMemorial ? 'grayscale opacity-70' : ''}`} alt="Thumb" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-black text-sm text-gray-900 dark:text-white truncate pr-6">{item.title}</h3>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium line-clamp-1">{item.summary}</p>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                        <Calendar size={12} className="mr-1 opacity-50" />
                        {item.date}
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6">
              <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 group">
                <img src={selectedReport.thumbnail} className={`w-full h-full object-cover ${pets.find(p => p.name === selectedReport.petName)?.isMemorial ? 'grayscale brightness-75' : ''}`} alt="Full" />
                <div className="absolute top-6 left-6 glass px-4 py-2 rounded-2xl flex items-center space-x-2 border border-white/30 text-white font-black">
                   <User size={16} />
                   <span className="text-sm">{selectedReport.petName}</span>
                   {pets.find(p => p.name === selectedReport.petName)?.isMemorial && <Stars size={14} className="text-amber-400 ml-1" />}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
            </div>

            <div className="px-6 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-gray-100 dark:border-white/5 shadow-xl shadow-gray-100/30 dark:shadow-none space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-100 dark:shadow-none">
                      {getIcon('text-white')}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-gray-900 dark:text-white">{selectedReport.title}</h4>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{selectedReport.date}</p>
                    </div>
                  </div>
                  <StatusBadge status={selectedReport.status} />
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[32px] border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                      <Heart size={14} className="mr-1.5 text-rose-500" />
                      AI 深度分析報告
                    </p>
                    <div className="text-sm font-bold text-gray-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {selectedReport.fullReport}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                   <button className="flex items-center justify-center space-x-2 py-4 glass rounded-2xl font-black text-xs text-gray-500 floating-btn active:scale-95">
                      <Trash2 size={16} />
                      <span>刪除記錄</span>
                   </button>
                   <button className="flex items-center justify-center space-x-2 py-4 bg-orange-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-orange-100 floating-btn active:scale-95">
                      <ChevronRight size={18} />
                      <span>諮詢在線專家</span>
                   </button>
                </div>
              </div>
            </div>
            <div className="p-10 text-center space-y-2 opacity-30">
               <p className="text-[9px] font-black uppercase tracking-[0.2em]">AI 檢測結果僅供參考，不代表醫學診斷</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryReportView;
