
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Activity, Search, FileText, Calendar, Filter, Trash2, Maximize2, CheckCircle2, AlertCircle, Heart, User, Stars, AlertTriangle, X, XCircle, CheckCircle } from 'lucide-react';
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
  // 新增成分分析字段
  riskIngredients?: string[];
  safeIngredients?: string[];
}

interface HistoryReportViewProps {
  type: ReportType;
  onBack: () => void;
  pets: backend.PetProfile[];
}

const HistoryReportView: React.FC<HistoryReportViewProps> = ({ type, onBack, pets }) => {
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [filterPetName, setFilterPetName] = useState<string>('ALL');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // 更新 mock 數據以包含成分列表
  const [reports, setReports] = useState<ReportItem[]>([
    {
      id: '1',
      date: '2025-03-20 14:30',
      thumbnail: `https://picsum.photos/seed/${type}1/300/300`,
      petName: '麻薯',
      title: type === 'HEALTH' ? '糞便常規檢測' : type === 'SCANNER' ? '貓糧成分掃描' : '肝功能化驗單解讀',
      summary: type === 'HEALTH' ? '一切指標正常，繼續保持。' : type === 'SCANNER' ? '含肉量高，無有害添加。' : 'ALT 指標略高，建議清淡飲食。',
      status: type === 'HEALTH' ? 'HEALTHY' : 'NORMAL',
      fullReport: '根據 AI 深度分析：\n\n1. 視覺特徵：形態飽滿，顏色正常。\n2. 潛在風險：未發現明顯異常。\n3. 專家建議：最近氣候乾燥，可以適當增加飲水量，觀察 48 小時。',
      riskIngredients: type === 'SCANNER' ? ['不明來源動物油脂', '人造誘食劑'] : undefined,
      safeIngredients: type === 'SCANNER' ? ['新鮮雞肉 (40%)', '脫水三文魚', '豌豆纖維', '益生菌', '牛磺酸'] : undefined
    },
    {
      id: '2',
      date: '2025-03-15 09:15',
      thumbnail: `https://picsum.photos/seed/${type}2/300/300`,
      petName: '豆腐',
      title: type === 'HEALTH' ? '皮膚局部掃描' : type === 'SCANNER' ? '進口凍乾零食' : '血常規報告翻譯',
      summary: type === 'HEALTH' ? '發現真菌感染跡象，請及時處理。' : type === 'SCANNER' ? '發現潛在致敏原：大豆。' : '白血球升高，疑似炎症感染。',
      status: 'WARNING',
      fullReport: '詳細解讀結果：\n\n- 指標分析：數據顯示異常偏移，可能存在初期病理變化。\n- 健康警示：請密切注意寵物是否有瘙癢或精神不振等情況。\n- 醫囑翻譯：建議帶到線下診所進行更深入的臨床檢查，避免延誤病情。',
      riskIngredients: type === 'SCANNER' ? ['大豆蛋白', '山梨酸鉀 (防腐劑)'] : undefined,
      safeIngredients: type === 'SCANNER' ? ['純牛肉凍乾', '牛心', '牛肝'] : undefined
    },
    {
      id: '3',
      date: '2024-01-10 11:20',
      thumbnail: `https://picsum.photos/seed/${type}3/300/300`,
      petName: '糯米',
      title: type === 'HEALTH' ? '常規糞便檢查' : type === 'SCANNER' ? '老齡犬糧掃描' : '關節報告解讀',
      summary: '記錄已存入星空檔案。',
      status: 'NORMAL',
      fullReport: '這是糯米在去往星空前的健康記錄。所有數據已永久保存。',
      riskIngredients: type === 'SCANNER' ? [] : undefined,
      safeIngredients: type === 'SCANNER' ? ['雞肉', '糙米'] : undefined
    }
  ]);

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

  const executeDelete = async (id: string) => {
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setReports(prev => prev.filter(r => r.id !== id));
    setSelectedReport(null);
    setShowDeleteConfirm(false);
    setIsDeleting(false);
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

  const filteredData = (type === 'SCANNER' || filterPetName === 'ALL')
    ? reports 
    : reports.filter(item => item.petName === filterPetName);

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
          onClick={selectedReport ? () => { setSelectedReport(null); setShowDeleteConfirm(false); } : onBack}
          className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white shadow-sm active:scale-90"
        >
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-lg font-black tracking-tight">{selectedReport ? '報告詳情' : getTitle()}</h2>
        <div className="w-10"></div>
      </div>

      {!selectedReport && type !== 'SCANNER' && (
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
                  <span>{pet.name}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-10 scrollbar-hide">
        {!selectedReport ? (
          <div className="p-5 space-y-4">
            {filteredData.length === 0 ? (
               <div className="text-center py-24 flex flex-col items-center justify-center space-y-4 opacity-20">
                 <FileText size={64} strokeWidth={1} />
                 <p className="font-black text-sm">尚無相關歷史記錄</p>
               </div>
            ) : (
              filteredData.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedReport(item)}
                  className="glass p-4 rounded-[32px] flex space-x-4 border border-white/50 dark:border-white/5 shadow-sm active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-gray-100">
                    <img src={item.thumbnail} className="w-full h-full object-cover" alt="Thumb" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-black text-sm text-gray-900 dark:text-white truncate">{item.title}</h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">{item.summary}</p>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center text-[10px] text-gray-400 font-bold">
                        <Calendar size={12} className="mr-1" />
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
          <div className="animate-in fade-in zoom-in-95 duration-300 px-6 py-6 space-y-6">
            <div className="relative aspect-[16/9] rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5">
              <img src={selectedReport.thumbnail} className="w-full h-full object-cover opacity-80" alt="Full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              <div className="absolute bottom-4 left-6">
                 <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <User size={14} className="text-white" />
                    </div>
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">{selectedReport.petName} 的歷史報告</span>
                 </div>
              </div>
            </div>

            {/* 如果是成分分析類型，顯示紅綠榜樣式 */}
            {type === 'SCANNER' ? (
              <div className="space-y-5">
                {/* Summary Block */}
                <div className="glass p-6 rounded-[32px] border border-white/60">
                   <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">AI 專家評測結論</h4>
                   <p className="text-sm font-bold text-gray-700 dark:text-slate-200 leading-relaxed italic">「{selectedReport.summary}」</p>
                </div>

                {/* Risk Ingredients (Red List) */}
                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-500/20 rounded-[32px] p-6 space-y-4">
                   <div className="flex items-center justify-between">
                     <h4 className="font-black text-rose-700 dark:text-rose-400 flex items-center text-sm">
                       <XCircle size={18} className="mr-2" />
                       成分紅榜（不建議/有風險）
                     </h4>
                     <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-md">{(selectedReport.riskIngredients || []).length} 項</span>
                   </div>
                   {(selectedReport.riskIngredients || []).length > 0 ? (
                     <div className="flex flex-wrap gap-2">
                        {(selectedReport.riskIngredients || []).map(item => (
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
                     <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-md">{(selectedReport.safeIngredients || []).length} 項</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {(selectedReport.safeIngredients || []).map(item => (
                       <span key={item} className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl text-[10px] font-black text-emerald-600 shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                         {item}
                       </span>
                     ))}
                   </div>
                </div>
              </div>
            ) : (
              /* 其他類型的常規詳情 */
              <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-gray-100 dark:border-white/5 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-orange-500 text-white rounded-2xl">
                      {getIcon('text-white')}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-gray-900 dark:text-white">{selectedReport.title}</h4>
                      <p className="text-[10px] text-gray-400 font-black">{selectedReport.date}</p>
                    </div>
                  </div>
                  <StatusBadge status={selectedReport.status} />
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[32px] border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-3 flex items-center">
                    <Heart size={14} className="mr-1.5 text-rose-500" />
                    AI 深度分析報告
                  </p>
                  <div className="text-sm font-bold text-gray-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedReport.fullReport}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-gray-100 dark:border-white/5 shadow-xl">
              <div className="grid grid-cols-2 gap-3 relative">
                 <button 
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center space-x-2 py-4 glass rounded-2xl font-black text-xs text-rose-500 active:scale-95 transition-all hover:bg-rose-50"
                 >
                    <Trash2 size={16} />
                    <span>刪除記錄</span>
                 </button>
                 <button 
                  disabled={isDeleting}
                  className="flex items-center justify-center space-x-2 py-4 bg-orange-500 text-white rounded-2xl font-black text-xs shadow-lg active:scale-95"
                 >
                    <ChevronRight size={18} />
                    <span>諮詢專家</span>
                 </button>

                 {showDeleteConfirm && (
                   <div className="absolute inset-x-0 bottom-0 z-50 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-2xl border border-rose-100 flex flex-col space-y-3 animate-in slide-in-from-bottom-2">
                      <div className="flex items-center space-x-2 text-rose-600">
                         <AlertTriangle size={16} />
                         <span className="text-[10px] font-black uppercase">確定要永久刪除嗎？</span>
                      </div>
                      <div className="flex space-x-2">
                         <button 
                          onClick={() => executeDelete(selectedReport.id)}
                          disabled={isDeleting}
                          className="flex-1 bg-rose-500 text-white py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center space-x-2"
                         >
                           {isDeleting ? <Loader2 className="animate-spin" size={14} /> : <span>確認刪除</span>}
                         </button>
                         <button 
                          disabled={isDeleting}
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 bg-gray-100 text-gray-500 py-2.5 rounded-xl text-[10px] font-black"
                         >
                           取消
                         </button>
                      </div>
                   </div>
                 )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Loader2 = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

export default HistoryReportView;
