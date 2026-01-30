
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Truck, Package, MapPin, CheckCircle2, Phone, ExternalLink, Loader2, Copy } from 'lucide-react';
import { Order, LogisticsStep } from '../types';

interface LogisticsViewProps {
  onBack: () => void;
  order: Order | null;
}

const LogisticsView: React.FC<LogisticsViewProps> = ({ onBack, order }) => {
  const [steps, setSteps] = useState<LogisticsStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulated logistics data
    const fetchLogistics = async () => {
      setIsLoading(true);
      await new Promise(res => setTimeout(res, 800));
      setSteps([
        { time: '2025-03-22 14:30', status: '運輸中', desc: '包裹已抵達 [香港中轉中心]，正在準備分揀', isCompleted: false },
        { time: '2025-03-22 10:15', status: '運輸中', desc: '包裹離開 [深圳集散中心]，發往 [香港]', isCompleted: false },
        { time: '2025-03-21 18:45', status: '已攬收', desc: '順豐速運 已攬收成功', isCompleted: true },
        { time: '2025-03-21 15:20', status: '已出庫', desc: '倉庫已完成打包並等待快遞取件', isCompleted: true },
        { time: '2025-03-21 11:30', status: '已下單', desc: '訂單確認，倉庫正在備貨中', isCompleted: true },
      ]);
      setIsLoading(false);
    };
    fetchLogistics();
  }, [order]);

  if (!order) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
        <div className="px-6 py-4 flex items-center space-x-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white shadow-sm active:scale-90 transition-transform">
            <ChevronLeft size={22} />
          </button>
          <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">物流詳情</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
        {/* Order Info Card */}
        <div className="glass bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-white/60 dark:border-white/5 shadow-sm space-y-4">
           <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shrink-0">
                 <img src={order.items[0].imageUrl} className="w-full h-full object-cover" alt="item" />
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex items-center space-x-2 text-[10px] font-black text-emerald-600 uppercase tracking-tighter mb-1">
                    <Truck size={12} />
                    <span>順豐速運 : {order.status === 'PENDING_RECEIVE' ? '配送中' : '已攬收'}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-gray-800 dark:text-white truncate">運單號: {order.trackingNumber}</p>
                    <button className="text-[10px] font-black text-orange-500 flex items-center space-x-1 ml-2">
                       <Copy size={12} />
                       <span>複製</span>
                    </button>
                 </div>
              </div>
           </div>
           
           <div className="flex space-x-2 pt-2 border-t border-gray-50 dark:border-white/5">
              <button className="flex-1 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-[10px] font-black text-gray-500 flex items-center justify-center space-x-2">
                 <Phone size={14} />
                 <span>聯繫快遞員</span>
              </button>
              <button className="flex-1 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-[10px] font-black text-gray-500 flex items-center justify-center space-x-2">
                 <ExternalLink size={14} />
                 <span>查看官網</span>
              </button>
           </div>
        </div>

        {/* Delivery Address Card */}
        <div className="glass bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-white/60 dark:border-white/5 shadow-sm">
           <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                 <MapPin size={20} />
              </div>
              <div className="flex-1 min-w-0">
                 <h4 className="text-xs font-black text-gray-800 dark:text-white mb-1">收貨地址</h4>
                 <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 leading-relaxed">
                   陳大萌 · 138****8888<br />
                   香港特別行政區 中西區 中環康樂廣場8號 交易廣場 1座
                 </p>
              </div>
           </div>
        </div>

        {/* Timeline Section */}
        <div className="glass bg-white dark:bg-slate-900 p-6 rounded-[40px] border border-white/60 dark:border-white/5 shadow-sm space-y-6">
           <h4 className="text-sm font-black text-gray-800 dark:text-white flex items-center space-x-2">
              <Package size={18} className="text-orange-500" />
              <span>包裹蹤跡</span>
           </h4>

           {isLoading ? (
             <div className="py-12 flex flex-col items-center justify-center opacity-40">
                <Loader2 className="animate-spin text-orange-500 mb-2" size={24} />
                <p className="text-[10px] font-black">正在獲取實時動態...</p>
             </div>
           ) : (
             <div className="space-y-0 pl-1">
               {steps.map((step, idx) => (
                 <div key={idx} className="relative pl-8 pb-8 last:pb-2">
                   {/* Timeline Line */}
                   {idx !== steps.length - 1 && (
                     <div className="absolute left-[11px] top-[24px] bottom-0 w-[2px] bg-gray-100 dark:bg-slate-800"></div>
                   )}
                   
                   {/* Node Circle */}
                   <div className={`absolute left-0 top-[2px] w-6 h-6 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 z-10 ${idx === 0 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}>
                      {idx === 0 ? (
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      ) : step.isCompleted ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <div className="w-1.5 h-1.5 bg-current rounded-full opacity-30"></div>
                      )}
                   </div>

                   {/* Content */}
                   <div className="space-y-1">
                      <div className="flex justify-between items-center">
                         <h5 className={`text-xs font-black ${idx === 0 ? 'text-orange-600' : 'text-gray-800 dark:text-white'}`}>{step.status}</h5>
                         <span className="text-[9px] font-bold text-gray-400">{step.time}</span>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${idx === 0 ? 'font-bold text-gray-700 dark:text-slate-200' : 'text-gray-400 dark:text-gray-500'}`}>
                         {step.desc}
                      </p>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* Footer Disclaimer */}
        <div className="text-center py-6 opacity-20">
           <p className="text-[8px] font-black uppercase tracking-[0.2em] italic">Logistics information is synchronized from SF Express real-time data API</p>
        </div>
      </div>
    </div>
  );
};

export default LogisticsView;
