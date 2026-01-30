import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  Package,
  Truck,
  ChevronRight,
  Loader2,
  Star,
  XCircle,
  MapPin,
  PlusCircle,
  CheckCircle2,
  Plus,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import * as backend from '../backend';
import { Order, OrderStatus, url_base, View } from '../types';

// 假设支付方式
const PAYMENT_METHODS = [
  { id: 'ALIPAY', label: '支付寶', icon: <CreditCard size={16} /> },
  { id: 'WECHAT', label: '微信支付', icon: <CreditCard size={16} /> },
  { id: 'CARD', label: '信用卡', icon: <CreditCard size={16} /> },
];

interface OrdersViewProps {
  onBack: () => void;
  onNavigate: (view: View, data?: any) => void;
  initialTab?: string;
}

const OrdersView: React.FC<OrdersViewProps> = ({
  onBack,
  onNavigate,
  initialTab = 'ALL',
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // === 收银台状态 ===
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALIPAY');

  // 地址相关（简化：假设从全局获取或 mock）
  const [addresses, setAddresses] = useState<any[]>([]); // 你可以从 context 或 API 获取
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  // 替换你原有的 useEffect（地址加载逻辑）
  useEffect(() => {
    if (showCheckout && checkoutOrder) {
      const loadAddresses = async () => {
        try {
          const saved = await backend.fetchAddresses();
          setAddresses(saved);
          // 根据 checkoutOrder.addressId 匹配地址
          if (checkoutOrder.addressId) {
            const matchedAddress = saved.find(addr => addr.id === checkoutOrder.addressId);
            if (matchedAddress) {
              setSelectedAddress(matchedAddress);
              return;
            }
          }

          // 如果没匹配到，且有地址列表，则默认选第一个
          if (saved.length > 0) {
            setSelectedAddress(saved[0]);
          } else {
            // 没有地址：保持 selectedAddress 为 null
            setSelectedAddress(null);
          }
        } catch (error) {
          console.error('加载地址失败:', error);
          setAddresses([]);
          setSelectedAddress(null);
        }
      };

      loadAddresses();
    } else {
      // 可选：关闭收银台时重置地址状态（避免残留）
      // 注意：不要在这里 reset selectedAddress，因为用户可能刚选完就关了
    }
  }, [showCheckout, checkoutOrder]); // ✅ 关键：依赖 checkoutOrder，不是 selectedAddress

  const tabs = [
    { id: 'ALL', label: '全部' },
    { id: 'PENDING_PAY', label: '待付款' },
    { id: 'PENDING_SHIP', label: '待發貨' },
    { id: 'PENDING_RECEIVE', label: '待收貨' },
    { id: 'REFUND', label: '退款/售後' },
    { id: 'PENDING_REVIEW', label: '評價' },
  ];

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isPendingOrderValid = (orderDate: string): boolean => {
    const orderTime = new Date(orderDate).getTime();
    const now = Date.now();
    const diffMinutes = (now - orderTime) / (1000 * 60);
    return diffMinutes <= 15;
  };

  const getOrderDisplayInfo = (order: Order) => {
    if (order.status === 'PENDING_PAY') {
      const isValid = isPendingOrderValid(order.date);
      if (!isValid) {
        return {
          statusText: '已过期',
          statusColor: 'text-gray-400',
          showPayButton: false,
        };
      }
      return {
        statusText: '待付款',
        statusColor: 'text-orange-500',
        showPayButton: true,
      };
    }

    const label = getStatusLabel(order.status);
    return {
      statusText: label.text,
      statusColor: label.color,
      showPayButton: false,
    };
  };

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

  const loadFirstPage = useCallback(() => {
    setPage(1);
    setOrders([]);
    setHasMore(true);
    loadOrders(1);
  }, [activeTab]);

  const loadOrders = useCallback(async (pageNum: number) => {
    const controller = new AbortController();
    setIsLoading(true);

    try {
      const data = await backend.fetchOrders(
        activeTab === 'ALL' ? 'ALL' : (activeTab as OrderStatus),
        pageNum,
        10,
        controller.signal
      );

      if (pageNum === 1) {
        setOrders(data);
      } else {
        setOrders((prev) => [...prev, ...data]);
      }

      setHasMore(data.length === 10);
      setPage(pageNum);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('加载失败', err);
      }
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, [activeTab]);

  useEffect(() => {
    loadFirstPage();
  }, [activeTab]);

  // 自动刷新过期状态
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders((prev) => [...prev]);
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  // 处理支付确认
  const handleConfirmPayment = async () => {
    if (!checkoutOrder || !selectedAddress) {
      alert('請選擇收貨地址');
      return;
    }

    setPaymentStatus('PROCESSING');

    try {
      // 模拟支付请求
      await new Promise(resolve => setTimeout(resolve, 2000));
      // 实际调用：await backend.payOrder(checkoutOrder.id, selectedMethod, selectedAddress.id);

      setPaymentStatus('SUCCESS');

      // 更新本地订单状态（可选）
      setOrders(prev =>
        prev.map(o => o.id === checkoutOrder.id ? { ...o, status: 'PENDING_SHIP' } : o)
      );

      // 2秒后自动关闭
      setTimeout(() => {
        setShowCheckout(false);
        setPaymentStatus('IDLE');
      }, 2000);
    } catch (err) {
      setPaymentStatus('FAILED');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
        <div className="px-6 py-4 flex items-center space-x-4">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white"
          >
            <ChevronLeft size={22} />
          </button>
          <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">
            我的訂單
          </h3>
        </div>

        <div className="flex w-full px-2 pb-2 justify-between">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-1 py-2.5 text-[10px] font-black transition-all relative text-center whitespace-nowrap ${activeTab === tab.id ? 'text-orange-600' : 'text-gray-400'
                }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-orange-500 rounded-full" />
              )}
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
          orders.map((order) => {
            const displayInfo = getOrderDisplayInfo(order);
            return (
              <div
                key={order.id}
                className="glass bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-white/60 dark:border-white/5 shadow-sm space-y-5"
              >
                <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-white/5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    訂單號: {order.id}
                  </span>
                  <span className={`text-[11px] font-black ${displayInfo.statusColor}`}>
                    {displayInfo.statusText}
                  </span>
                </div>

                {order.items.map((item, idx) => (
                  <div key={idx} className="flex space-x-4">
                    <img
                      src={`${url_base}${item.imageUrl}`}
                      className="w-16 h-16 rounded-xl object-cover"
                      alt={item.name}
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-[11px] font-black text-gray-800 dark:text-white line-clamp-2 leading-tight">
                        {item.name}
                      </h4>
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
                  {order.status === 'PENDING_PAY' && displayInfo.showPayButton ? (
                    <button
                      className="px-5 py-2 rounded-xl bg-orange-600 text-white text-[10px] font-black shadow-lg shadow-orange-600/20 active:scale-95 transition-transform"
                      onClick={() => {
                        setCheckoutOrder(order);
                        setShowCheckout(true);
                        setPaymentStatus('IDLE');
                      }}
                    >
                      立即支付
                    </button>
                  ) : order.status === 'PENDING_PAY' && !displayInfo.showPayButton ? (
                    <button
                      disabled
                      className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-400 text-[10px] font-black cursor-not-allowed"
                    >
                      已過期
                    </button>
                  ) : order.status === 'PENDING_RECEIVE' ? (
                    <button className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform">
                      確認收貨
                    </button>
                  ) : order.status === 'PENDING_REVIEW' ? (
                    <button className="px-5 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-transform flex items-center space-x-1">
                      <Star size={10} fill="currentColor" />
                      <span>去評價</span>
                    </button>
                  ) : (
                    <button className="px-5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-[10px] font-black text-gray-500 active:scale-95 transition-transform">
                      查看詳情
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ✅ 沉浸式收银台弹出层 —— 集成在这里 */}
      {showCheckout && checkoutOrder && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => paymentStatus === 'IDLE' && setShowCheckout(false)}
          />

          <div className="relative w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-t-[48px] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom-10 space-y-6 max-h-[95vh] overflow-y-auto scrollbar-hide">
            {paymentStatus === 'IDLE' ? (
              <>
                <div className="flex justify-between items-center px-4">
                  <h4 className="text-xl font-black text-gray-800 dark:text-white">
                    PawPal 結賬收銀台
                  </h4>
                  <button
                    onClick={() => {
                      setShowCheckout(false);
                      setShowAddressPicker(false);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle size={24} />
                  </button>
                </div>

                {/* 地址選擇模塊 */}
                <div className="px-1">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[32px] border border-gray-100 dark:border-white/5 space-y-3 relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                        <MapPin size={12} className="mr-1 text-orange-500" />
                        收貨地址
                      </span>
                      <button
                        onClick={() => setShowAddressPicker(!showAddressPicker)}
                        className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100"
                      >
                        {showAddressPicker ? '取消切換' : selectedAddress ? '修改' : '去添加'}
                      </button>
                    </div>

                    {!showAddressPicker ? (
                      selectedAddress ? (
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-gray-800 dark:text-white">
                                {selectedAddress.receiverName}
                              </span>
                              <span className="text-xs font-bold text-gray-400">
                                {selectedAddress.phone}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-1">
                              {selectedAddress.area} {selectedAddress.detail}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => onNavigate(View.ADDRESS)}
                          className="w-full py-4 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl space-y-2 active:scale-95 transition-all"
                        >
                          <PlusCircle size={24} />
                          <span className="text-xs font-black">點擊添加收貨地址</span>
                        </button>
                      )
                    ) : (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        {addresses.length === 0 ? (
                          <p className="text-center py-4 text-xs font-bold text-gray-400 italic">
                            尚未保存地址，請前往管理頁面添加
                          </p>
                        ) : (
                          addresses.map((addr) => (
                            <button
                              key={addr.id}
                              onClick={() => {
                                setSelectedAddress(addr);
                                setShowAddressPicker(false);
                              }}
                              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${selectedAddress?.id === addr.id
                                ? 'border-orange-500 bg-white dark:bg-slate-800 shadow-md'
                                : 'border-transparent bg-gray-100/50 dark:bg-slate-900/50'
                                }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-black text-xs text-gray-800 dark:text-white">
                                  {addr.receiverName} · {addr.phone}
                                </span>
                                {selectedAddress?.id === addr.id && (
                                  <CheckCircle2 size={16} className="text-orange-500" />
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 font-bold truncate">
                                {addr.area} {addr.detail}
                              </p>
                            </button>
                          ))
                        )}
                        <button
                          onClick={() => onNavigate(View.ADDRESS)}
                          className="w-full py-3 flex items-center justify-center space-x-2 text-xs font-black text-blue-500 bg-blue-50 rounded-xl"
                        >
                          <Plus size={14} />
                          <span>管理我的地址</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 金额展示 */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[32px] border border-gray-100 dark:border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    <span>支付金額</span>
                    <span>訂單合計</span>
                  </div>
                  <div className="flex items-baseline space-x-1 text-orange-600">
                    <span className="text-lg font-black tracking-tighter">HK$</span>
                    <span className="text-4xl font-black tracking-tighter leading-none">
                      {checkoutOrder.totalPrice.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 pt-2 text-[10px] text-emerald-600 font-black uppercase">
                    <ShieldCheck size={14} />
                    <span>銀行級安全加密支付協議</span>
                  </div>
                </div>

                {/* 支付方式 */}
                <div className="space-y-3 px-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    選擇支付方式
                  </p>
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedMethod === m.id
                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10'
                        : 'border-gray-50 dark:border-white/5 bg-gray-50 dark:bg-slate-800/50'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-xl ${selectedMethod === m.id
                            ? 'bg-orange-500 text-white shadow-lg'
                            : 'bg-white dark:bg-slate-700 text-gray-400'
                            }`}
                        >
                          {m.icon}
                        </div>
                        <span
                          className={`font-black text-sm ${selectedMethod === m.id
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                          {m.label}
                        </span>
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
                  <span>確認支付 HK$ {checkoutOrder.totalPrice.toFixed(1)}</span>
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
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                    正在驗證銀行網關數據，請勿關閉...
                  </p>
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
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                      即將進入訂單中心...
                    </span>
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
                    onClick={() => {
                      setShowCheckout(false);
                      onNavigate(View.ORDERS, 'PENDING_PAY');
                    }}
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

export default OrdersView;