
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Package, Truck, MessageSquareText, RotateCcw, CreditCard, ChevronRight, Loader2, Star } from 'lucide-react';
import * as backend from '../backend';
import { Order, OrderStatus, View } from '../types';

interface OrdersViewProps {
  onBack: () => void;
  onNavigate: (view: View, data?: any) => void;
  initialTab?: string;
}

const OrdersView: React.FC<OrdersViewProps> = ({ onBack, onNavigate, initialTab = 'ALL' }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const tabs = [
    { id: 'ALL', label: '全部' },
    { id: 'PENDING_PAY', label: '待付款' },
    { id: 'PENDING_SHIP', label: '待發貨' },
    { id: 'PENDING_RECEIVE', label: '待收貨' },
    { id: 'REFUND', label: '退款/售後' },
    { id: 'PENDING_REVIEW', label: '評價' },
  ];

  useEffect(() => {
    setIsLoading(true);
    backend.fetchOrders(activeTab === 'ALL' ? undefined : activeTab as OrderStatus).then(data => {
      setOrders(data);
      setIsLoading(false);
    });
  }, [activeTab]);

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING_PAY': return { text: '待付款', color: 'text-orange-500' };
      case 'PENDING_SHIP': return { text: '待發貨', color: 'text-blue-500' };
      case 'PENDING_RECEIVE': return { text: '待收貨', color: 'text-emerald-500' };
      case 'PENDING_REVIEW': return { text: '評價', color: 'text-amber-500' };
      case 'REFUND': return { text: '退款中', color: 'text-rose-500' };
      default: return { text: '已完成', color: 'text-gray-400' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
        <div className="px-6 py-4 flex items-center space-x-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white">
            <ChevronLeft size={22} />
          </button>
          <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">我的訂單</h3>
        </div>
        
        {/* Non-scrollable Tabs */}
        <div className="flex w-full px-2 pb-2 justify-between">
           {tabs.map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex-1 px-1 py-2.5 text-[10px] font-black transition-all relative text-center whitespace-nowrap ${activeTab === tab.id ? 'text-orange-600' : 'text-gray-400'}`}
             >
               {tab.label}
               {activeTab === tab.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-orange-500 rounded-full" />}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-40">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={32} />
            <p className="text-xs font-black">正在同步訂單...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center space-y-4">
             <Package size={48} className="mx-auto text-gray-200" />
             <p className="text-xs font-black text-gray-400">尚無相關訂單記錄</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="glass bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-white/60 dark:border-white/5 shadow-sm space-y-5">
               <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-white/5">
                  <div className="flex items-center space-x-2">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">訂單號: {order.id}</span>
                  </div>
                  <span className={`text-[11px] font-black ${getStatusLabel(order.status).color}`}>
                    {getStatusLabel(order.status).text}
                  </span>
               </div>
               
               {order.items.map((item, idx) => (
                 <div key={idx} className="flex space-x-4">
                    <img src={item.imageUrl} className="w-16 h-16 rounded-xl object-cover" alt={item.name} />
                    <div className="flex-1 min-w-0 space-y-1">
                       <h4 className="text-[11px] font-black text-gray-800 dark:text-white line-clamp-2 leading-tight">{item.name}</h4>
                       <div className="flex justify-between items-center">
                          <p className="text-[10px] font-bold text-gray-400">數量: x{item.quantity}</p>
                          <p className="text-[11px] font-black text-gray-900 dark:text-white">HK$ {item.price}</p>
                       </div>
                    </div>
                 </div>
               ))}

               {order.trackingNumber && (
                 <div 
                   onClick={() => onNavigate(View.LOGISTICS, order)}
                   className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex items-center space-x-3 cursor-pointer active:scale-[0.98] transition-all"
                 >
                    <Truck size={16} className="text-emerald-500" />
                    <div className="flex-1 min-w-0">
                       <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">順豐速運已攬收</p>
                       <p className="text-[8px] text-gray-400 truncate">{order.trackingNumber}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300" />
                 </div>
               )}

               <div className="flex justify-between items-center pt-2">
                  <p className="text-[10px] font-bold text-gray-400">{order.date}</p>
                  <div className="flex items-baseline space-x-1">
                     <span className="text-[10px] font-black text-gray-400">總額:</span>
                     <span className="text-sm font-black text-gray-900 dark:text-white">HK$ {order.totalPrice.toFixed(1)}</span>
                  </div>
               </div>

               <div className="flex justify-end space-x-3 pt-2">
                  {order.status === 'PENDING_PAY' ? (
                    <button className="px-5 py-2 rounded-xl bg-orange-600 text-white text-[10px] font-black shadow-lg shadow-orange-600/20 active:scale-95 transition-transform">立即支付</button>
                  ) : order.status === 'PENDING_RECEIVE' ? (
                    <button className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform">確認收貨</button>
                  ) : order.status === 'PENDING_REVIEW' ? (
                    <button className="px-5 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-transform flex items-center space-x-1">
                      <Star size={10} fill="currentColor" />
                      <span>去評價</span>
                    </button>
                  ) : (
                    <button className="px-5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-[10px] font-black text-gray-500 active:scale-95 transition-transform">查看詳情</button>
                  )}
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersView;
