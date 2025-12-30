
import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Heart,
  MapPin,
  PlusCircle,
  Menu,
  User,
  MessageSquare,
  BookOpen,
  Send,
  X,
  Pill,
  ChevronRight,
  Clock,
  ChevronUp,
  Crown,
  Compass
} from 'lucide-react';
import { View, DiaryEntry, Medication, Expense, WeightEntry, Appointment } from './types';
import * as backend from './backend';
import HomeView from './components/HomeView';
import HealthScanView from './components/HealthScanView';
import ScannerView from './components/ScannerView';
import TranslatorView from './components/TranslatorView';
import DiaryView from './components/DiaryView';
import InsuranceView from './components/InsuranceView';
import MapView from './components/MapView';
import ProfileView from './components/ProfileView';
import CommunityView from './components/CommunityView';
import SettingsView from './components/SettingsView';
import CalendarView from './components/CalendarView';
import PetProfileView from './components/PetProfileView';
import HistoryReportView from './components/HistoryReportView';
import MedicationView from './components/MedicationView';
import WalletView from './components/WalletView';
import AppointmentView from './components/AppointmentView';
import LoginView from './components/LoginView';
import MembershipView from './components/MembershipView';
import AlbumView from './components/AlbumView';
import DiscoveryView from './components/DiscoveryView';
import AIConsultantView from './components/AIConsultantView';
import ProductDetailView from './components/ProductDetailView';
import CartView from './components/CartView';
import CommunityHistoryView from './components/CommunityHistoryView';
import OrdersView from './components/OrdersView';
import LogisticsView from './components/LogisticsView';
import AddressView from './components/AddressView';
import PersonalInfoView from './components/PersonalInfoView';
import StarryMemorialView from './components/StarryMemorialView';
import SystemNoticeModal from './components/SystemNoticeModal';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [triggerPostModal, setTriggerPostModal] = useState(false);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  
  // 系統通知彈窗狀態
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);

  // --- 過渡動畫與導航路徑狀態 ---
  const [overlayStack, setOverlayStack] = useState<View[]>([]);
  const [isOverlayClosing, setIsOverlayClosing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedData, setSelectedData] = useState<any>(null);

  // --- 身份與狀態 ---
  const [user, setUser] = useState<backend.UserInfo | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- 業務數據 ---
  const [pets, setPets] = useState<backend.PetProfile[]>([]);
  const [selectedPet, setSelectedPet] = useState<backend.PetProfile | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        const currentUser = await backend.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsLoggedIn(true);
          const [initialPets, initialEntries, initialMeds, initialAppts, initialExpenses, initialWeight] = await Promise.all([
            backend.fetchPets(),
            backend.fetchDiaryEntries(),
            backend.fetchMedications(),
            backend.fetchAppointments(),
            backend.fetchExpenses(),
            backend.fetchWeightHistory()
          ]);
          setPets(initialPets);
          if (initialPets.length > 0) setSelectedPet(initialPets[0]);
          setEntries(initialEntries);
          setMedications(initialMeds);
          setAppointments(initialAppts);
          setExpenses(initialExpenses);
          setWeightHistory(initialWeight);

          // 模擬進入主頁後彈出公告
          setTimeout(() => {
            setIsNoticeOpen(true);
          }, 1000);
        }
      } catch (err) {
        console.error("Initialization failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, [isLoggedIn]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.replace('light', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.replace('dark', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      if (isFabOpen || overlayStack.length > 0) return;
      if (deltaY < -5) { setIsNavVisible(false); startY = currentY; }
      else if (deltaY > 5) { setIsNavVisible(true); startY = currentY; }
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isFabOpen, overlayStack.length]);

  const handleLogout = async () => {
    await backend.logout();
    setIsLoggedIn(false);
    setUser(null);
    setCurrentView(View.HOME);
    setOverlayStack([]);
  };

  const handleLoginSuccess = (userData: backend.UserInfo) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  // 統一導航邏輯：處理子視圖堆疊
  const handleNavigate = (view: View, data?: any) => {
    if ((view === View.PET_PROFILE || view === View.STARRY_MEMORIAL) && data) {
      setSelectedPet(data);
    }
    if (view === View.PRODUCT_DETAIL && data) {
      setSelectedId(data);
    }
    if (view === View.LOGISTICS && data) {
      setSelectedData(data);
    }
    if (view === View.ORDERS && data) {
      setSelectedId(data); // 用于传递初始Tab
    }

    const subViews = [
      View.MEDICATION,
      View.WALLET,
      View.APPOINTMENT,
      View.SETTINGS,
      View.PET_PROFILE,
      View.HISTORY_HEALTH,
      View.HISTORY_SCANNER,
      View.HISTORY_TRANSLATOR,
      View.DIARY,
      View.INSURANCE,
      View.MEMBERSHIP,
      View.ALBUM,
      View.MAP,
      View.AI_CONSULTANT,
      View.PRODUCT_DETAIL,
      View.CART,
      View.COMMUNITY_HISTORY,
      View.ORDERS,
      View.LOGISTICS,
      View.ADDRESS,
      View.PERSONAL_INFO,
      View.STARRY_MEMORIAL
    ];

    if (subViews.includes(view)) {
      setOverlayStack(prev => [...prev, view]);
      setIsOverlayClosing(false);
    } else {
      setCurrentView(view);
      setIsNavVisible(true);
      setOverlayStack([]);
    }
  };

  const handleBackWithAnimation = () => {
    setIsOverlayClosing(true);
    setTimeout(() => {
      setOverlayStack(prev => prev.slice(0, -1));
      setIsOverlayClosing(false);
      setIsNavVisible(true);
      // 刷新用戶狀態以防 VIP 更新
      backend.getCurrentUser().then(setUser);
    }, 300);
  };

  const handleDateClick = (date: string) => {
    const hasDiary = entries.some(e => e.date === date);
    const hasMeds = medications.some(m => m.date === date);
    const hasAppts = appointments.some(a => a.date === date);
    setSelectedDate(date);
    const activeCount = [hasDiary, hasMeds, hasAppts].filter(Boolean).length;
    if (activeCount > 1) { setShowDateSelector(true); }
    else if (hasDiary) { handleNavigate(View.DIARY); }
    else if (hasMeds) { handleNavigate(View.MEDICATION); }
    else if (hasAppts) { handleNavigate(View.APPOINTMENT); }
  };

  const renderView = (view: View, isOverlay: boolean = false) => {
    const backFn = isOverlay ? handleBackWithAnimation : () => setCurrentView(View.HOME);

    switch (view) {
      case View.HOME: return <HomeView onNavigate={handleNavigate} entries={entries} medications={medications} pets={pets} user={user} />;
      case View.HEALTH_SCAN: return <HealthScanView onBack={backFn} onNavigate={handleNavigate} pets={pets} />;
      case View.SCANNER: return <ScannerView onBack={backFn} onNavigate={handleNavigate} />;
      case View.TRANSLATOR: return <TranslatorView onBack={backFn} onNavigate={handleNavigate} pets={pets} />;
      case View.DIARY: return <DiaryView onBack={backFn} onNavigate={handleNavigate} entries={entries} setEntries={setEntries} filterDate={selectedDate} />;
      case View.INSURANCE: return <InsuranceView onBack={backFn} />;
      case View.MAP: return <MapView onBack={backFn} />;
      case View.COMMUNITY: return <CommunityView onBack={backFn} onNavigate={handleNavigate} initialOpenPost={triggerPostModal} onModalClose={() => setTriggerPostModal(false)} />;
      case View.PROFILE: return <ProfileView onBack={backFn} onNavigate={handleNavigate} appointments={appointments} onLogout={handleLogout} pets={pets} setPets={setPets} onUpdateUser={setUser} />;
      case View.SETTINGS: return <SettingsView onBack={backFn} onNavigate={handleNavigate} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} />;
      case View.CALENDAR: return <CalendarView onBack={backFn} entries={entries} medications={medications} appointments={appointments} onDateClick={handleDateClick} />;
      case View.PET_PROFILE: return <PetProfileView onBack={backFn} weightHistory={weightHistory} setWeightHistory={setWeightHistory} initialPet={selectedPet} />;
      case View.MEDICATION: return <MedicationView onBack={backFn} medications={medications} setMedications={setMedications} pets={pets} filterDate={selectedDate} />;
      case View.WALLET: return <WalletView onBack={backFn} expenses={expenses} setExpenses={setExpenses} pets={pets} />;
      case View.HISTORY_HEALTH: return <HistoryReportView type="HEALTH" onBack={backFn} pets={pets} />;
      case View.HISTORY_SCANNER: return <HistoryReportView type="SCANNER" onBack={backFn} pets={pets} />;
      case View.HISTORY_TRANSLATOR: return <HistoryReportView type="TRANSLATOR" onBack={backFn} pets={pets} />;
      case View.APPOINTMENT: return <AppointmentView onBack={backFn} appointments={appointments} setAppointments={setAppointments} />;
      case View.MEMBERSHIP: return <MembershipView onBack={backFn} user={user} onUpdateUser={setUser} />;
      case View.ALBUM: return <AlbumView onBack={backFn} />;
      case View.DISCOVERY: return <DiscoveryView onNavigate={handleNavigate} />;
      case View.AI_CONSULTANT: return <AIConsultantView onBack={backFn} pets={pets} />;
      case View.PRODUCT_DETAIL: return <ProductDetailView productId={selectedId!} onBack={backFn} onNavigate={handleNavigate} />;
      case View.CART: return <CartView onBack={backFn} onNavigate={handleNavigate} />;
      case View.COMMUNITY_HISTORY: return <CommunityHistoryView onBack={backFn} />;
      case View.ORDERS: 
        // 用户要求从订单页返回时去往个人信息中心
        return <OrdersView 
          onBack={() => {
            setIsOverlayClosing(true);
            setTimeout(() => {
              setCurrentView(View.PROFILE);
              setOverlayStack([]);
              setIsOverlayClosing(false);
            }, 300);
          }} 
          onNavigate={handleNavigate} 
          initialTab={selectedId || 'ALL'} 
        />;
      case View.LOGISTICS: return <LogisticsView onBack={backFn} order={selectedData} />;
      case View.ADDRESS: return <AddressView onBack={backFn} />;
      case View.PERSONAL_INFO: return <PersonalInfoView onBack={backFn} user={user} onUpdateUser={setUser} />;
      case View.STARRY_MEMORIAL: return <StarryMemorialView onBack={backFn} pet={selectedPet} />;
      default: return <HomeView onNavigate={handleNavigate} entries={entries} medications={medications} pets={pets} user={user} />;
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => { setIsFabOpen(false); setSelectedDate(null); handleNavigate(view); }}
        className={`flex flex-col items-center justify-center flex-1 min-h-[56px] transition-all duration-300 clickable ${isActive ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}
      >
        <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-orange-50/80 dark:bg-orange-500/10 scale-105' : ''}`}>
          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className="text-[9px] font-black tracking-tight mt-0.5">{label}</span>
      </button>
    );
  };

  if (!isLoggedIn && !isLoading) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative shadow-2xl transition-colors duration-500 bg-transparent overflow-hidden">
      {!isLoading && ![View.PROFILE, View.SETTINGS, View.HEALTH_SCAN, View.MAP, View.CALENDAR, View.PET_PROFILE, View.HISTORY_HEALTH, View.HISTORY_SCANNER, View.HISTORY_TRANSLATOR, View.WALLET, View.MEDICATION, View.APPOINTMENT, View.INSURANCE, View.MEMBERSHIP, View.ALBUM, View.AI_CONSULTANT, View.PRODUCT_DETAIL, View.CART, View.COMMUNITY_HISTORY, View.ORDERS, View.LOGISTICS, View.ADDRESS, View.PERSONAL_INFO, View.STARRY_MEMORIAL].includes(currentView) && (
        <header className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl px-6 py-4 flex items-center justify-between border-b border-white/20 dark:border-white/5 w-full max-w-md">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-none clickable" onClick={() => setCurrentView(View.HOME)}>
              <Heart className="text-white" size={18} fill="currentColor" />
            </div>
            <h1 className="text-xl font-black text-gray-800 dark:text-white tracking-tight italic">PawPal <span className="text-orange-500 text-sm not-italic">AI</span></h1>
          </div>

          {/* 會員身份快捷展示 */}
          <div className="flex items-center space-x-2">
            <div className="flex flex-col items-end mr-1 clickable" onClick={() => handleNavigate(View.PROFILE)}>
              <span className="text-[10px] font-black text-gray-800 dark:text-white leading-none">{user?.name}</span>
              {user?.isVIP && (
                <div className="flex items-center bg-gradient-to-r from-amber-400 to-yellow-600 text-white px-1.5 py-0.5 rounded shadow-sm mt-0.5 scale-75 origin-right">
                  <Crown size={8} className="mr-0.5" fill="currentColor" />
                  <span className="text-[7px] font-black uppercase tracking-tighter">{user.vipLevel}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleNavigate(View.MAP)}
                className="text-gray-500 dark:text-gray-400 p-2.5 glass rounded-xl clickable hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                aria-label="附近醫院"
              >
                <MapPin size={22} />
              </button>
              <button onClick={() => handleNavigate(View.SETTINGS)} className="text-gray-500 dark:text-gray-400 p-2.5 glass rounded-xl clickable"><Menu size={22} /></button>
            </div>
          </div>
        </header>
      )}
      <div className="h-16"></div> {/* 占位元素，高度与 header 相同 */}
      <main className="flex-1 pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 pt-40">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-black text-gray-400">正在同步雲端檔案...</p>
          </div>
        ) : renderView(currentView)}
      </main>

      {/* 遮罩過渡層：支持堆疊導航 */}
      {overlayStack.map((view, index) => {
        const isTop = index === overlayStack.length - 1;
        return (
          <div
            key={`${view}-${index}`}
            className={`fixed inset-0 z-[80] bg-white dark:bg-slate-950 flex flex-col ${isTop && isOverlayClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}
            style={{ zIndex: 80 + index }}
          >
            {renderView(view, true)}
          </div>
        );
      })}

      {/* Date Action Selector Modal */}
      {showDateSelector && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setShowDateSelector(false)} />
          <div className="relative glass rounded-[40px] p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[80vh] overflow-y-auto scrollbar-hide">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-gray-800 dark:text-white">時光檔案選擇</h3>
              <p className="text-xs font-bold text-gray-400">{selectedDate} 有多個記錄喔</p>
            </div>
            <div className="flex flex-col gap-3">
              {entries.find(e => e.date === selectedDate) && (
                <button onClick={() => { setShowDateSelector(false); handleNavigate(View.DIARY); }} className="w-full glass p-5 rounded-[32px] flex items-center space-x-5 border border-orange-100/50 hover:bg-orange-50/50 transition-colors group text-left">
                  <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 transition-transform"><BookOpen size={28} /></div>
                  <div className="flex-1 min-w-0"><h4 className="font-black text-sm text-gray-800 mb-0.5">查看日記</h4><p className="text-[11px] font-bold text-gray-400 truncate">回味這天的萌寵時光</p></div>
                </button>
              )}
              {medications.filter(m => m.date === selectedDate).length > 0 && (
                <button onClick={() => { setShowDateSelector(false); handleNavigate(View.MEDICATION); }} className="w-full glass p-5 rounded-[32px] flex items-center space-x-5 border border-indigo-100/50 hover:bg-indigo-50/50 transition-colors group text-left">
                  <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 transition-transform"><Pill size={24} /></div>
                  <div className="flex-1 min-w-0"><h4 className="font-black text-sm text-gray-800 mb-0.5">用藥詳情</h4><p className="text-[11px] font-bold text-gray-400 truncate">查看當日服藥提醒</p></div>
                </button>
              )}
              {appointments.filter(a => a.date === selectedDate).length > 0 && (
                <button onClick={() => { setShowDateSelector(false); handleNavigate(View.APPOINTMENT); }} className="w-full glass p-5 rounded-[32px] flex items-center space-x-5 border border-rose-100/50 hover:bg-rose-50/50 transition-colors group text-left">
                  <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 transition-transform"><Clock size={28} /></div>
                  <div className="flex-1 min-w-0"><h4 className="font-black text-sm text-gray-800 mb-0.5">預約詳情</h4><p className="text-[11px] font-bold text-gray-400 truncate">查看醫院預約記錄</p></div>
                </button>
              )}
            </div>
            <button onClick={() => setShowDateSelector(false)} className="w-full py-4 text-gray-400 font-black text-xs uppercase tracking-widest">取消</button>
          </div>
        </div>
      )}

      {/* FAB Overlay */}
      {isFabOpen && (
        <div className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-[4px] animate-fade-in" onClick={() => setIsFabOpen(false)}>
          <button onClick={(e) => { e.stopPropagation(); setSelectedDate(null); handleNavigate(View.DIARY); setIsFabOpen(false); }} className="absolute bottom-20 left-1/2 -ml-28 bg-white dark:bg-slate-800 w-24 h-24 rounded-[28px] shadow-2xl flex flex-col items-center justify-center space-y-2 border border-white/40 dark:border-white/10 animate-pop-left clickable z-[60]">
            <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><BookOpen size={20} /></div>
            <span className="font-black text-[10px] text-gray-700 dark:text-white">寫萌寵日記</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); setTriggerPostModal(true); handleNavigate(View.COMMUNITY); setIsFabOpen(false); }} className="absolute bottom-20 left-1/2 ml-4 bg-white dark:bg-slate-800 w-24 h-24 rounded-[28px] shadow-2xl flex flex-col items-center justify-center space-y-2 border border-white/40 dark:border-white/10 animate-pop-right clickable z-[60]">
            <div className="w-10 h-10 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500"><Send size={20} /></div>
            <span className="font-black text-[10px] text-gray-700 dark:text-white">發社群動態</span>
          </button>
        </div>
      )}

      {/* 導覽列容器 */}
      {!isLoading && overlayStack.length === 0 && (
        <div className="fixed bottom-4 left-6 right-6 max-w-[calc(448px-3rem)] mx-auto z-[70]">
          <nav className={`glass rounded-[28px] px-2 py-1 flex items-center justify-around shadow-2xl border-white/60 transition-all duration-500 ease-in-out transform ${isNavVisible ? 'translate-y-0 opacity-100' : 'translate-y-[150%] opacity-0 pointer-events-none'}`}>
            <NavItem view={View.HOME} icon={Home} label="首頁" />
            <NavItem view={View.DISCOVERY} icon={Compass} label="探索" />
            <div className="flex-1 flex justify-center items-center">
              <button onClick={() => setIsFabOpen(!isFabOpen)} className={`w-12 h-12 bg-orange-500 text-white rounded-[20px] shadow-2xl flex items-center justify-center clickable transition-all duration-500 ${isFabOpen ? 'rotate-45 scale-110 bg-rose-500' : ''}`}>
                {isFabOpen ? <X size={24} /> : <PlusCircle size={24} />}
              </button>
            </div>
            <NavItem view={View.COMMUNITY} icon={MessageSquare} label="社群" />
            <NavItem view={View.PROFILE} icon={User} label="我的" />
          </nav>
        </div>
      )}

      {/* 系統通知/更新彈窗 */}
      <SystemNoticeModal 
        isOpen={isNoticeOpen}
        onClose={() => setIsNoticeOpen(false)}
        type="UPDATE"
        version="2.2.8"
        title="PawPal AI 重大升級"
        sections={[
          { 
            type: 'text', 
            content: '我們為您準備了全新的版本，這是一次關於陪伴質量的深度進化。AI 核心引擎已全面升級至 Gemini 3 系列。' 
          },
          {
            type: 'image',
            content: 'https://picsum.photos/seed/pawpal_upd/600/300'
          },
          {
            type: 'text',
            content: '以下是本次更新的核心亮點：'
          },
          {
            type: 'list',
            content: [
              "視覺重構：更細膩的毛玻璃質感與動態流光邊框",
              "支付進化：全新的電子購物籃與「銀行級」模擬支付流",
              "星空館 2.0：支持靈魂對話，讓思念跨越時空",
              "AI 顧問：響應速度提升 40%，回答更具共情力"
            ]
          }
        ]}
        actionLabel="立即探索新功能"
      />
    </div>
  );
};

export default App;
