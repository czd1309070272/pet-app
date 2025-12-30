
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Trash2, Plus, Minus, CheckCircle, Loader2, ShoppingBag, ArrowRight, ShieldCheck, CreditCard, Apple, Chrome, XCircle, CheckCircle2 } from 'lucide-react';
import * as backend from '../backend';
import { CartItem, View } from '../types';

interface CartViewProps {
  onBack: () => void;
  onNavigate: (view: View, data?: any) => void;
}

type PaymentStatus = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

const CartView: React.FC<CartViewProps> = ({ onBack, onNavigate }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 支付流相关状态
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('IDLE');
  const [selectedMethod, setSelectedMethod] = useState<'APPLE' | 'GOOGLE' | 'CARD'>('APPLE');

  useEffect(() => {
    backend.fetchCart().then(data => {
      setItems(data);
      setIsLoading(false);
    });
  }, []);

  const updateQuantity = async (id: string, delta: number) => {
    const newItems = [...items];
    const item = newItems.find(i => i.id === id);
    if (item) {
      item.quantity = Math.max(1, item.quantity + delta);
      setItems(newItems);
      await backend.updateCartItem(id, { quantity: item.quantity });
    }
  };

  const toggleSelect = async (id: string) => {
    const newItems = [...items];
    const item = newItems.find(i => i.id === id);
    if (item) {
      item.selected = !item.selected;
      setItems(newItems);
      await backend.updateCartItem(id, { selected: item.selected });
    }
  };

  const removeItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await backend.removeFromCart(id);
  };

  const totalPrice = useMemo(() => {
    return items.filter(i => i.selected).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

  const selectedCount = useMemo(() => items.filter(i => i.selected).length, [items]);

  const handleStartCheckout = () => {
    if (selectedCount === 0) return;
    setShowCheckout(true);
  };

  const handleConfirmPayment = async () => {
    setPaymentStatus('PROCESSING');
    
    // 模拟网络支付延迟
    await new Promise(res => setTimeout(res, 2000));
    
    // 模拟成功 (90% 概率成功)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      setPaymentStatus('SUCCESS');
      const selectedItems = items.filter(i => i.selected);
      // 创建待发货订单
      await backend.createOrderFromCart(selectedItems, 'PENDING_SHIP');
      // 清空购物车选中项
      await backend.clearSelectedCartItems();
      
      // 成功后自动跳转到订单页
      setTimeout(() => {
        setShowCheckout(false);
        onNavigate(View.ORDERS, 'PENDING_SHIP');
      }, 1500);
    } else {
      setPaymentStatus('FAILED');
      const selectedItems = items.filter(i => i.selected);
      // 创建待付款订单
      await backend.createOrderFromCart(selectedItems, 'PENDING_PAY');
      // 失败后不自动清空购物车，让用户重试或在订单中心付
    }
  };

  const methods = [
    { id: 'APPLE', label: 'Apple Pay', icon: <Apple size={20} /> },
    { id: 'GOOGLE', label: 'Google Pay', icon: <Chrome size={20} /> },
    { id: 'CARD', label: 'Credit Card', icon: <CreditCard size={20} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white shadow-sm active:scale-90 transition-transform">
            <ChevronLeft size={22} />
          </button>
          <div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">我的購物籃</h3>
            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">共 {items.length} 件商品</p>
          </div>
        </div>
        <button 
          onClick={() => {
            const allSelected = items.every(i => i.selected);
            setItems(items.map(i => ({ ...i, selected: !allSelected })));
          }} 
          className="text-[10px] font-black text-gray-400 uppercase tracking-widest"
        >
          全選/取消
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-40">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={32} />
            <p className="text-xs font-black">正在整理您的購物籃...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-32 text-center space-y-6">
            <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 rounded-[32px] flex items-center justify-center text-orange-300 mx-auto">
              <ShoppingBag size={40} />
            </div>
            <p className="text-sm font-black text-gray-400">購物籃還是空的喔</p>
            <button onClick={() => onNavigate(View.DISCOVERY)} className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-black text-xs">去逛逛</button>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="glass bg-white dark:bg-slate-900 p-4 rounded-[32px] border border-white/60 dark:border-white/5 shadow-sm flex items-center space-x-4">
               <button 
                 onClick={() => toggleSelect(item.id)}
                 className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${item.selected ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'border-gray-200 dark:border-slate-700'}`}
               >
                 {item.selected && <CheckCircle size={14} />}
               </button>
               
               <img src={item.imageUrl} className="w-20 h-20 rounded-2xl object-cover border border-slate-100" alt={item.name} />
               
               <div className="flex-1 min-w-0 space-y-2">
                 <h4 className="text-xs font-black text-gray-800 dark:text-white line-clamp-1">{item.name}</h4>
                 <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-orange-600">HK$ {item.price}</p>
                    <div className="flex items-center bg-gray-50 dark:bg-slate-800 rounded-xl px-2 py-1 border border-gray-100 dark:border-white/5">
                       <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-gray-400"><Minus size={14} /></button>
                       <span className="mx-3 text-xs font-black text-gray-700 dark:text-white">{item.quantity}</span>
                       <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-400"><Plus size={14} /></button>
                    </div>
                 </div>
               </div>
               
               <button onClick={() => removeItem(item.id)} className="p-2 text-rose-300 hover:text-rose-500">
                  <Trash2 size={16} />
               </button>
            </div>
          ))
        )}
      </div>

      {/* Footer Checkout Trigger */}
      {items.length > 0 && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 p-6 safe-bottom">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                 <span className="text-xs font-bold text-gray-400">已選 {selectedCount} 件</span>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total HK$</p>
                 <p className="text-2xl font-black text-orange-600 tracking-tighter">{totalPrice.toFixed(1)}</p>
              </div>
           </div>
           
           <button 
             onClick={handleStartCheckout}
             disabled={selectedCount === 0}
             className="w-full bg-orange-600 text-white py-4 rounded-[24px] font-black text-sm shadow-xl shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
           >
             <span>立即結賬 ({selectedCount})</span>
             <ArrowRight size={18} />
           </button>
        </div>
      )}

      {/* 沉浸式收银台弹出层 */}
      {showCheckout && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => paymentStatus === 'IDLE' && setShowCheckout(false)} />
          
          <div className="relative w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-t-[48px] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom-10 space-y-8">
            
            {/* 支付状态展示区 */}
            {paymentStatus === 'IDLE' ? (
              <>
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-xl font-black text-gray-800 dark:text-white">PawPal 結賬收銀台</h4>
                  <button onClick={() => setShowCheckout(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><XCircle size={24} /></button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[32px] border border-gray-100 dark:border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-gray-400 text-xs font-black uppercase tracking-widest">
                    <span>支付金額</span>
                    <span>訂單合計</span>
                  </div>
                  <div className="flex items-baseline space-x-1 text-orange-600">
                    <span className="text-lg font-black tracking-tighter">HK$</span>
                    <span className="text-4xl font-black tracking-tighter leading-none">{totalPrice.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-2 text-[10px] text-emerald-600 font-black uppercase">
                     <ShieldCheck size={14} />
                     <span>銀行級安全加密支付協議</span>
                  </div>
                </div>

                <div className="space-y-3 px-1">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">選擇支付方式</p>
                   {methods.map(m => (
                     <button 
                       key={m.id}
                       onClick={() => setSelectedMethod(m.id as any)}
                       className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedMethod === m.id ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10' : 'border-gray-50 dark:border-white/5 bg-gray-50 dark:bg-slate-800/50'}`}
                     >
                       <div className="flex items-center space-x-3">
                         <div className={`p-2 rounded-xl ${selectedMethod === m.id ? 'bg-orange-500 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-gray-400'}`}>
                           {m.icon}
                         </div>
                         <span className={`font-black text-sm ${selectedMethod === m.id ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>{m.label}</span>
                       </div>
                       {selectedMethod === m.id && <CheckCircle2 size={20} className="text-orange-500" />}
                     </button>
                   ))}
                </div>

                <button 
                  onClick={handleConfirmPayment}
                  className="w-full h-16 bg-slate-900 dark:bg-orange-600 text-white rounded-[24px] font-black text-base shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-3"
                >
                  <CreditCard size={20} />
                  <span>確認支付 HK$ {totalPrice.toFixed(1)}</span>
                </button>
              </>
            ) : paymentStatus === 'PROCESSING' ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-6">
                 <div className="relative">
                    <div className="w-20 h-20 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-orange-500">
                       <ShieldCheck size={32} />
                    </div>
                 </div>
                 <div className="text-center space-y-2">
                    <h4 className="text-lg font-black text-gray-800 dark:text-white">正在處理支付請求</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">正在驗證銀行網關數據，請勿關閉...</p>
                 </div>
              </div>
            ) : paymentStatus === 'SUCCESS' ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-6 animate-in zoom-in duration-500">
                 <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-200 animate-bounce">
                    <CheckCircle2 size={40} />
                 </div>
                 <div className="text-center space-y-2">
                    <h4 className="text-xl font-black text-emerald-600">支付成功！</h4>
                    <p className="text-sm text-gray-500 font-bold leading-relaxed">
                      訂單已生效，我們將儘快為您發貨<br />
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest">即將進入訂單中心...</span>
                    </p>
                 </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center space-y-6 animate-in zoom-in duration-500">
                 <div className="w-20 h-20 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-rose-200">
                    <XCircle size={40} />
                 </div>
                 <div className="text-center space-y-2">
                    <h4 className="text-xl font-black text-rose-600">支付未完成</h4>
                    <p className="text-sm text-gray-500 font-bold leading-relaxed">
                      餘額不足或網絡超時<br />
                      該訂單已保存至「待付款」列表
                    </p>
                 </div>
                 <div className="flex space-x-3 w-full pt-4">
                    <button 
                      onClick={() => setPaymentStatus('IDLE')}
                      className="flex-1 py-4 glass text-gray-500 rounded-2xl font-black text-xs"
                    >
                      重新支付
                    </button>
                    <button 
                      onClick={() => { setShowCheckout(false); onNavigate(View.ORDERS, 'PENDING_PAY'); }}
                      className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs"
                    >
                      查看訂單
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartView;
