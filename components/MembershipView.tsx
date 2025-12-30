
import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  Sparkles, 
  Crown, 
  Zap, 
  ShieldCheck, 
  Heart, 
  Layout, 
  Headphones, 
  Check, 
  Star,
  Loader2,
  Gift,
  Trophy,
  UserCheck,
  Globe,
  Palette,
  XCircle,
  CreditCard,
  Apple,
  Chrome,
  CheckCircle2
} from 'lucide-react';
import { ViewHeader } from './shared/CommonUI';
import * as backend from '../backend';

interface MembershipViewProps {
  onBack: () => void;
  user: backend.UserInfo | null;
  onUpdateUser: (user: backend.UserInfo) => void;
}

type PaymentStatus = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

const MembershipView: React.FC<MembershipViewProps> = ({ onBack, user, onUpdateUser }) => {
  const [selectedPlan, setSelectedPlan] = useState<number>(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('IDLE');
  const [selectedMethod, setSelectedMethod] = useState<'APPLE' | 'GOOGLE' | 'CARD'>('APPLE');

  const plans = [
    { 
      id: 0, 
      title: '連續包月', 
      price: '18', 
      original: '25', 
      desc: '首月優惠, 隨時可退',
      benefits: [
        { icon: <Zap size={20} />, title: 'AI 基礎診斷', desc: '每月 30 次 AI 掃描額度' },
        { icon: <ShieldCheck size={20} />, title: '標準報告', desc: 'AI 深度分析不排隊' },
        { icon: <Star size={20} />, title: 'VIP 勳章', desc: '社區專屬身份標識' },
        { icon: <Layout size={20} />, title: '純淨模式', desc: 'APP 全界面無廣告體驗' },
      ]
    },
    { 
      id: 1, 
      title: '年度超值', 
      price: '168', 
      original: '300', 
      desc: '低至 ¥14/月', 
      badge: '最熱門',
      benefits: [
        { icon: <Zap size={20} />, title: '無限次 AI 診斷', desc: '糞便/皮膚 AI 掃描不限次數' },
        { icon: <ShieldCheck size={20} />, title: '專家報告加急', desc: '專屬綠色通道, 10分鐘出結果' },
        { icon: <Heart size={20} />, title: '高級健康追蹤', desc: '解鎖全生命週期發育曲線圖' },
        { icon: <Palette size={20} />, title: '年度專屬皮膚', desc: '琥珀金尊貴界面自定義' },
        { icon: <Trophy size={20} />, title: '成就體系', desc: '解鎖年度會員限定成就勳章' },
        { icon: <UserCheck size={20} />, title: '優先諮詢', desc: '線上醫療問題優先回覆權' },
      ]
    },
    { 
      id: 2, 
      title: '終身永久', 
      price: '488', 
      original: '999', 
      desc: '一次支付, 終身享有',
      benefits: [
        { icon: <Crown size={20} />, title: '至尊終身權益', desc: '永久解鎖所有 AI 核心功能' },
        { icon: <Headphones size={20} />, title: '1對1 養寵專家', desc: '24小時私人專家在線特權' },
        { icon: <Globe size={20} />, title: '全球急診地圖', desc: '解鎖海外 50+ 城市急診導航' },
        { icon: <Palette size={20} />, title: '全量皮膚包', desc: '永久擁有所有限量主題皮膚' },
        { icon: <Gift size={20} />, title: '線下禮包', desc: '每年贈送 PawPal 定製實物周邊' },
        { icon: <Check size={20} />, title: '先行者特權', desc: '新功能上線優先內測資格' },
      ]
    },
  ];

  const currentBenefits = useMemo(() => plans[selectedPlan].benefits, [selectedPlan]);

  const handleConfirmPayment = async () => {
    setPaymentStatus('PROCESSING');
    
    // 模擬網絡支付延遲
    await new Promise(res => setTimeout(res, 2000));
    
    if (user) {
      const updatedUser = {
        ...user,
        isVIP: true,
        vipLevel: selectedPlan === 2 ? 'LIFETIME' : 'SVIP',
        vipExpiry: selectedPlan === 2 ? '永久有效' : '2026-12-31'
      };
      
      setPaymentStatus('SUCCESS');
      onUpdateUser(updatedUser);
      
      // 成功後自動返回
      setTimeout(() => {
        setShowCheckout(false);
        onBack();
      }, 2000);
    }
  };

  const methods = [
    { id: 'APPLE', label: 'Apple Pay', icon: <Apple size={20} /> },
    { id: 'GOOGLE', label: 'Google Pay', icon: <Chrome size={20} /> },
    { id: 'CARD', label: '信用卡支付', icon: <CreditCard size={20} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center glass rounded-xl text-white/70">
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-lg font-black tracking-tight text-amber-100">超級會員中心</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto pb-44 scrollbar-hide">
        {/* User Status Card */}
        <div className="px-6 pt-6 mb-8">
          <div className="relative p-6 rounded-[32px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 animate-pulse opacity-90"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            
            <div className="relative flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img src={user?.avatar} className="w-14 h-14 rounded-2xl border-2 border-white/40 object-cover" alt="User" />
                  <div className="absolute -bottom-1 -right-1 bg-white text-amber-600 p-1 rounded-lg shadow-lg">
                    <Crown size={12} fill="currentColor" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{user?.name}</h3>
                  <p className="text-[10px] font-bold text-amber-100/70 uppercase tracking-widest">
                    {user?.isVIP ? `Premium ${user.vipLevel} Member` : 'Guest Member'}
                  </p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black border border-white/20">
                LV.{user?.level || 0}
              </div>
            </div>

            <div className="relative mt-8">
               <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-black text-amber-100/80">
                    {selectedPlan === 2 ? '享有終極 18 項頂級特權' : `當前方案含 ${currentBenefits.length} 項專屬權益`}
                  </span>
                  <span className="text-[10px] font-black text-amber-100/80 italic">PawPal AI · {plans[selectedPlan].title}</span>
               </div>
               <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${(currentBenefits.length / 6) * 100}%` }}></div>
               </div>
               <p className="mt-3 text-[10px] font-bold text-amber-100/60 leading-relaxed">
                 {user?.isVIP ? `您的會員服務將於 ${user.vipExpiry} 到期` : '切換不同方案，查看您的專屬 AI 升級路徑'}
               </p>
            </div>
          </div>
        </div>

        {/* Plans Selection */}
        <div className="mb-8">
          <h4 className="px-6 text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center">
            <Gift size={14} className="mr-2" /> 訂閱方案
          </h4>
          <div className="flex space-x-4 overflow-x-auto pb-8 pt-6 px-6 scrollbar-hide snap-x">
            {plans.map((p) => (
              <div 
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={`flex-shrink-0 w-40 p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer relative snap-center flex flex-col justify-between min-h-[160px] ${selectedPlan === p.id ? 'bg-amber-500/10 border-amber-500 scale-105 shadow-lg shadow-amber-500/10' : 'bg-white/5 border-white/10'}`}
              >
                {p.badge && (
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[9px] font-black px-3 py-1 rounded-full whitespace-nowrap shadow-xl">
                     {p.badge}
                   </div>
                )}
                <div>
                  <p className="text-[11px] font-black text-amber-100/70 mb-3">{p.title}</p>
                  <div className="flex items-baseline space-x-1 mb-1">
                    <span className="text-sm font-black">¥</span>
                    <span className="text-3xl font-black">{p.price}</span>
                  </div>
                  <p className="text-[10px] text-white/30 line-through mb-4">¥{p.original}</p>
                </div>
                <p className="text-[10px] text-amber-500 font-black leading-tight">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="px-6 mb-10">
          <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-6 flex items-center">
            <Sparkles size={14} className="mr-2" /> {plans[selectedPlan].title}·專屬權益
          </h4>
          <div 
            key={selectedPlan} 
            className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-500"
          >
            {currentBenefits.map((b, i) => (
              <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl transition-all hover:bg-white/10 group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {b.icon}
                </div>
                <h5 className="text-[11px] font-black text-amber-100 mb-1">{b.title}</h5>
                <p className="text-[9px] text-white/40 font-bold leading-tight">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Payment Action */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-950/90 backdrop-blur-2xl border-t border-white/5 z-[60]">
        <div className="max-w-md mx-auto space-y-4">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-2">
                 <Check size={14} className="text-amber-500" />
                 <span className="text-[10px] text-white/40 font-bold">同意《超級會員服務協議》與《自動續費條例》</span>
              </div>
           </div>
           <button 
             onClick={() => setShowCheckout(true)}
             className="w-full h-14 bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-950 rounded-2xl font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-3 active:scale-95 transition-all"
           >
             <Sparkles size={18} />
             <span>立即升級 ¥{plans[selectedPlan].price}</span>
           </button>
           <p className="text-center text-[9px] text-white/20 font-bold">支付失敗？聯繫官方技術支持：help@pawpal.ai</p>
        </div>
      </div>

      {/* 沉浸式收銀台彈出層 */}
      {showCheckout && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => paymentStatus === 'IDLE' && setShowCheckout(false)} />
          
          <div className="relative w-full max-w-md mx-auto bg-slate-900 rounded-t-[48px] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom-10 space-y-8 border-t border-white/10">
            
            {paymentStatus === 'IDLE' ? (
              <>
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-xl font-black text-amber-100">PawPal 尊享升級收銀台</h4>
                  <button onClick={() => setShowCheckout(false)} className="p-2 text-white/40 hover:text-white transition-colors"><XCircle size={24} /></button>
                </div>

                <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-white/40 text-xs font-black uppercase tracking-widest">
                    <span>訂閱方案</span>
                    <span>應付金額</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-black text-white">{plans[selectedPlan].title}</span>
                    <div className="flex items-baseline space-x-1 text-amber-500">
                      <span className="text-lg font-black tracking-tighter">¥</span>
                      <span className="text-4xl font-black tracking-tighter leading-none">{plans[selectedPlan].price}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-2 text-[10px] text-emerald-500 font-black uppercase">
                     <ShieldCheck size={14} />
                     <span>銀行級安全加密支付協議已啟動</span>
                  </div>
                </div>

                <div className="space-y-3 px-1">
                   <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">選擇支付方式</p>
                   {methods.map(m => (
                     <button 
                       key={m.id}
                       onClick={() => setSelectedMethod(m.id as any)}
                       className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedMethod === m.id ? 'border-amber-500 bg-amber-500/10' : 'border-white/5 bg-white/5'}`}
                     >
                       <div className="flex items-center space-x-3 text-white/70">
                         <div className={`p-2 rounded-xl ${selectedMethod === m.id ? 'bg-amber-500 text-slate-900 shadow-lg' : 'bg-slate-800 text-white/40'}`}>
                           {m.icon}
                         </div>
                         <span className={`font-black text-sm ${selectedMethod === m.id ? 'text-amber-400' : ''}`}>{m.label}</span>
                       </div>
                       {selectedMethod === m.id && <CheckCircle2 size={20} className="text-amber-500" />}
                     </button>
                   ))}
                </div>

                <button 
                  onClick={handleConfirmPayment}
                  className="w-full h-16 bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-950 rounded-[24px] font-black text-base shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-3"
                >
                  <CreditCard size={20} />
                  <span>確認支付並升級會員</span>
                </button>
              </>
            ) : paymentStatus === 'PROCESSING' ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-6 text-white">
                 <div className="relative">
                    <div className="w-20 h-20 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-amber-500">
                       <ShieldCheck size={32} />
                    </div>
                 </div>
                 <div className="text-center space-y-2">
                    <h4 className="text-lg font-black">正在對接支付網關</h4>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">正在驗證銀行簽署授權，請勿離開此頁面...</p>
                 </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center space-y-6 animate-in zoom-in duration-500 text-white">
                 <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20 animate-bounce">
                    <CheckCircle2 size={40} />
                 </div>
                 <div className="text-center space-y-2">
                    <h4 className="text-xl font-black text-emerald-400">升級成功！尊貴會員</h4>
                    <p className="text-sm text-white/60 font-bold leading-relaxed">
                      已為您解鎖 AI 無限次診斷權益<br />
                      <span className="text-[10px] text-white/30 uppercase tracking-widest mt-2 block">正在為您重載個人檔案...</span>
                    </p>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipView;
